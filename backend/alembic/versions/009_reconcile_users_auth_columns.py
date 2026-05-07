"""Reconcile users auth columns for databases created before Alembic.

Revision ID: 009_reconcile_users_auth_columns
Revises: 008_crm_opportunity_linked_lead
"""
from alembic import op
import sqlalchemy as sa

revision = "009_reconcile_users_auth_columns"
down_revision = "008_crm_opportunity_linked_lead"
branch_labels = None
depends_on = None


def _users_columns() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns("users")}


def _users_unique_constraints() -> list[dict]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return inspector.get_unique_constraints("users")


def upgrade() -> None:
    columns = _users_columns()

    if "email" not in columns:
        op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))

    if "password_hash" not in columns:
        op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))

    unique_columns = {
        tuple(constraint.get("column_names") or [])
        for constraint in _users_unique_constraints()
    }
    if ("email",) not in unique_columns:
        op.create_unique_constraint("uq_users_email", "users", ["email"])


def downgrade() -> None:
    # This migration repairs drifted production databases. Dropping columns here
    # could remove data from databases that already had the correct initial schema.
    pass
