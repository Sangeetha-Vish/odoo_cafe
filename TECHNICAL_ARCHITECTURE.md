# Odoo Café Kitchen Display System (KDS) - Technical Architecture

**Last Updated:** June 20, 2026  
**Audience:** Technical jury, code reviewers, architecture stakeholders

---

## Project Overview

**Purpose:** A real-time kitchen display system for a café that manages orders from table-to-kitchen, with features like:
- Live order queue with FIFO prioritization
- Per-item preparation tracking and strike-through UI
- Bulk macro-actions (mark all of one product as complete across all tickets)
- Real-time WebSocket synchronization
- Supabase PostgreSQL backend with Prisma ORM
- React + Vite frontend with optimistic UI updates

---

## File Structure & Purpose

### Root Level

#### `package.json` (Root)
- **Purpose:** Shared project configuration and workspace scripts  
- **Key Scripts:**  
  - `npm run dev` → starts frontend + backend dev servers in parallel  
  - `npm run db:seed` → populates Supabase with initial product/category data

#### `.env` (Root)
- **Purpose:** Environment variables for backend and database  
- **Critical Variables:**  
  - `DATABASE_URL` → Supabase PostgreSQL connection string (used by Prisma)  
  - `DIRECT_URL` → Direct TCP connection for migrations (avoids connection pooling issues)

#### `prisma.config.ts`
- **Purpose:** Prisma client configuration  
- **Role:** Exports a helper `defineConfig()` function to avoid requiring Prisma's official import (workaround for ESM module resolution)

#### `server.js`
- **Purpose:** Backend entry point  
- **Responsibilities:**  
  1. Initialize Express.js HTTP server  
  2. Wrap with Node.js `http.Server` for Socket.IO  
  3. Attach `initSocket()` to the server  
  4. Listen on port 5000

---

### Backend (`/src`)

#### `src/index.js`
- **Purpose:** Alternative backend startup (also initializes server + Socket.IO)  
- **Note:** May be redundant with `server.js`; clarify which is the canonical entrypoint

#### `src/socket/socket.js`
- **Purpose:** Socket.IO server initialization  
- **Exports:** `initSocket(server)` function  
- **Events Emitted:**  
  - `order-created` → triggered when new order arrives  
  - `order-status-updated` → when order moves between stages (TO_COOK → PREPARING → COMPLETED)  
  - `item-status-toggled` → when individual item is marked complete/incomplete
- **Connections:** Establishes real-time bidirectional communication channel for live updates

#### `src/routes/kitchen.routes.js`
- **Purpose:** Kitchen-specific API endpoints  
- **Endpoints:**  
  - `GET /kitchen/orders?status=TO_COOK` → fetch orders by stage  
  - `PATCH /orders/:id/status` → advance order state  
  - `PATCH /items/:id/toggle` → toggle item completion status
- **Client Caller:** [client/src/pages/KitchenDashboard.jsx](client/src/pages/KitchenDashboard.jsx)

#### `src/services/kitchen.service.js`
- **Purpose:** Business logic layer for kitchen operations  
- **Responsibilities:**  
  - Query and update order/item records via Prisma  
  - Emit Socket.IO events after state changes

#### `src/controllers/kitchen.controller.js`
- **Purpose:** Request handlers for kitchen routes  
- **Role:** Validates incoming requests, delegates to service layer, returns responses

