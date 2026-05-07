"""Add activity tags for recommendation engine

Revision ID: 20240507_activity_tags
Revises: 20240601_initial
Create Date: 2024-05-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20240507_activity_tags"
down_revision: Union[str, None] = "20240601_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("activities", sa.Column("tags", postgresql.ARRAY(sa.Text), server_default="{}"))
    op.create_index("idx_activities_tags", "activities", ["tags"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("idx_activities_tags", table_name="activities", postgresql_using="gin")
    op.drop_column("activities", "tags")
