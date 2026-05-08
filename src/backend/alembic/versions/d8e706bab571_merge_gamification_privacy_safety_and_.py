"""merge gamification, privacy, safety, and push notification branches

Revision ID: d8e706bab571
Revises: 20240508_push_notifications, 815da53e3de7, d33a2cd700f6
Create Date: 2026-05-08 05:18:01.582936
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd8e706bab571'
down_revision: Union[str, None] = ('20240508_push_notifications', '815da53e3de7', 'd33a2cd700f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
