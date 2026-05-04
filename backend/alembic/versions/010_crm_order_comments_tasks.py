"""CRM: comments and tasks linked to orders

Revision ID: 010_crm_order_comments_tasks
Revises: 009_reconcile_users_auth_columns
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "010_crm_order_comments_tasks"
down_revision = "009_reconcile_users_auth_columns"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    comment_columns = _columns("crm_opportunity_comments")
    task_columns = _columns("crm_tasks")

    if "order_id" not in comment_columns:
        op.add_column(
            "crm_opportunity_comments",
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_index("ix_crm_opportunity_comments_order_id", "crm_opportunity_comments", ["order_id"])
        op.create_foreign_key(
            "fk_crm_comments_order_id",
            "crm_opportunity_comments",
            "orders",
            ["order_id"],
            ["id"],
            ondelete="CASCADE",
        )

    if "opportunity_id" in comment_columns:
        op.alter_column("crm_opportunity_comments", "opportunity_id", nullable=True)

    if "order_id" not in task_columns:
        op.add_column(
            "crm_tasks",
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_index("ix_crm_tasks_order_id", "crm_tasks", ["order_id"])
        op.create_foreign_key(
            "fk_crm_tasks_order_id",
            "crm_tasks",
            "orders",
            ["order_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    columns = _columns("crm_opportunity_comments")
    if "order_id" in columns:
        op.drop_constraint("fk_crm_comments_order_id", "crm_opportunity_comments", type_="foreignkey")
        op.drop_index("ix_crm_opportunity_comments_order_id", table_name="crm_opportunity_comments")
        op.drop_column("crm_opportunity_comments", "order_id")
    op.alter_column("crm_opportunity_comments", "opportunity_id", nullable=False)

    columns = _columns("crm_tasks")
    if "order_id" in columns:
        op.drop_constraint("fk_crm_tasks_order_id", "crm_tasks", type_="foreignkey")
        op.drop_index("ix_crm_tasks_order_id", table_name="crm_tasks")
        op.drop_column("crm_tasks", "order_id")
