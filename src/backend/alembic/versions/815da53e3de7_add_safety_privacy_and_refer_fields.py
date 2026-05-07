"""add safety privacy and refer fields

Revision ID: 815da53e3de7
Revises: 40d2ff62cd01
Create Date: 2026-05-08 02:32:12.316233
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '815da53e3de7'
down_revision: Union[str, None] = '40d2ff62cd01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('women_only_mode', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('users', sa.Column('referral_code', sa.String(length=20), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'referral_code')
    op.drop_column('users', 'women_only_mode')
