"""Add community group support

Revision ID: 20240507_communities
Revises: 20240601_initial
Create Date: 2024-05-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20240507_communities"
down_revision: Union[str, None] = "20240601_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("groups", sa.Column("name", sa.String(200)))
    op.add_column("groups", sa.Column("group_type", sa.String(20), server_default="matching"))
    op.add_column("groups", sa.Column("interest_tags", postgresql.ARRAY(sa.Text), server_default="{}"))
    op.add_column("groups", sa.Column("description", sa.Text))
    op.add_column("groups", sa.Column("cover_image_url", sa.String(500)))
    op.add_column("groups", sa.Column("rules", sa.Text))
    op.add_column("groups", sa.Column("member_limit", sa.Integer, server_default="100"))

    op.alter_column("groups", "activity_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)

    op.create_index("idx_groups_group_type", "groups", ["group_type"])
    op.create_index("idx_groups_interest_tags", "groups", ["interest_tags"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("idx_groups_interest_tags", table_name="groups", postgresql_using="gin")
    op.drop_index("idx_groups_group_type", table_name="groups")
    op.alter_column("groups", "activity_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.drop_column("groups", "member_limit")
    op.drop_column("groups", "rules")
    op.drop_column("groups", "cover_image_url")
    op.drop_column("groups", "description")
    op.drop_column("groups", "interest_tags")
    op.drop_column("groups", "group_type")
    op.drop_column("groups", "name")
