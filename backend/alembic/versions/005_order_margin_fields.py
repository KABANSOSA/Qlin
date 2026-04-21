"""Add cost & margin fields to orders (cleaner_payout, supply_cost, other_cost)

Revision ID: 005_order_margin_fields
Revises: 004_crm_opportunities
"""
from alembic import op
import sqlalchemy as sa

revision = "005_order_margin_fields"
down_revision = "004_crm_opportunities"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("cleaner_payout", sa.Numeric(10, 2), nullable=True))
    op.add_column("orders", sa.Column("supply_cost", sa.Numeric(10, 2), server_default="0", nullable=False))
    op.add_column("orders", sa.Column("other_cost", sa.Numeric(10, 2), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("orders", "other_cost")
    op.drop_column("orders", "supply_cost")
    op.drop_column("orders", "cleaner_payout")
