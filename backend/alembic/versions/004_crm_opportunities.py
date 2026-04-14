"""CRM: лиды, сделки, комментарии, сегменты B2B/B2C

Revision ID: 004_crm_opportunities
Revises: 003_push_devices
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_crm_opportunities"
down_revision = "003_push_devices"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "crm_opportunities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=10), nullable=False),
        sa.Column("segment", sa.String(length=10), nullable=False),
        sa.Column("stage", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("company_name", sa.String(length=200), nullable=True),
        sa.Column("contact_name", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("estimated_value_rub", sa.Numeric(12, 2), nullable=True),
        sa.Column("linked_order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["linked_order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_crm_opportunities_kind", "crm_opportunities", ["kind"], unique=False)
    op.create_index("ix_crm_opportunities_segment", "crm_opportunities", ["segment"], unique=False)
    op.create_index("ix_crm_opportunities_stage", "crm_opportunities", ["stage"], unique=False)

    op.create_table(
        "crm_opportunity_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("opportunity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["opportunity_id"], ["crm_opportunities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_crm_opportunity_comments_opportunity_id",
        "crm_opportunity_comments",
        ["opportunity_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_crm_opportunity_comments_opportunity_id", table_name="crm_opportunity_comments")
    op.drop_table("crm_opportunity_comments")
    op.drop_index("ix_crm_opportunities_stage", table_name="crm_opportunities")
    op.drop_index("ix_crm_opportunities_segment", table_name="crm_opportunities")
    op.drop_index("ix_crm_opportunities_kind", table_name="crm_opportunities")
    op.drop_table("crm_opportunities")
