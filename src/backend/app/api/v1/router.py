from fastapi import APIRouter
from app.api.v1 import auth, users, activities, matching, groups, chat, sos, reports, admin, host, verification, onboarding

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(verification.router, prefix="/verify", tags=["verification"])
router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
router.include_router(activities.router, prefix="/activities", tags=["activities"])
router.include_router(matching.router, prefix="/match", tags=["matching"])
router.include_router(groups.router, prefix="/groups", tags=["groups"])
router.include_router(chat.router, prefix="/groups", tags=["chat"])
router.include_router(sos.router, prefix="/sos", tags=["sos"])
router.include_router(reports.router, prefix="/report", tags=["reports"])
router.include_router(host.router, prefix="/host", tags=["host"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
