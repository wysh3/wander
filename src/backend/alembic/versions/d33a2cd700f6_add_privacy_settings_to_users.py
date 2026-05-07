"""add_privacy_settings_to_users

Revision ID: d33a2cd700f6
Revises: 82bb8e0a0bee
Create Date: 2026-05-08 02:37:42.819672
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd33a2cd700f6'
down_revision: Union[str, None] = '82bb8e0a0bee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('profile_visibility', sa.String(length=10), server_default="public", nullable=False))
    op.add_column('users', sa.Column('show_full_name', sa.Boolean(), server_default=sa.text('TRUE'), nullable=False))
    op.add_column('users', sa.Column('show_interests', sa.Boolean(), server_default=sa.text('TRUE'), nullable=False))
    op.add_column('users', sa.Column('show_location', sa.Boolean(), server_default=sa.text('TRUE'), nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'show_location')
    op.drop_column('users', 'show_interests')
    op.drop_column('users', 'show_full_name')
    op.drop_column('users', 'profile_visibility')
