# Admin Module — Login, Products, Categories, Coupons, Floors & Tables

Self-contained module for a hackathon project, built against a **live,
shared Supabase/PostgreSQL database** — the schema already exists and is
used by other modules (`orders`, `order_items`, `waitlist`, `_OrderTables`).
This module does not create or destructively alter any of those tables; it
only adds a `floors` table and a `floor_id` column on the existing `tables`
table. See `backend/sql/migration_floors.sql`.

## Stack
- **Frontend:** React (Vite), Tailwind CSS, Axios, React Router, socket.io-client
- **Backend:** Node.js, Express, JWT, Socket.IO, raw SQL via `pg`
- **Database:** PostgreSQL (Supabase, shared with other modules)

## ⚠️ Schema is the source of truth — read this first
The live `users`, `categories`, `products`, `coupons`, and `tables` tables
do **not** match a "typical" e-commerce schema. Notable differences this
module is built around:

| Table | Real columns | Notes |
|---|---|---|
| `users` | id, name, email, **password**, role, created_at | bcrypt hash goes straight in the `password` column (not `password_hash`). `role` is a Postgres enum: `admin \| staff \| chef`. |
| `categories` | id, name, **color**, created_at | No `description`. `color` is a hex string, e.g. `#6366F1`. |
| `products` | id, name, price, **tax**, description, category_id, created_at | No `stock`, no `image_url`. `description` and `category_id` are both `NOT NULL`. |
| `coupons` | id, code, **type**, **value** | No min order / max uses / expiry / active flag. `type` is an enum: `percentage \| fixed`. No PUT route (delete + recreate). |
| `tables` | id, **table_number**, **seats**, status, **floor** (text) | `status` is an enum: `available \| occupied \| reserved \| inactive`. `floor` was originally a free-text column — see below. |
| `floors` | id, name, created_at | **Added by this module.** Did not exist before. |

### How `floors` was retrofitted onto `tables.floor`
`tables.floor` was a plain text column with no foreign key. Since you
wanted real floor management (create/edit/delete floors, assign tables to
them), `backend/sql/migration_floors.sql`:
1. Creates a `floors` table.
2. Backfills it with one row per distinct value already in `tables.floor`.
3. Adds `tables.floor_id` (FK → `floors.id`, `ON DELETE SET NULL`).
4. Adds two triggers so the legacy `tables.floor` text column **stays in
   sync automatically** — any other module reading `tables.floor` directly
   keeps working without changes, even though the admin UI now drives
   everything through `floor_id`.

This is additive only — nothing is dropped, and `tables.floor` is never
removed.

