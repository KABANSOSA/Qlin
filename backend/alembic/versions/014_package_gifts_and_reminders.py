"""package purchaser, gifts, reminder timestamp

Revision ID: 014_package_gifts_and_reminders
Revises: 013_cleaning_package_purchases
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "014_package_gifts_and_reminders"
down_revision = "013_cleaning_package_purchases"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cleaning_package_purchases",
        sa.Column("purchaser_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute("UPDATE cleaning_package_purchases SET purchaser_id = user_id WHERE purchaser_id IS NULL")
    op.alter_column("cleaning_package_purchases", "purchaser_id", nullable=False)
    op.create_foreign_key(
        "fk_cpp_purchaser_id",
        "cleaning_package_purchases",
        "users",
        ["purchaser_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_cleaning_package_purchases_purchaser_id", "cleaning_package_purchases", ["purchaser_id"])
    op.alter_column("cleaning_package_purchases", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    op.add_column(
        "cleaning_package_purchases",
        sa.Column("is_gift", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "cleaning_package_purchases",
        sa.Column("gift_code", sa.String(32), nullable=True),
    )
    op.add_column(
        "cleaning_package_purchases",
        sa.Column("gift_redeemed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "cleaning_package_purchases",
        sa.Column("last_package_credit_reminder_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_cpp_gift_code ON cleaning_package_purchases (gift_code) "
        "WHERE gift_code IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_cpp_gift_code")
    op.drop_column("cleaning_package_purchases", "last_package_credit_reminder_at")
    op.drop_column("cleaning_package_purchases", "gift_redeemed_at")
    op.drop_column("cleaning_package_purchases", "gift_code")
    op.drop_column("cleaning_package_purchases", "is_gift")
    op.alter_column("cleaning_package_purchases", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.drop_index("ix_cleaning_package_purchases_purchaser_id", table_name="cleaning_package_purchases")
    op.drop_constraint("fk_cpp_purchaser_id", "cleaning_package_purchases", type_="foreignkey")
    op.drop_column("cleaning_package_purchases", "purchaser_id")
