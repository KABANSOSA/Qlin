"""cleaning_subscriptions + orders.subscription_cleanings_tier

Revision ID: 012_cleaning_subscriptions
Revises: 011_order_messages
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "012_cleaning_subscriptions"
down_revision = "011_order_messages"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cleaning_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cleanings_per_month", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "cleanings_per_month IN (2, 3, 4)",
            name="ck_cleaning_subscriptions_per_month",
        ),
    )
    op.create_index("ix_cleaning_subscriptions_user_id", "cleaning_subscriptions", ["user_id"])
    op.add_column(
        "orders",
        sa.Column("subscription_cleanings_tier", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "subscription_cleanings_tier")
    op.drop_index("ix_cleaning_subscriptions_user_id", table_name="cleaning_subscriptions")
    op.drop_table("cleaning_subscriptions")
