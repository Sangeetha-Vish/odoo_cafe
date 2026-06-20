-- =========================================================
-- Admin Module Schema (PostgreSQL)
-- Tables: users, categories, products, coupons, floors, restaurant_tables
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL,
    email           VARCHAR(160)  NOT NULL UNIQUE,
    password_hash   TEXT          NOT NULL,
    role            VARCHAR(30)   NOT NULL DEFAULT 'admin',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(160)  NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock           INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id     INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
    image_url       TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(40)   NOT NULL UNIQUE,
    discount_type   VARCHAR(10)   NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
    min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_uses        INTEGER,
    used_count      INTEGER       NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS floors (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(60)   NOT NULL,
    capacity        INTEGER       NOT NULL DEFAULT 2 CHECK (capacity > 0),
    floor_id        INTEGER       NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    status          VARCHAR(20)   NOT NULL DEFAULT 'available'
                                  CHECK (status IN ('available', 'occupied', 'reserved', 'inactive')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (floor_id, name)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_tables_floor_id ON restaurant_tables(floor_id);

-- Run `npm run seed:admin` (backend/scripts/seedAdmin.js) to create the
-- first admin user with a properly bcrypt-hashed password instead of
-- inserting one manually here.
