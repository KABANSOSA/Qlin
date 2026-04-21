"""CRM: address и area_sqm для сделок

Revision ID: 007_crm_opportunity_deal_fields
Revises: 006_crm_tasks_and_opportunity_fields
"""
from alembic import op
import sqlalchemy as sa

revision = "007_crm_opportunity_deal_fields"
down_revision = "006_crm_tasks_and_opportunity_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("crm_opportunities", sa.Column("address", sa.String(length=500), nullable=True))
    op.add_column("crm_opportunities", sa.Column("area_sqm", sa.Numeric(8, 1), nullable=True))


def downgrade() -> None:
    op.drop_column("crm_opportunities", "area_sqm")
    op.drop_column("crm_opportunities", "address")