## Directory structure
```
admin-module/
├── backend/
│   ├── config/db.js              # pg Pool
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js       # also maps PG 23505/23503 to 409s
│   ├── models/                   # raw SQL queries, matched to live columns
│   │   ├── userModel.js
│   │   ├── categoryModel.js
│   │   ├── productModel.js
│   │   ├── couponModel.js
│   │   ├── floorModel.js
│   │   └── tableModel.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   ├── couponController.js
│   │   ├── floorController.js
│   │   └── tableController.js
│   ├── routes/
│   │   ├── authRoutes.js         # POST /auth/login
│   │   ├── productRoutes.js      # GET/POST/PUT/DELETE /products
│   │   ├── categoryRoutes.js     # GET/POST/PUT/DELETE /categories
│   │   ├── couponRoutes.js       # GET/POST/DELETE /coupons
│   │   ├── floorRoutes.js        # GET/POST/PUT/DELETE /floors
│   │   └── tableRoutes.js        # GET/POST/PUT/DELETE /tables
│   ├── scripts/seedAdmin.js      # creates first admin user
│   ├── sql/
│   │   ├── migration_floors.sql  # RUN THIS — adds floors table + floor_id
│   │   └── schema_reference.sql  # reference snapshot of the live schema
│   ├── socket.js                 # Socket.IO init
│   ├── server.js                 # entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/axios.js          # axios instance + JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx        # also exports the shared socket client
    │   │   ├── Layout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Modal.jsx
    │   │   └── ConfirmDialog.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Products.jsx
    │   │   ├── Categories.jsx
    │   │   ├── Coupons.jsx
    │   │   ├── Floors.jsx
    │   │   └── Tables.jsx
    │   ├── utils/helpers.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

## Routes implemented
| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/auth/login` | — | returns `{ token, user }` |
| GET | `/products` | JWT | `?search=&categoryId=` |
| POST | `/products` | JWT | body: `name, price, tax, description, categoryId`. emits `product:created` |
| PUT | `/products/:id` | JWT | emits `product:updated` |
| DELETE | `/products/:id` | JWT | emits `product:deleted`; 409 if referenced by orders |
| GET | `/categories` | JWT | `?search=` |
| POST | `/categories` | JWT | body: `name, color` (hex). emits `category:created` |
| PUT | `/categories/:id` | JWT | emits `category:updated` |
| DELETE | `/categories/:id` | JWT | emits `category:deleted`; 409 if products still reference it |
| GET | `/coupons` | JWT | |
| POST | `/coupons` | JWT | body: `code, type (percentage\|fixed), value`. emits `coupon:created` |
| DELETE | `/coupons/:id` | JWT | emits `coupon:deleted` |
| GET | `/floors` | JWT | `?search=` |
| POST | `/floors` | JWT | body: `name`. emits `floor:created` |
| PUT | `/floors/:id` | JWT | emits `floor:updated`; renaming cascades to `tables.floor` via trigger |
| DELETE | `/floors/:id` | JWT | emits `floor:deleted`; blocked (409) if the floor still has tables |
| GET | `/tables` | JWT | `?search=&floorId=&status=` |
| POST | `/tables` | JWT | body: `tableNumber, seats, floorId, status`. emits `table:created`; table number must be unique per floor |
| PUT | `/tables/:id` | JWT | emits `table:updated` |
| DELETE | `/tables/:id` | JWT | emits `table:deleted`; 409 if referenced by `_OrderTables` |

Coupons intentionally have **no PUT/edit route** — matches the live
table's minimal shape (`code, type, value` only). Delete and recreate
instead of editing in place.

## Setup

### 1. Database
The database already exists — do **not** run a fresh schema creation
script. Apply only the additive migration:
```bash
psql "$DATABASE_URL" -f backend/sql/migration_floors.sql
```
or paste `backend/sql/migration_floors.sql` into the Supabase SQL editor.

`backend/sql/schema_reference.sql` is documentation only (a snapshot of
the live schema this module is coded against) — don't execute it against
the real database.

### 2. Backend
```bash
cd backend
cp .env.example .env        # edit PG_*/DATABASE_URL and JWT_SECRET
npm install
npm run seed:admin          # creates an admin user from SEED_ADMIN_* in .env
npm run dev                 # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env        # point VITE_API_URL / VITE_SOCKET_URL at the backend
npm install
npm run dev                 # http://localhost:5173
```

Log in with the email/password printed by `seed:admin` (defaults to
`admin@example.com` / `Admin@12345` unless overridden in `.env`).

## Wiring this into other modules
- **Auth:** any other module can reuse the same JWT — verify it with the
  same `JWT_SECRET` and the `authMiddleware` pattern in
  `backend/middleware/auth.js`. `role` is one of `admin | staff | chef`.
- **Data:** all tables are plain PostgreSQL tables shared with the rest of
  the project; other modules (orders, waitlist, storefront, kitchen
  display, table-booking/QR ordering) can read/write them directly or call
  these REST routes. `tables.floor_id` is the new way to associate a table
  with a floor; `tables.floor` (text) is kept in sync automatically for
  any code that hasn't migrated to `floor_id` yet.
- **Real-time:** connect to the same Socket.IO server and listen for
  `product:*`, `category:*`, `coupon:*`, `floor:*`, `table:*` events to
  keep other modules' UIs (e.g. a live floor/table availability map) in
  sync without polling.
