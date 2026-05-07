"""admin panel: events extension, platform_config, admin_notifications, sos resolution

Revision ID: 20240603_admin
Revises: 20240602_geolocation
Create Date: 2026-05-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20240603_admin'
down_revision: Union[str, None] = '20240601_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Geolocation fields (from feature/geolocation branch) ──
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS live_lat DOUBLE PRECISION")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS live_lng DOUBLE PRECISION")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_radius_km INT DEFAULT 20")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_active_ready ON users(last_active_at, live_lat, onboarding_completed)")

    # ── Extend activities for local events ──
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_local_event BOOLEAN DEFAULT FALSE")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS cover_photo_url TEXT")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS min_capacity INT DEFAULT 4")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_capacity INT DEFAULT 50")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(20) DEFAULT 'free'")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS ticket_price_inr INT DEFAULT 0")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64)")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_user_id UUID REFERENCES users(id)")
    op.execute("ALTER TABLE activities ADD COLUMN IF NOT EXISTS tags TEXT[]")

    # ── Platform configuration ──
    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_config (
            key VARCHAR(100) PRIMARY KEY,
            value JSONB NOT NULL DEFAULT '{}',
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            updated_by UUID REFERENCES users(id)
        )
    """)

    # ── Admin notifications ──
    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            target_type VARCHAR(20) NOT NULL,
            target_id UUID,
            scheduled_at TIMESTAMPTZ,
            sent_at TIMESTAMPTZ,
            delivered_count INT DEFAULT 0,
            opened_count INT DEFAULT 0,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # ── Extend SOS events ──
    op.execute("ALTER TABLE sos_events ADD COLUMN IF NOT EXISTS resolution_status VARCHAR(20) DEFAULT 'open'")
    op.execute("ALTER TABLE sos_events ADD COLUMN IF NOT EXISTS admin_notes TEXT")
    op.execute("ALTER TABLE sos_events ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id)")
    op.execute("ALTER TABLE sos_events ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ")

    # ── Flagged users table ──
    op.execute("""
        CREATE TABLE IF NOT EXISTS flagged_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) NOT NULL,
            flagged_by UUID REFERENCES users(id),
            reason TEXT,
            flag_type VARCHAR(30) DEFAULT 'manual',
            status VARCHAR(20) DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            resolved_at TIMESTAMPTZ
        )
    """)

    # ── Indexes ──
    op.execute("CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_activities_is_local_event ON activities(is_local_event)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_activities_scheduled_at ON activities(scheduled_at)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_sos_resolution_status ON sos_events(resolution_status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_flagged_users_status ON flagged_users(status)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_flagged_users_status")
    op.execute("DROP INDEX IF EXISTS idx_users_active_ready")
    op.execute("DROP INDEX IF EXISTS idx_sos_resolution_status")
    op.execute("DROP INDEX IF EXISTS idx_activities_scheduled_at")
    op.execute("DROP INDEX IF EXISTS idx_activities_is_local_event")
    op.execute("DROP INDEX IF EXISTS idx_activities_status")
    op.execute("DROP TABLE IF EXISTS flagged_users")
    op.execute("ALTER TABLE sos_events DROP COLUMN IF EXISTS resolved_at")
    op.execute("ALTER TABLE sos_events DROP COLUMN IF EXISTS resolved_by")
    op.execute("ALTER TABLE sos_events DROP COLUMN IF EXISTS admin_notes")
    op.execute("ALTER TABLE sos_events DROP COLUMN IF EXISTS resolution_status")
    op.execute("DROP TABLE IF EXISTS admin_notifications")
    op.execute("DROP TABLE IF EXISTS platform_config")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS tags")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS host_user_id")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS invite_token")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS visibility")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS ticket_price_inr")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS ticket_type")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS max_capacity")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS min_capacity")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS cover_photo_url")
    op.execute("ALTER TABLE activities DROP COLUMN IF EXISTS is_local_event")
