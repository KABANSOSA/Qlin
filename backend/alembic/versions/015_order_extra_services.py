"""orders.extra_services — JSON выбранных доп. услуг для CRM

Revision ID: 015_order_extra_services
Revises: 014_package_gifts_and_reminders
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "015_order_extra_services"
down_revision = "014_package_gifts_and_reminders"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("extra_services", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "extra_services")
