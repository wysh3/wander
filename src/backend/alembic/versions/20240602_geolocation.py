"""Add live GPS tracking columns and geo indexes.

Revision ID: 20240602_geolocation
Revises: 20240601_initial
Create Date: 2024-06-02
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "20240602_geolocation"
down_revision: Union[str, None] = "20240601_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add live GPS + activity tracking columns
    op.add_column("users", sa.Column("live_lat", sa.Numeric(10, 7), nullable=True))
    op.add_column("users", sa.Column("live_lng", sa.Numeric(10, 7), nullable=True))
    op.add_column("users", sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("preferred_radius_km", sa.Integer, server_default="20", nullable=False))

    # Index for filtering by last active time
    op.create_index("idx_users_last_active", "users", ["last_active_at"])
    op.create_index("idx_users_preferred_radius", "users", ["preferred_radius_km"])

    # Composite index for active + onboarded users (common filter pattern)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_active_ready
        ON users (last_active_at DESC)
        WHERE onboarding_completed = TRUE
          AND personality_vector IS NOT NULL
          AND live_lat IS NOT NULL
          AND live_lng IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_users_active_ready")
    op.drop_index("idx_users_preferred_radius")
    op.drop_index("idx_users_last_active")
    op.drop_column("users", "preferred_radius_km")
    op.drop_column("users", "last_active_at")
    op.drop_column("users", "live_lng")
    op.drop_column("users", "live_lat")
