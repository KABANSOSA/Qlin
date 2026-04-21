"""CRM: linked_lead_id (конвертация лида в сделку)

Revision ID: 008_crm_opportunity_linked_lead
Revises: 007_crm_opportunity_deal_fields
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "008_crm_opportunity_linked_lead"
down_revision = "007_crm_opportunity_deal_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "crm_opportunities",
        sa.Column("linked_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_crm_opp_linked_lead",
        "crm_opportunities",
        "crm_opportunities",
        ["linked_lead_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_crm_opp_linked_lead", "crm_opportunities", type_="foreignkey")
    op.drop_column("crm_opportunities", "linked_lead_id")