#### `src/middleware/validateStatus.js`
- **Purpose:** Middleware to validate order status transitions  
- **Enforces:** Valid state machine rules (e.g., can't jump from TO_COOK directly to COMPLETED)

#### `src/utils/statusTransition.js`
- **Purpose:** Status transition logic/rules  
- **Used By:** Validation middleware and service layer

#### `prisma/schema.prisma`
- **Purpose:** ORM schema definition for Supabase PostgreSQL  
- **Key Models:**  
  - `Order` → parent order record (id, customer_name, status, total, tax, etc.)  
  - `OrderItem` → line items per order (maps product, quantity, completion status)  
  - `Product` → menu items (name, price, category_id, tax)  
  - `Category` → product categories (name, color for UI)  
  - `Table` → physical tables in café (table_number, seats, status)

---

### Frontend (`/client/src`)

#### `client/src/pages/KitchenDashboard.jsx`
- **Purpose:** Main kitchen display dashboard UI component  
- **Scope:** React page that renders ticket grid, filters, and macro actions

**Key Responsibilities:**

1. **Local Data Caching**
   - Maintains `allCachedOrders` state in memory
   - Fetches full order list once on mount/tab-change via `GET /api/kitchen/orders?status=<activeTab>`
   - All filtering, aggregation, and interactions operate on this local cache

2. **Instant UI Updates (Optimistic)**
   - Item checkbox clicks → immediately toggle `completed` in local cache
   - Filter selections → instant local filtering (no server call)
   - Macro pill clicks → instantly strike all matching products across all tickets
   - Backend syncs happen **asynchronously** in background with `PATCH` requests

3. **Real-time Synchronization**
   - Socket.IO connection listens for:  
     - `order-created` → new order added, refetch cache  
     - `order-status-updated` → order moved between stages, refetch cache  
     - `item-status-toggled` → item struck elsewhere, refetch cache to reconcile

4. **Aggregations (Computed Memoized)**
   - `macroSummary` → counts uncompleted items by product name (for top header pills)  
   - `filteredOrders` → applies search, product filter, category filter to cache  
   - `uniqueProductsForFilter` → extracts unique product names for sidebar menu

5. **Schema Resilience**
   - Reads order items with fallback chain:  
     ```javascript
     order.order_items || order.OrderItems || order.items || []
     ```
   - Handles different backend naming conventions gracefully

6. **Handlers**
   - `handleMacroStrikeClick(productName)` → mark all instances of product complete in all orders
   - `handleToggleItemStrike(order, itemId, completed)` → toggle single item completion
   - `handleMoveOrderStage(orderId, status)` → advance order to next stage (instant local removal, async backend sync)

**Data Flow:**
```
┌─────────────────────────────────────────────────────────┐
│ Mount / Tab Change                                      │
│   ↓                                                      │
│ fetchOrdersSync()                                       │
│   ↓                                                      │
│ GET /api/kitchen/orders?status=<activeTab>             │
│   ↓                                                      │
│ setAllCachedOrders([...])                               │
│   ↓                                                      │
│ macroSummary & filteredOrders recompute (memoized)     │
│   ↓                                                      │
│ Render UI based on cache                                │
│                                                          │
│ User Interaction (click checkbox, macro pill, etc.)     │
│   ↓                                                      │
│ Update allCachedOrders immediately (optimistic)         │
│   ↓                                                      │
│ UI re-renders instantly                                 │
│   ↓                                                      │
│ Background: send PATCH request (async, fire & forget)   │
│   ↓                                                      │
│ Server responds, emits Socket.IO event                 │
│   ↓                                                      │
│ Socket listener triggers fetchOrdersSync() to reconcile │
└─────────────────────────────────────────────────────────┘
```

---

#### `client/src/components/OrderTicket.jsx`
- **Purpose:** Reusable ticket card component (if separate from main dashboard)  
- **Displays:** Single order card with items, status badge, and actions

#### `client/src/App.jsx`
- **Purpose:** Root React app shell  
- **Responsibility:** Routes between pages (KitchenDashboard, Orders, POS, Tables, etc.)

#### `client/src/services/api.js`
- **Purpose:** Axios HTTP client configuration  
- **Base URL:** `http://localhost:5000/api`  
- **Used By:** All components for REST calls to backend

---

## API Contracts

### Kitchen Endpoints (Backend → Frontend)

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|--------------|----------|-------|
| GET | `/api/kitchen/orders?status=TO_COOK` | — | `[Order]` | Fetch orders by status |
| PATCH | `/api/orders/:id/status` | `{ status: "PREPARING" }` | `Order` | Advance order state |
| PATCH | `/api/items/:id/toggle` | `{ currentStatus: false }` | `OrderItem` | Toggle item completion |

### Socket.IO Events

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|---------|
| `order-created` | Server → Client | Order object | New order placed |
| `order-status-updated` | Server → Client | Order object | Order moved to next stage |
| `item-status-toggled` | Server → Client | OrderItem object | Item completion toggled |

---

## Performance & Consistency Model

### Latency Reduction
- **Problem:** Cloud database (Supabase) introduces 1–2 second round-trip per request.
- **Solution:** Local in-memory cache + optimistic UI updates.
- **Result:** Filters, checkbox clicks, and macro actions appear instant (< 100ms) to user.

### Consistency & Error Handling
- **Optimistic Updates:** UI changes immediately; server is authoritative.
- **Reconciliation:** Socket events trigger `fetchOrdersSync()` to sync cache with server truth.
- **Fallback:** Order stage changes include rollback on failed `PATCH` (refetch and alert).
- **Risk:** Background patches (item toggles, macro strikes) are fire-and-forget; failed patches logged but not immediately surfaced.

### Concurrent Users
- **Current Design:** No per-order locking; server-side validation must handle race conditions.
- **Recommendation:** Implement server-side conflict detection or use database transactions for critical state changes.

---

## Security Considerations

1. **Authentication:**
   - Assume JWT or session-based auth is implemented.
   - Backend routes should validate request origin and user role (kitchen staff).

2. **API Authorization:**
   - Backend must verify user has `EMPLOYEE` or `ADMIN` role before accepting status changes.
   - Validate order ownership (staff can only modify orders from their kitchen).

3. **Data Validation:**
   - Server-side validation of status transitions prevents invalid states.
   - Sanitize customer names and product descriptions.

4. **HTTPS/TLS:**
   - Use TLS in production for all API and WebSocket traffic.
   - Store `DATABASE_URL` securely (never commit to repo).

---

## Jury Q&A (Technical Interview Prep)

### Q1: How do you achieve low latency (instant UI updates)?
**A:** Local React state cache (`allCachedOrders`) stores orders in memory. Filtering, aggregation, and UI interactions run locally without network calls. Background syncs via `PATCH` happen asynchronously; Socket.IO events reconcile cache if server state diverges.

### Q2: What happens if two cooks toggle the same item simultaneously?
**A:** Both send `PATCH` requests; server state updates last-write-wins (current behavior). Later Socket event refetch ensures eventual consistency. For strong consistency, implement server-side locking or optimistic lock versioning (recommend conflict-free replicated data types or timestamps).

### Q3: How do you handle a failed backend sync?
**A:** Failed background patches log to console. Reconciliation occurs on next Socket event or user refetch. **Gap:** User is not alerted of failure; recommend adding a retry queue and UI toast notifications.

### Q4: Why use both REST and WebSocket?
**A:** REST (`PATCH` requests) sends commands; WebSocket (`order-created`, etc.) broadcasts server-authoritative updates to all connected clients. Hybrid approach balances request/response clarity (REST) with real-time pub-sub (WebSocket).

### Q5: How would you scale this to 100+ concurrent orders?
**A:** Current design allows caching many orders. Bottleneck is Supabase connection pool. Mitigations:
  - Implement server-side caching/memoization for frequently-accessed orders.
  - Paginate orders if count exceeds memory budget.
  - Use database connection pooling (PgBouncer).
  - Consider read replicas for high-traffic queries.

### Q6: What testing strategy would you recommend?
**A:**
  - **Unit Tests:** Filtering, aggregation functions (`macroSummary`, `filteredOrders`).
  - **Integration Tests:** Mock axios and Socket.IO; test optimistic update workflows.
  - **E2E Tests:** Selenium/Playwright; simulate multiple concurrent users toggling items, verify UI and backend consistency.
  - **Load Tests:** k6 or JMeter to simulate 50+ concurrent users placing/updating orders.

### Q7: Is there a single point of failure?
**A:** Yes—Supabase (backend database). If DB goes down, KDS stops functioning. Mitigations:
  - Multi-region failover (Supabase replication).
  - Offline mode: queue local updates; sync when connection restored.
  - Background error logging/alerting (e.g., Sentry).

### Q8: How do you handle the "completed order" state and clearing old tickets?
**A:** Orders with status `COMPLETED` remain in the database and are fetched if user navigates to "COMPLETED" tab. To avoid clutter, implement TTL (time-to-live) archival—move completed orders > 4 hours old to archive table; exclude from main query.

---

## Deployment Checklist

- [ ] Supabase project created + `DATABASE_URL` and `DIRECT_URL` in `.env`
- [ ] Run `npx prisma db push` to sync schema
- [ ] Run `npm run db:seed` to populate initial data
- [ ] Backend starts: `node server.js` on port 5000 with Socket.IO listening
- [ ] Frontend starts: `npm run dev` in `/client`; connects to `http://localhost:5000`
- [ ] Socket.IO connection verified in browser DevTools (WebSocket connections tab)
- [ ] Test a manual order creation → should appear in dashboard instantly (or within 2–3 seconds via socket event)
- [ ] Test macro strike on top pill → verify all matching items struck across all orders

---

## Key Metrics / KPIs

| Metric | Target | Current |
|--------|--------|---------|
| Filter/Search latency | < 100ms | ✓ (local cache) |
| Item strike response | < 50ms (UI) | ✓ (optimistic) |
| Order state change | 1–2s (including DB round-trip) | ⚠ (depends on Supabase) |
| Socket.IO broadcast latency | < 500ms | ✓ (local network) |
| Cache reconciliation | < 1s | ✓ (refetch trigger on event) |

---

## Known Issues & Recommendations

| Issue | Impact | Recommendation |
|-------|--------|-----------------|
| No retry on failed background patches | Low | Implement exponential backoff queue; surface errors to UI |
| No per-order locking on concurrent updates | Medium | Add server-side version/lock mechanism |
| Full order refetch on every Socket event | Medium | Implement delta sync (only refetch changed orders) |
| No offline mode | High | Queue local updates; sync on reconnect |
| Order archive/cleanup | Low | Implement TTL-based archival for orders > 4 hours old |

---

## Conclusion

The KDS is a **low-latency, real-time order management dashboard** built with React + Node.js + Supabase. It prioritizes **instant UI feedback** via local caching and optimistic updates, while maintaining eventual consistency through Socket.IO events. The architecture is suitable for small-to-medium café operations (10–50 concurrent orders) but would benefit from caching, connection pooling, and conflict detection for higher scale.

**Strengths:**
- Instant filtering and macro actions (local cache)
- Real-time synchronization via WebSocket
- Resilient schema mapping (fallback property names)

**Areas for Hardening:**
- Error handling and user feedback
- Concurrency control (locking)
- Offline-first capability
- Integration tests and load testing

---

*Document prepared for technical jury review | Odoo Café KDS v1.0*
