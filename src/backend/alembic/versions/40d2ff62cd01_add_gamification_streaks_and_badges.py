"""add gamification streaks and badges

Revision ID: 40d2ff62cd01
Revises: f562a3476362
Create Date: 2026-05-08 02:14:47.430111
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '40d2ff62cd01'
down_revision: Union[str, None] = 'f562a3476362'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('current_streak', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('users', sa.Column('longest_streak', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('users', sa.Column('last_streak_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('badges', sa.ARRAY(sa.Text()), nullable=True, server_default='{}'))

def downgrade() -> None:
    op.drop_column('users', 'badges')
    op.drop_column('users', 'last_streak_date')
    op.drop_column('users', 'longest_streak')
    op.drop_column('users', 'current_streak')
