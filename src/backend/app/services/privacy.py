"""Privacy filter for user profile data returned to other users.

Call apply_privacy_filter whenever returning any user's profile to another viewer.
Never filters your own profile (viewer_id == profile_user.id).
Admins always see full data.
"""

import uuid
from app.models.user import User


def apply_privacy_filter(
    viewer_id: uuid.UUID | None,
    profile_user: User,
    is_admin: bool = False,
) -> dict:
    """
    Filter user profile data based on privacy settings.

    Args:
        viewer_id: The UUID of the user viewing the profile, or None.
        profile_user: The user whose profile is being viewed.
        is_admin: If True, bypass all filters and return full data.

    Returns:
        dict with filtered profile data (id, name, interests, home_area, vibe,
        verification_status).
    """
    # Admins see everything
    if is_admin:
        return {
            "id": profile_user.id,
            "name": profile_user.name,
            "interests": profile_user.interests or [],
            "home_area": profile_user.home_area,
            "vibe": profile_user.vibe,
            "verification_status": profile_user.verification_status,
        }

    # Viewing own profile — show everything
    if viewer_id and viewer_id == profile_user.id:
        return {
            "id": profile_user.id,
            "name": profile_user.name,
            "interests": profile_user.interests or [],
            "home_area": profile_user.home_area,
            "vibe": profile_user.vibe,
            "verification_status": profile_user.verification_status,
        }

    # Public profile — show everything
    data = {
        "id": profile_user.id,
        "name": profile_user.name,
        "interests": profile_user.interests or [],
        "home_area": profile_user.home_area,
        "vibe": profile_user.vibe,
        "verification_status": profile_user.verification_status,
    }

    # Private profile — apply toggles
    if getattr(profile_user, "profile_visibility", "public") == "private":
        if not getattr(profile_user, "show_full_name", True):
            parts = (profile_user.name or "").split()
            data["name"] = (
                parts[0] + " " + parts[1][0] + "."
                if len(parts) > 1
                else parts[0]
            )
        if not getattr(profile_user, "show_interests", True):
            data["interests"] = []
        if not getattr(profile_user, "show_location", True):
            data["home_area"] = None

    return data
