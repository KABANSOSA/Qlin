"""Расширить alembic_version.version_num: идентификаторы ревизий бывают длиннее 32 символов.

Revision ID: 005a_alembic_version_widen
Revises: 005_order_margin_fields
"""
from alembic import op

revision = "005a_alembic_version_widen"
down_revision = "005_order_margin_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(128)"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(32)"
    )
