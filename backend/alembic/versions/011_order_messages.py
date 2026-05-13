"""order_messages: чат по заказу

Revision ID: 011_order_messages
Revises: 010_crm_order_comments_tasks
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "011_order_messages"
down_revision = "010_crm_order_comments_tasks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "order_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_messages_order_id", "order_messages", ["order_id"])
    op.create_index("ix_order_messages_created_at", "order_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_order_messages_created_at", table_name="order_messages")
    op.drop_index("ix_order_messages_order_id", table_name="order_messages")
    op.drop_table("order_messages")
