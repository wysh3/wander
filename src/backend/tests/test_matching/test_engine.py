import pytest
import uuid
from unittest.mock import MagicMock
from datetime import datetime, timedelta

from app.services.matching.engine import solve_matching
from app.services.matching.scoring import personality_similarity, no_show_risk
from app.services.matching.annealing import greedy_annealing_solution, group_weighted_similarity
from app.models.user import User
from app.models.activity import Activity


def make_user(name: str, vector: list[float], gender: str = "female") -> User:
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.name = name
    user.personality_vector = vector
    user.gender = gender
    user.women_only_preference = False
    user.total_experiences = 3
    return user


def make_activity(max_groups: int = 3, K_min: int = 4, K_max: int = 8) -> Activity:
    activity = MagicMock(spec=Activity)
    activity.max_groups = max_groups
    activity.group_size_min = K_min
    activity.group_size_max = K_max
    activity.women_only = False
    activity.scheduled_at = datetime.utcnow() + timedelta(days=2)
    return activity


class TestPersonalitySimilarity:
    def test_identical_vectors(self):
        u1 = make_user("A", [0.5, 0.5, 0.5, 0.5, 0.5])
        u2 = make_user("B", [0.5, 0.5, 0.5, 0.5, 0.5])
        assert personality_similarity(u1, u2) == pytest.approx(1.0)

    def test_opposite_vectors(self):
        u1 = make_user("A", [1.0, 0.0, 0.0, 0.0, 0.0])
        u2 = make_user("B", [0.0, 1.0, 0.0, 0.0, 0.0])
        sim = personality_similarity(u1, u2)
        assert 0.0 <= sim <= 1.0

    def test_missing_vector(self):
        u1 = make_user("A", None)
        u2 = make_user("B", [0.5, 0.5, 0.5, 0.5, 0.5])
        assert personality_similarity(u1, u2) == 0.0


class TestNoShowRisk:
    def test_regular_user(self):
        user = make_user("A", [0.5, 0.5, 0.5, 0.5, 0.5])
        activity = make_activity()
        risk = no_show_risk(user, activity)
        assert 0.0 <= risk <= 0.40

    def test_first_timer(self):
        user = make_user("A", [0.5, 0.5, 0.5, 0.5, 0.5])
        user.total_experiences = 0
        activity = make_activity()
        risk = no_show_risk(user, activity)
        assert risk > 0.10


class TestCP_SAT_Matching:
    def test_12_users_2_groups(self):
        users = [
            make_user("P1", [0.72, 0.65, 0.70, 0.82, 0.78]),
            make_user("P2", [0.70, 0.60, 0.65, 0.80, 0.75]),
            make_user("P3", [0.75, 0.70, 0.80, 0.85, 0.70]),
            make_user("P4", [0.80, 0.75, 0.60, 0.65, 0.80]),
            make_user("P5", [0.55, 0.50, 0.75, 0.80, 0.85]),
            make_user("P6", [0.85, 0.80, 0.70, 0.55, 0.60]),
            make_user("P7", [0.60, 0.55, 0.85, 0.70, 0.75]),
            make_user("P8", [0.78, 0.72, 0.68, 0.80, 0.82]),
            make_user("P9", [0.65, 0.60, 0.72, 0.78, 0.80]),
            make_user("P10", [0.82, 0.78, 0.55, 0.60, 0.72]),
            make_user("P11", [0.58, 0.52, 0.80, 0.85, 0.78]),
            make_user("P12", [0.76, 0.68, 0.62, 0.75, 0.85]),
        ]
        activity = make_activity(max_groups=2, K_min=4, K_max=8)
        hosts = [0, 1]
        history_records = []

        groups, stats = solve_matching(users, activity, hosts, history_records)

        assert len(groups) > 0
        assert stats["total_users"] == 12
        assert stats["solved_in_ms"] < 5000

        for group in groups:
            assert 4 <= len(group["member_indices"]) <= 8
            assert hosts[group["group_index"]] in group["member_indices"]

    def test_women_only_constraint(self):
        users = [
            make_user("F1", [0.72, 0.65, 0.70, 0.82, 0.78], "female"),
            make_user("F2", [0.70, 0.60, 0.65, 0.80, 0.75], "female"),
            make_user("F3", [0.75, 0.70, 0.80, 0.85, 0.70], "female"),
            make_user("F4", [0.80, 0.75, 0.60, 0.65, 0.80], "female"),
            make_user("F5", [0.55, 0.50, 0.75, 0.80, 0.85], "female"),
            make_user("F6", [0.85, 0.80, 0.70, 0.55, 0.60], "female"),
            make_user("F7", [0.60, 0.55, 0.85, 0.70, 0.75], "female"),
            make_user("F8", [0.78, 0.72, 0.68, 0.80, 0.82], "female"),
        ]
        activity = make_activity(max_groups=1, K_min=4, K_max=8)
        activity.women_only = True
        hosts = [0]
        history_records = []

        groups, stats = solve_matching(users, activity, hosts, history_records)

        assert len(groups) > 0
        for group in groups:
            for idx in group["member_indices"]:
                assert users[idx].gender == "female"


class TestAnnealingFallback:
    def test_annealing_produces_valid_groups(self):
        users = [
            make_user(f"User{i}", [0.5 + i * 0.02 for _ in range(5)])
            for i in range(20)
        ]
        activity = make_activity(max_groups=3, K_min=4, K_max=8)
        hosts = [0, 1, 2]
        groups = greedy_annealing_solution(users, hosts, activity)

        assert len(groups) > 0
        for group in groups:
            assert 4 <= len(group["member_indices"]) <= 8
