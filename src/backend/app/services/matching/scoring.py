from app.models.user import User
from app.models.user_history import UserHistory


def personality_similarity(user1: User, user2: User) -> float:
    """
    Weighted cosine similarity on 5D personality vectors.
    
    Vector dimensions: [adventure, energy, social, openness, conscientiousness]
    Weights:           [1.0,       0.8,    0.7,    1.0,      1.5]
    
    Conscientiousness similarity is the strongest predictor of group bonding.
    (Laakasuo et al., 2020, Frontiers in Psychology)
    """
    weights = [1.0, 0.8, 0.7, 1.0, 1.5]
    v1 = user1.personality_vector
    v2 = user2.personality_vector

    if v1 is None or v2 is None or len(v1) != 5 or len(v2) != 5:
        return 0.0

    weighted_dot = float(sum(w * a * b for w, a, b in zip(weights, v1, v2)))
    norm1 = float(sum(w * a * a for w, a in zip(weights, v1))) ** 0.5
    norm2 = float(sum(w * b * b for w, b in zip(weights, v2))) ** 0.5

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return weighted_dot / (norm1 * norm2)


def no_show_risk(user: User, activity) -> float:
    """
    Heuristic no-show probability for demo.
    Replace with XGBoost model in production with training data.
    """
    from datetime import datetime

    base_risk = 0.10

    if activity.scheduled_at is not None and activity.scheduled_at.hour < 6:
        base_risk += 0.08
    if user.total_experiences == 0:
        base_risk += 0.05

    if hasattr(user, "last_activity") and user.last_activity is not None and activity.scheduled_at is not None:
        u_last = user.last_activity
        a_sched = activity.scheduled_at
        if hasattr(u_last, 'replace'):
            u_last = u_last.replace(tzinfo=None)
        if hasattr(a_sched, 'replace'):
            a_sched = a_sched.replace(tzinfo=None)
        days_since = (a_sched - u_last).days
        if days_since > 30:
            base_risk += 0.05

    return min(base_risk, 0.40)


def have_met_in_last_90_days(user1: User, user2: User, history_records: list) -> bool:
    """Check if user1 and user2 have met in any group in the last 90 days."""
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    
    u1_id = str(user1.id)
    u2_id = str(user2.id)
    
    for record in history_records:
        if record.met_at is None:
            continue
        if record.met_at.replace(tzinfo=None) < cutoff.replace(tzinfo=None):
            continue
        r_u1 = str(record.user_id)
        r_u2 = str(record.other_user_id)
        if (r_u1 == u1_id and r_u2 == u2_id) or (r_u1 == u2_id and r_u2 == u1_id):
            return True
    return False
