# Схема базы данных

## Таблицы

### users
Хранит информацию о пользователях (клиенты и уборщики).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer, cleaner, admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

### cleaners
Дополнительная информация об уборщиках.

```sql
CREATE TABLE cleaners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    current_location_lat DECIMAL(10,8),
    current_location_lon DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cleaners_user_id ON cleaners(user_id);
CREATE INDEX idx_cleaners_available ON cleaners(is_available);
```

### zones
Географические зоны обслуживания.

```sql
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    polygon_coordinates JSONB, -- GeoJSON polygon
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zones_city ON zones(city);
CREATE INDEX idx_zones_active ON zones(is_active);
```

### orders
Основная таблица заказов.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL, -- Human-readable number
    customer_id UUID NOT NULL REFERENCES users(id),
    cleaner_id UUID REFERENCES users(id),
    zone_id UUID REFERENCES zones(id),
    
    -- Адрес
    address TEXT NOT NULL,
    address_lat DECIMAL(10,8),
    address_lon DECIMAL(11,8),
    apartment VARCHAR(20),
    entrance VARCHAR(10),
    floor INTEGER,
    intercom VARCHAR(20),
    
    -- Детали уборки
    cleaning_type VARCHAR(50) NOT NULL, -- regular, deep, move_in, move_out, etc.
    rooms_count INTEGER DEFAULT 1,
    bathrooms_count INTEGER DEFAULT 1,
    area_sqm DECIMAL(8,2),
    has_pets BOOLEAN DEFAULT FALSE,
    has_balcony BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    
    -- Время
    scheduled_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Цена
    base_price DECIMAL(10,2) NOT NULL,
    extra_services_price DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Статус
    status VARCHAR(20) NOT NULL DEFAULT 'pending', 
    -- pending, assigned, in_progress, completed, cancelled, paid
    
    -- Платеж
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
    payment_method VARCHAR(50), -- card, cash, online
    payment_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_cleaner_id ON orders(cleaner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_scheduled_at ON orders(scheduled_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

### order_events
История изменений заказов (для аудита и state machine).

```sql
CREATE TABLE order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- created, assigned, started, completed, cancelled, etc.
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    actor_id UUID REFERENCES users(id), -- Кто выполнил действие
    actor_type VARCHAR(20), -- customer, cleaner, admin, system
    metadata JSONB, -- Дополнительные данные события
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_created_at ON order_events(created_at);
```

### pricing_rules
Правила ценообразования.

```sql
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    cleaning_type VARCHAR(50) NOT NULL,
    base_price_per_sqm DECIMAL(10,2),
    base_price_per_room DECIMAL(10,2),
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_zone_type ON pricing_rules(zone_id, cleaning_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
```

### payments
Платежи.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50), -- stripe, yookassa, etc.
    provider_payment_id VARCHAR(255),
    status VARCHAR(20) NOT NULL, -- pending, succeeded, failed, refunded
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_id ON payments(provider_payment_id);
```

### ratings
Оценки и отзывы.

```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    cleaner_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE INDEX idx_ratings_cleaner_id ON ratings(cleaner_id);
CREATE INDEX idx_ratings_order_id ON ratings(order_id);
```

### notifications
Уведомления для пользователей.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- order_created, order_assigned, order_completed, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_order_id UUID REFERENCES orders(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

## State Machine для заказов

```
pending → assigned → in_progress → completed → paid
   ↓         ↓            ↓
cancelled cancelled  cancelled
```

### Переходы:
- `pending` → `assigned`: Уборщик принял заказ
- `assigned` → `in_progress`: Уборщик начал работу
- `in_progress` → `completed`: Уборщик завершил работу
- `completed` → `paid`: Клиент оплатил заказ
- Любой статус → `cancelled`: Отмена заказа
