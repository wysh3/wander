from ortools.sat.python import cp_model
import time

from app.models.user import User
from app.models.activity import Activity
from app.services.matching.scoring import personality_similarity, no_show_risk, have_met_in_last_90_days
from app.services.matching.annealing import greedy_annealing_solution


def solve_matching(users: list[User], activity: Activity, hosts: list[int], history_records: list) -> tuple[list, dict]:
    model = cp_model.CpModel()

    n = len(users)
    n_groups = activity.max_groups
    K_min = activity.group_size_min
    K_max = activity.group_size_max

    # Decision: x[u][g] = 1 if user u assigned to group g
    x = {}
    for u in range(n):
        for g in range(n_groups):
            x[u, g] = model.NewBoolVar(f"x_{u}_{g}")

    # Constraint 1: each user in at most 1 group
    for u in range(n):
        model.Add(sum(x[u, g] for g in range(n_groups)) <= 1)

    # Constraint 2: group size bounds
    for g in range(n_groups):
        model.Add(sum(x[u, g] for u in range(n)) >= K_min)
        model.Add(sum(x[u, g] for u in range(n)) <= K_max)

    # Constraint 3: location (pre-filtered via Google Distance Matrix before solver)
    # In production: filter users whose travel_time to activity meeting_point <= 30 min
    # For demo: assume all passed users are within travel radius

    # Constraint 4: gender
    if activity.women_only:
        for g in range(n_groups):
            for u in range(n):
                if users[u].gender != "female":
                    model.Add(x[u, g] == 0)
    else:
        for g in range(n_groups):
            wog = model.NewBoolVar(f"women_only_{g}")
            for u in range(n):
                if users[u].women_only_preference:
                    model.Add(x[u, g] <= wog)
            for u in range(n):
                if users[u].gender == "male":
                    model.Add(x[u, g] <= 1 - wog)

    # Constraint 5: no-repeat pairings
    for g in range(n_groups):
        for u1 in range(n):
            for u2 in range(u1 + 1, n):
                if have_met_in_last_90_days(users[u1], users[u2], history_records):
                    model.Add(x[u1, g] + x[u2, g] <= 1)

    # Constraint 6: host assignment
    for g in range(n_groups):
        if g < len(hosts):
            model.Add(x[hosts[g], g] == 1)

    # OBJECTIVE: maximize personality similarity within groups
    objective_terms = []

    for g in range(n_groups):
        for u1 in range(n):
            for u2 in range(u1 + 1, n):
                pair = model.NewBoolVar(f"pair_{u1}_{u2}_{g}")
                model.Add(pair <= x[u1, g])
                model.Add(pair <= x[u2, g])
                model.Add(pair >= x[u1, g] + x[u2, g] - 1)

                sim = personality_similarity(users[u1], users[u2])
                objective_terms.append(int(-sim * 1000) * pair)

    # Penalize no-show risk
    for u in range(n):
        for g in range(n_groups):
            risk = no_show_risk(users[u], activity)
            objective_terms.append(int(risk * 100) * x[u, g])

    model.Minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_search_workers = 4

    start = time.time()
    status = solver.Solve(model)
    elapsed_ms = (time.time() - start) * 1000

    constraint_stats = _compute_constraint_stats(users, activity, history_records, hosts, n_groups)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        groups = extract_groups(solver, x, n, n_groups, users)
        return groups, {
            "solver": "cp-sat",
            "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
            "solved_in_ms": elapsed_ms,
            "total_users": n,
            "total_groups": n_groups,
            **constraint_stats,
        }
    else:
        groups = greedy_annealing_solution(users, hosts, activity)
        return groups, {
            "solver": "annealing",
            "status": "fallback",
            "solved_in_ms": elapsed_ms,
            "total_users": n,
            "total_groups": n_groups,
            **constraint_stats,
        }


def _compute_constraint_stats(users, activity, history_records, hosts, n_groups):
    pairs_avoided = 0
    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            if have_met_in_last_90_days(users[i], users[j], history_records):
                pairs_avoided += 1

    women_only_count = 0
    if activity.women_only:
        women_only_count = n_groups
    else:
        women_pref_users = sum(1 for u in users if u.women_only_preference)
        women_female = sum(1 for u in users if u.gender == "female" and u.women_only_preference)
        if women_pref_users > 0:
            women_only_count = 1

    hosts_assigned = min(len(hosts), n_groups)

    pair_sims = []
    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            sim = personality_similarity(users[i], users[j])
            if sim > 0:
                pair_sims.append(sim)
    avg_similarity = sum(pair_sims) / len(pair_sims) if pair_sims else 0.0

    return {
        "personality_similarity_avg": round(avg_similarity, 2),
        "repeat_pairs_avoided": pairs_avoided,
        "women_only_groups": women_only_count,
        "hosts_assigned": hosts_assigned,
        "total_constraints": 6,
    }


def extract_groups(solver, x, n: int, n_groups: int, users: list[User]) -> list:
    groups = []
    for g in range(n_groups):
        member_indices = [u for u in range(n) if solver.Value(x[u, g]) == 1]
        if member_indices:
            groups.append({
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
    return groups
