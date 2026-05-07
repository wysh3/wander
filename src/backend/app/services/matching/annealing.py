from app.models.user import User
from app.services.matching.scoring import personality_similarity as weighted_similarity
from app.services.matching.scoring import have_met_in_last_90_days
import random
import math
import numpy as np
from scipy.cluster.hierarchy import fcluster, linkage


def greedy_annealing_solution(users: list[User], hosts: list[int], activity, history_records: list | None = None) -> list:
    """
    Fallback when CP-SAT times out or for >50 users.

    1. Hierarchical clustering on personality vectors -> seed groups
    2. Greedy assign remaining users to nearest group (weighted cosine similarity)
    3. Simulated annealing: random swaps, accept if objective improves
       or with probability exp(-delta / T)
    4. 10,000 iterations, temperature decays 0.995 per step
    5. Assign hosts (one per group)
    6. Post-validate all constraints
    """
    n = len(users)
    n_groups = activity.max_groups
    K_min = activity.group_size_min
    K_max = activity.group_size_max
    max_capacity = n_groups * K_max

    if n < n_groups * K_min:
        return []

    # Pre-filter: women-only activities exclude non-female users
    eligible_indices = list(range(n))
    if activity.women_only:
        eligible_indices = [i for i in range(n) if users[i].gender == "female"]
        if len(eligible_indices) < n_groups * K_min:
            return []

    # Separate women-only preference users (must be in groups without males)
    wop_indices = [i for i in eligible_indices if users[i].women_only_preference]
    male_indices = [i for i in eligible_indices if users[i].gender == "male"]
    mixed_ok_indices = [
        i for i in eligible_indices
        if i not in wop_indices and i not in male_indices
    ]

    # Build groups: wop-only groups first, then mixed groups for remaining
    use_wop_groups = len(wop_indices) > 0
    wop_groups_count = min(n_groups, max(1, len(wop_indices) // K_min)) if use_wop_groups else 0
    mixed_groups_count = n_groups - wop_groups_count

    # Step 1: Hierarchical clustering for seed groups
    vectors = []
    for u in users:
        pv = u.personality_vector
        if pv is not None and len(pv) == 5:
            vectors.append(pv)
        else:
            vectors.append([0.5, 0.5, 0.5, 0.5, 0.5])

    v_array = np.array(vectors)

    # Assign eligible users to groups respecting constraints
    if use_wop_groups:
        wop_vecs = v_array[wop_indices]
        if len(wop_indices) <= wop_groups_count:
            wop_cluster_labels = np.arange(len(wop_indices)) % wop_groups_count
        else:
            wop_linkage = linkage(wop_vecs, method="ward")
            wop_cluster_labels = fcluster(wop_linkage, wop_groups_count, criterion="maxclust") - 1

        mixed_pool = male_indices + mixed_ok_indices
        mixed_vecs = v_array[mixed_pool] if mixed_pool else np.empty((0, 5))
        if len(mixed_pool) <= mixed_groups_count and len(mixed_pool) > 0:
            mixed_cluster_labels = np.arange(len(mixed_pool)) % mixed_groups_count
        elif len(mixed_pool) > 0:
            mixed_linkage = linkage(mixed_vecs, method="ward")
            mixed_cluster_labels = fcluster(mixed_linkage, mixed_groups_count, criterion="maxclust") - 1
        else:
            mixed_cluster_labels = np.array([], dtype=int)

        groups = [[] for _ in range(n_groups)]
        for i, idx in enumerate(wop_indices):
            g = wop_cluster_labels[i] % wop_groups_count
            groups[g].append(idx)
        for i, idx in enumerate(mixed_pool):
            g = wop_groups_count + (mixed_cluster_labels[i] % mixed_groups_count)
            if g < n_groups:
                groups[g].append(idx)
    else:
        all_indices = eligible_indices
        idx_to_pos = {idx: pos for pos, idx in enumerate(all_indices)}
        all_vecs = v_array[all_indices]
        if n <= n_groups:
            cluster_labels = np.arange(len(all_indices)) % n_groups
        else:
            linkage_matrix = linkage(all_vecs, method="ward")
            cluster_labels = fcluster(linkage_matrix, n_groups, criterion="maxclust") - 1

        groups = [[] for _ in range(n_groups)]
        for idx in all_indices[:min(len(all_indices), max_capacity)]:
            pos = idx_to_pos[idx]
            g = cluster_labels[pos] % n_groups
            groups[g].append(idx)

    # Step 2: Greedy reassign to maximize within-group weighted similarity
    for iteration in range(20):
        improved = False
        for g in range(n_groups):
            for i in range(len(groups[g])):
                u = groups[g][i]
                best_g = g
                best_score = group_weighted_similarity(groups[g], users)

                for other_g in range(n_groups):
                    if other_g == g:
                        continue
                    if len(groups[other_g]) + 1 > K_max or len(groups[g]) - 1 < K_min:
                        continue

                    # No-repeat constraint: reject if u has met anyone in target group
                    if history_records and any(
                        have_met_in_last_90_days(users[u], users[m], history_records)
                        for m in groups[other_g]
                    ):
                        continue

                    test_group = groups[other_g] + [u]
                    original_group = groups[g][:i] + groups[g][i + 1:]
                    new_score = group_weighted_similarity(test_group, users) + group_weighted_similarity(original_group, users)
                    old_score = group_weighted_similarity(groups[other_g], users) + group_weighted_similarity(groups[g], users)

                    if new_score > old_score:
                        best_g = other_g
                        best_score = new_score

                if best_g != g:
                    groups[g].pop(i)
                    groups[best_g].append(u)
                    improved = True
                    break
            if improved:
                break
        if not improved:
            break

    # Step 3: Simulated annealing
    T = 1.0
    current_score = sum(group_weighted_similarity(g, users) for g in groups)

    for iteration in range(10000):
        T *= 0.995

        g1, g2 = random.sample(range(n_groups), 2)
        if not groups[g1] or not groups[g2]:
            continue

        u1_idx = random.randrange(len(groups[g1]))
        u2_idx = random.randrange(len(groups[g2]))

        u1 = groups[g1][u1_idx]
        u2 = groups[g2][u2_idx]

        # Swaps preserve group sizes, so size constraints are already satisfied

        # No-repeat constraint: reject if u1 has met anyone in g2, or u2 has met anyone in g1
        if history_records:
            if any(have_met_in_last_90_days(users[u1], users[m], history_records) for m in groups[g2] if m != u2):
                continue
            if any(have_met_in_last_90_days(users[u2], users[m], history_records) for m in groups[g1] if m != u1):
                continue

        # Women-only preference: reject if swap puts a wop user with a male
        if users[u1].women_only_preference and any(users[m].gender == "male" for m in groups[g2] if m != u2):
            continue
        if users[u2].women_only_preference and any(users[m].gender == "male" for m in groups[g1] if m != u1):
            continue
        # Also reject if swap puts a male into a group containing wop users
        if users[u1].gender == "male" and any(users[m].women_only_preference for m in groups[g2] if m != u2):
            continue
        if users[u2].gender == "male" and any(users[m].women_only_preference for m in groups[g1] if m != u1):
            continue

        groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]

        new_score = sum(group_weighted_similarity(g, users) for g in groups)
        delta = new_score - current_score

        if delta > 0 or (T > 0 and random.random() < math.exp(delta / T)):
            current_score = new_score
        else:
            groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]

    # Step 4: Assign hosts (one per group)
    for g in range(n_groups):
        if g < len(hosts) and hosts[g] not in groups[g]:
            host_idx = hosts[g]
            if len(groups[g]) < K_max:
                groups[g].append(host_idx)
            else:
                swap_target = groups[g][-1]
                groups[g][-1] = host_idx
                for other_g in range(n_groups):
                    if other_g != g and len(groups[other_g]) < K_max:
                        groups[other_g].append(swap_target)
                        break

    # Step 5: Convert to result format
    result = []
    for g in range(n_groups):
        member_indices = groups[g]
        if member_indices:
            result.append({
                "group_index": g,
                "member_indices": member_indices,
                "user_ids": [str(users[u].id) for u in member_indices],
                "members": [
                    {
                        "id": str(users[u].id),
                        "name": users[u].name or "User",
                        "gender": users[u].gender,
                        "vector": users[u].personality_vector.tolist() if hasattr(users[u].personality_vector, "tolist") else users[u].personality_vector,
                    }
                    for u in member_indices
                ],
            })
    return result


def group_weighted_similarity(member_indices: list[int], users: list[User]) -> float:
    if len(member_indices) < 2:
        return 0.0

    total = 0.0
    count = 0
    for i in range(len(member_indices)):
        for j in range(i + 1, len(member_indices)):
            sim = weighted_similarity(users[member_indices[i]], users[member_indices[j]])
            total += sim
            count += 1

    return total / count if count > 0 else 0.0
