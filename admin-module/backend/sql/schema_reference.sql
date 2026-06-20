-- =========================================================
-- REFERENCE ONLY — this is a snapshot of the LIVE Supabase
-- schema this admin module is built against. It is NOT meant
-- to be run to create the database (the database already
-- exists and is shared with other modules: orders, order_items,
-- waitlist, _OrderTables).
--
-- To apply the admin module's additions (the "floors" table and
-- "tables.floor_id"), run sql/migration_floors.sql instead.
-- =========================================================

-- ---- enums (USER-DEFINED types in information_schema) ----
-- Confirm exact names/values in Supabase before relying on them;
-- the values below are what this module validates against.
CREATE TYPE user_role   AS ENUM ('admin', 'staff', 'chef');
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'inactive');
-- orders.status is also USER-DEFINED — not modified by this module,
-- left as-is (e.g. pending/preparing/served/paid/cancelled or similar).

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    password    TEXT NOT NULL,          -- bcrypt hash stored here directly
    role        user_role NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    price        DOUBLE PRECISION NOT NULL,
    tax          DOUBLE PRECISION NOT NULL,
    description  TEXT NOT NULL,
    category_id  INTEGER NOT NULL REFERENCES categories(id),
    created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
    id     SERIAL PRIMARY KEY,
    code   TEXT NOT NULL,
    type   coupon_type NOT NULL,
    value  DOUBLE PRECISION NOT NULL
);

CREATE TABLE order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity   INTEGER NOT NULL,
    price      DOUBLE PRECISION NOT NULL,
    completed  BOOLEAN NOT NULL,
    status     TEXT NOT NULL
);

CREATE TABLE waitlist (
    id            SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    group_size    INTEGER NOT NULL,
    status        TEXT NOT NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "_OrderTables" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    customer_name  TEXT,
    subtotal       DOUBLE PRECISION NOT NULL,
    tax            DOUBLE PRECISION NOT NULL,
    discount       DOUBLE PRECISION NOT NULL,
    total          DOUBLE PRECISION NOT NULL,
    payment_method TEXT NOT NULL,
    status         TEXT NOT NULL, -- USER-DEFINED enum in reality
    created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE tables (
    id            SERIAL PRIMARY KEY,
    table_number  TEXT NOT NULL,
    seats         INTEGER NOT NULL,
    status        table_status NOT NULL,
    floor         TEXT NOT NULL
    -- floor_id INTEGER REFERENCES floors(id)  <-- added by migration_floors.sql
);

-- ---- Added by this module (see migration_floors.sql for the
-- actual non-destructive ALTER/CREATE statements) ----
-- CREATE TABLE floors ( id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, created_at ... );
-- ALTER TABLE tables ADD COLUMN floor_id INTEGER REFERENCES floors(id);
