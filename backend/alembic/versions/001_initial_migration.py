"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('telegram_id', sa.BigInteger(), unique=True, nullable=True),
        sa.Column('phone', sa.String(20), unique=True, nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=True),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('role', sa.String(20), nullable=False, server_default='customer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_users_telegram_id', 'users', ['telegram_id'])
    op.create_index('idx_users_phone', 'users', ['phone'])
    op.create_index('idx_users_role', 'users', ['role'])

    # Cleaners table
    op.create_table(
        'cleaners',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('rating', sa.Numeric(3, 2), nullable=False, server_default='0.0'),
        sa.Column('total_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('current_location_lat', sa.Numeric(10, 8), nullable=True),
        sa.Column('current_location_lon', sa.Numeric(11, 8), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_cleaners_user_id', 'cleaners', ['user_id'])
    op.create_index('idx_cleaners_available', 'cleaners', ['is_available'])

    # Zones table
    op.create_table(
        'zones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('polygon_coordinates', postgresql.JSONB(), nullable=True),
        sa.Column('base_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_zones_city', 'zones', ['city'])
    op.create_index('idx_zones_active', 'zones', ['is_active'])

    # Orders table
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_number', sa.String(20), unique=True, nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('cleaner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id'), nullable=True),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('address_lat', sa.Numeric(10, 8), nullable=True),
        sa.Column('address_lon', sa.Numeric(11, 8), nullable=True),
        sa.Column('apartment', sa.String(20), nullable=True),
        sa.Column('entrance', sa.String(10), nullable=True),
        sa.Column('floor', sa.Integer(), nullable=True),
        sa.Column('intercom', sa.String(20), nullable=True),
        sa.Column('cleaning_type', sa.String(50), nullable=False),
        sa.Column('rooms_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('bathrooms_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('area_sqm', sa.Numeric(8, 2), nullable=True),
        sa.Column('has_pets', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('has_balcony', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('special_instructions', sa.Text(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('base_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('extra_services_price', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('discount', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('total_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('payment_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('payment_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_orders_customer_id', 'orders', ['customer_id'])
    op.create_index('idx_orders_cleaner_id', 'orders', ['cleaner_id'])
    op.create_index('idx_orders_status', 'orders', ['status'])
    op.create_index('idx_orders_scheduled_at', 'orders', ['scheduled_at'])
    op.create_index('idx_orders_order_number', 'orders', ['order_number'])

    # Order events table
    op.create_table(
        'order_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('from_status', sa.String(20), nullable=True),
        sa.Column('to_status', sa.String(20), nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('actor_type', sa.String(20), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_order_events_order_id', 'order_events', ['order_id'])
    op.create_index('idx_order_events_created_at', 'order_events', ['created_at'])

    # Pricing rules table
    op.create_table(
        'pricing_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id'), nullable=True),
        sa.Column('cleaning_type', sa.String(50), nullable=False),
        sa.Column('base_price_per_sqm', sa.Numeric(10, 2), nullable=True),
        sa.Column('base_price_per_room', sa.Numeric(10, 2), nullable=True),
        sa.Column('min_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('max_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('valid_from', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_pricing_rules_zone_type', 'pricing_rules', ['zone_id', 'cleaning_type'])
    op.create_index('idx_pricing_rules_active', 'pricing_rules', ['is_active'])

    # Payments table
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='RUB'),
        sa.Column('payment_method', sa.String(50), nullable=False),
        sa.Column('payment_provider', sa.String(50), nullable=True),
        sa.Column('provider_payment_id', sa.String(255), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_payments_order_id', 'payments', ['order_id'])
    op.create_index('idx_payments_status', 'payments', ['status'])
    op.create_index('idx_payments_provider_id', 'payments', ['provider_payment_id'])

    # Ratings table
    op.create_table(
        'ratings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=False, unique=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('cleaner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_ratings_cleaner_id', 'ratings', ['cleaner_id'])
    op.create_index('idx_ratings_order_id', 'ratings', ['order_id'])

    # Notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('idx_notifications_read', 'notifications', ['is_read'])
    op.create_index('idx_notifications_created_at', 'notifications', ['created_at'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('ratings')
    op.drop_table('payments')
    op.drop_table('pricing_rules')
    op.drop_table('order_events')
    op.drop_table('orders')
    op.drop_table('zones')
    op.drop_table('cleaners')
    op.drop_table('users')
