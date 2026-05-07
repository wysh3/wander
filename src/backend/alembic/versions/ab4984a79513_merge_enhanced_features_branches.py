"""merge enhanced features branches

Revision ID: ab4984a79513
Revises: 20240507_activity_tags, 20240507_communities, 20240507_friend_matching
Create Date: 2026-05-07 19:50:55.668752
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'ab4984a79513'
down_revision: Union[str, None] = ('20240507_activity_tags', '20240507_communities', '20240507_friend_matching')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
