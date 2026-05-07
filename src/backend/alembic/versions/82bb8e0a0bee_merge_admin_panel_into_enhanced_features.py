"""merge admin panel into enhanced features

Revision ID: 82bb8e0a0bee
Revises: 20240603_admin, f88d6d5d6f7b
Create Date: 2026-05-08 00:20:42.868530
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '82bb8e0a0bee'
down_revision: Union[str, None] = ('20240603_admin', 'f88d6d5d6f7b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
