"""merge geolocation into enhanced features

Revision ID: f88d6d5d6f7b
Revises: ab4984a79513, 20240602_geolocation
Create Date: 2026-05-07 22:22:46.337998
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f88d6d5d6f7b'
down_revision: Union[str, None] = ('ab4984a79513', '20240602_geolocation')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
