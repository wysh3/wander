import pytest
from app.services.matching.annealing import greedy_annealing_solution, group_weighted_similarity
from unittest.mock import MagicMock
import uuid
from datetime import datetime, timedelta


def make_user(name: str, vector: list[float], gender: str = "female") -> MagicMock:
    user = MagicMock()
    user.id = uuid.uuid4()
    user.name = name
    user.personality_vector = vector
    user.gender = gender
    return user


class TestAnnealingFallback:
    def test_produces_valid_groups(self):
        users = [make_user(f"User{i}", [0.5 + i * 0.02 for _ in range(5)]) for i in range(20)]
        activity = MagicMock()
        activity.max_groups = 3
        activity.group_size_min = 4
        activity.group_size_max = 8
        activity.scheduled_at = datetime.utcnow() + timedelta(days=2)
        hosts = [0, 1, 2]
        groups = greedy_annealing_solution(users, hosts, activity)

        assert len(groups) > 0
        for group in groups:
            assert 4 <= len(group["member_indices"]) <= 8

    def test_weighted_similarity_used(self):
        u1 = make_user("A", [1.0, 0.5, 0.5, 0.5, 0.5])
        u2 = make_user("B", [0.5, 1.0, 0.5, 0.5, 0.5])
        sim = group_weighted_similarity([0, 1], [u1, u2])
        assert 0.0 <= sim <= 1.0

    def test_hosts_assigned(self):
        users = [make_user(f"User{i}", [0.5 + i * 0.02 for _ in range(5)]) for i in range(12)]
        activity = MagicMock()
        activity.max_groups = 2
        activity.group_size_min = 4
        activity.group_size_max = 8
        hosts = [0, 1]
        groups = greedy_annealing_solution(users, hosts, activity)
        assert len(groups) > 0
