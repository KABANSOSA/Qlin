"""CRM: source/assigned_to в opportunities, новая таблица crm_tasks

Revision ID: 006_crm_tasks_and_opportunity_fields
Revises: 005_order_margin_fields
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006_crm_tasks_and_opportunity_fields"
down_revision = "005_order_margin_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "crm_opportunities",
        sa.Column("source", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "crm_opportunities",
        sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_crm_opp_assigned_to",
        "crm_opportunities",
        "users",
        ["assigned_to_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "crm_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="todo"),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opportunity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("creator_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["opportunity_id"], ["crm_opportunities.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_crm_tasks_status", "crm_tasks", ["status"], unique=False)
    op.create_index("ix_crm_tasks_opportunity_id", "crm_tasks", ["opportunity_id"], unique=False)
    op.create_index("ix_crm_tasks_assigned_to_id", "crm_tasks", ["assigned_to_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_crm_tasks_assigned_to_id", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_opportunity_id", table_name="crm_tasks")
    op.drop_index("ix_crm_tasks_status", table_name="crm_tasks")
    op.drop_table("crm_tasks")
    op.drop_constraint("fk_crm_opp_assigned_to", "crm_opportunities", type_="foreignkey")
    op.drop_column("crm_opportunities", "assigned_to_id")
    op.drop_column("crm_opportunities", "source")
