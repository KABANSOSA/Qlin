"""cleaning_package_purchases + orders.package_purchase_id

Revision ID: 013_cleaning_package_purchases
Revises: 012_cleaning_subscriptions
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "013_cleaning_package_purchases"
down_revision = "012_cleaning_subscriptions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cleaning_package_purchases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cleanings_count", sa.Integer(), nullable=False),
        sa.Column("cleanings_remaining", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("price_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="RUB"),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("provider_payment_id", sa.String(255), nullable=True),
        sa.Column("payment_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("cleanings_count IN (2, 3, 4)", name="ck_package_cleanings_count"),
        sa.CheckConstraint(
            "status IN ('pending_payment', 'paid', 'cancelled')",
            name="ck_package_purchase_status",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cleaning_package_purchases_user_id", "cleaning_package_purchases", ["user_id"])
    op.create_index("ix_cleaning_package_purchases_status", "cleaning_package_purchases", ["status"])
    op.create_index(
        "ix_cleaning_package_purchases_provider_payment_id",
        "cleaning_package_purchases",
        ["provider_payment_id"],
    )
    op.add_column(
        "orders",
        sa.Column("package_purchase_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_orders_package_purchase_id",
        "orders",
        "cleaning_package_purchases",
        ["package_purchase_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_orders_package_purchase_id", "orders", type_="foreignkey")
    op.drop_column("orders", "package_purchase_id")
    op.drop_index("ix_cleaning_package_purchases_provider_payment_id", table_name="cleaning_package_purchases")
    op.drop_index("ix_cleaning_package_purchases_status", table_name="cleaning_package_purchases")
    op.drop_index("ix_cleaning_package_purchases_user_id", table_name="cleaning_package_purchases")
    op.drop_table("cleaning_package_purchases")
