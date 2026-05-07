"""Add friend connections and user blocks tables

Revision ID: 20240507_friend_matching
Revises: 20240601_initial
Create Date: 2024-05-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20240507_friend_matching"
down_revision: Union[str, None] = "20240601_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "friend_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("friend_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("compatibility_score", sa.Numeric(5, 4)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "friend_id"),
    )
    op.create_index("idx_friend_conn_user", "friend_connections", ["user_id", "status"])
    op.create_index("idx_friend_conn_friend", "friend_connections", ["friend_id", "status"])
    op.create_foreign_key("fk_friend_conn_user", "friend_connections", "users", ["user_id"], ["id"])
    op.create_foreign_key("fk_friend_conn_friend", "friend_connections", "users", ["friend_id"], ["id"])

    op.create_table(
        "user_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("blocker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("blocked_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("blocker_id", "blocked_id"),
    )
    op.create_index("idx_user_blocks_blocker", "user_blocks", ["blocker_id"])
    op.create_foreign_key("fk_user_block_blocker", "user_blocks", "users", ["blocker_id"], ["id"])
    op.create_foreign_key("fk_user_block_blocked", "user_blocks", "users", ["blocked_id"], ["id"])


def downgrade() -> None:
    op.drop_table("user_blocks")
    op.drop_table("friend_connections")
