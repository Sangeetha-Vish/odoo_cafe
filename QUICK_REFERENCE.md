# Quick Reference: Authentication Flow

## Complete Auth Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIGNUP/LOGIN PAGE (/)                     │
│  - Create new account (ADMIN or EMPLOYEE role only)             │
│  - Login with email and password                                 │
│  - NO CUSTOMER accounts                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ Login Success
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              POS SESSION DASHBOARD (/pos-session)                │
│  - Welcome message with user name                               │
│  - Display role (ADMIN or EMPLOYEE)                             │
│  - Two info cards (POS Session, Session Status)                 │
│  - "Open Session" button                                        │
│  - Logout button                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │ Click "Open Session"
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│          MODULE LOADING PAGE (/module-loading)                   │
│  - Shows "POS Module Integration Pending"                       │
│  - Displays current user context                                │
│  - "Return to Session Dashboard" button                         │
│  - Logout button                                                │
│  - PLACEHOLDER: Awaiting official POS module integration        │
└─────────────────────────────────────────────────────────────────┘
```

## localStorage After Login

```javascript
{
  token:   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  role:    "ADMIN" | "EMPLOYEE",
  userId:  "123",
  user:    {
    id:    "123",
    name:  "John Doe",
    email: "john@example.com",
    role:  "ADMIN" | "EMPLOYEE"
  }
}
```

## What Changed

| File | Change | Reason |
|------|--------|--------|
| **App.jsx** | Removed dev navigation links | Decouple from temp POS implementation |
| **App.jsx** | Added `userId` to logout | Store user ID for future features |
| **AuthPage.jsx** | Store `userId` separately | Quick access to user ID |
| **POSSession.jsx** | Added error handling | Robust localStorage parsing |
| **ModuleLoading.jsx** | Added error handling | Robust localStorage parsing |
| **Header** | Removed /tables, /orders links | Production auth flow only |

## What Did NOT Change

- ✅ Backend authentication (`authController.js`)
- ✅ JWT token generation
- ✅ Role validation (ADMIN/EMPLOYEE only)
- ✅ Password hashing with bcrypt
- ✅ Login and Signup API endpoints
- ✅ Users table structure
- ✅ Protected route system

## Decoupled (Available but Not Linked)

These pages still exist but are no longer part of the main auth flow:

- `/tables` - Floor Plan (for testing only)
- `/pos/:tableId` - POS Order View (for testing only)
- `/orders` - Orders History (for testing only)
- `/kitchen` - Kitchen View (if exists)

**Access:** Direct URL navigation only (not linked from UI)

## Key Features

✅ **Clean Auth Flow**: Signup → Login → POS Session → Module Loading
✅ **Role Management**: Only ADMIN and EMPLOYEE accounts
✅ **Secure Storage**: JWT token + user context in localStorage
✅ **Protected Routes**: All pages except auth require token
✅ **Proper Logout**: Clears all sensitive data
✅ **Integration Ready**: Placeholder for official POS module
✅ **Error Handling**: Graceful fallbacks and user messages
✅ **Production Ready**: Complete and tested

## Testing Quick Commands

```bash
# Backend - Start server
cd backend
npm install  # if needed
npm run dev

# Frontend - Start dev server
cd frontend
npm install  # if needed
npm run dev

# Navigate to: http://localhost:5173
```

## Test Accounts (After Creating)

```
Admin Account:
Email: admin@odoo.com
Password: Admin123
Role: ADMIN

Employee Account:
Email: emp@odoo.com
Password: Emp1234
Role: EMPLOYEE
```

## Next Steps for Team Integration

When the official POS module is ready:

1. Create new route `/odoo-pos-main` (or team's route)
2. Update `handleOpenSession()` in POSSession to point to new module
3. Keep `/pos-session` as dashboard/home
4. Keep authentication unchanged
5. Pass user context (id, name, role) to new module

```javascript
// Example in POSSession.jsx
const handleOpenSession = () => {
  // Navigate to official POS module
  navigate('/odoo-pos-main');
};
```

---

**Status**: ✅ Production Ready | **Updated**: 2026-06-20
