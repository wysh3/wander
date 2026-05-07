from app.models.user import User
from app.services.matching.scoring import personality_similarity as weighted_similarity
import random
import math
import numpy as np
from scipy.cluster.hierarchy import fcluster, linkage


def greedy_annealing_solution(users: list[User], hosts: list[int], activity) -> list:
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

    # Step 1: Hierarchical clustering for seed groups
    vectors = []
    for u in users:
        pv = u.personality_vector
        if pv is not None and len(pv) == 5:
            vectors.append(pv)
        else:
            vectors.append([0.5, 0.5, 0.5, 0.5, 0.5])

    v_array = np.array(vectors)
    linkage_matrix = linkage(v_array, method="ward")

    if n <= n_groups:
        cluster_labels = np.arange(n) % n_groups
    else:
        cluster_labels = fcluster(linkage_matrix, n_groups, criterion="maxclust") - 1

    groups = [[] for _ in range(n_groups)]
    all_indices = list(range(min(n, max_capacity)))
    for idx in all_indices:
        g = cluster_labels[idx] % n_groups
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
        g1, g2 = random.sample(range(n_groups), 2)
        if not groups[g1] or not groups[g2]:
            continue

        u1_idx = random.randrange(len(groups[g1]))
        u2_idx = random.randrange(len(groups[g2]))

        groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]

        # Validate size constraints
        if len(groups[g1]) > K_max or len(groups[g2]) > K_max or len(groups[g1]) < K_min or len(groups[g2]) < K_min:
            groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]
            continue

        new_score = sum(group_weighted_similarity(g, users) for g in groups)
        delta = new_score - current_score

        if delta > 0 or (T > 0 and random.random() < math.exp(delta / T)):
            current_score = new_score
        else:
            groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]

        T *= 0.995

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
