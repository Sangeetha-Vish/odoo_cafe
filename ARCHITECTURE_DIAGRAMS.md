# Visual Architecture & Data Flow Diagrams

## 1. Complete Authentication Flow Diagram

```
╔════════════════════════════════════════════════════════════════╗
║                    USER AUTHENTICATION FLOW                     ║
╚════════════════════════════════════════════════════════════════╝

                            ┌─────────────────┐
                            │   Home Page     │
                            │  localhost:5173 │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                                 │
                    ↓                                 ↓
         ┌──────────────────┐           ┌──────────────────┐
         │   SIGNUP FORM    │           │   LOGIN FORM     │
         ├──────────────────┤           ├──────────────────┤
         │ - Name           │           │ - Email          │
         │ - Email          │           │ - Password       │
         │ - Password       │           │                  │
         │ - Role           │           │ [Sign In Button] │
         │   (ADMIN/EMP)    │           └────────┬─────────┘
         │                  │                    │
         │ [Create Acct]    │                    │ POST /auth/login
         └────────┬─────────┘                    ↓
                  │                  ┌──────────────────────┐
         POST /auth/signup           │  Backend Validates   │
                  │                  │  - Check email       │
                  ↓                  │  - Verify password   │
         ┌──────────────────┐        │  - Return JWT + user │
         │ User Stored in   │        └─────────┬────────────┘
         │ Database         │                  │
         │ - Hash password  │                  ↓
         │ - Store role     │        ┌──────────────────────┐
         └────────┬─────────┘        │ Frontend Receives    │
                  │                  │ - JWT Token          │
                  │                  │ - User Data (w/ role)│
                  │                  └─────────┬────────────┘
                  │                           │
                  └───────────────────────────┤
                                              │
                              ┌───────────────┴────────────────┐
                              │                                │
                              ↓                                ↓
                    ┌────────────────────┐      ┌─────────────────────┐
                    │  Save to           │      │  Auto-Redirect to   │
                    │  localStorage      │      │  /pos-session       │
                    ├────────────────────┤      └─────────────────────┘
                    │ token              │
                    │ role               │              ↓
                    │ userId             │      ┌──────────────────────┐
                    │ user (JSON)        │      │  POS SESSION         │
                    └────────────────────┘      │  DASHBOARD           │
                                               │  (/pos-session)      │
                                               │                      │
                                               │  - Welcome msg       │
                                               │  - Show user name    │
                                               │  - Show role badge   │
                                               │  - Info cards        │
                                               │  - Open Session btn  │
                                               │  - Logout btn        │
                                               └──────────┬───────────┘
                                                         │
                                                         │
                                    Click "Open Session"│
                                                         ↓
                                               ┌──────────────────────┐
                                               │  MODULE LOADING      │
                                               │  PAGE                │
                                               │  (/module-loading)   │
                                               │                      │
                                               │  "Integration        │
                                               │   Pending"           │
                                               │                      │
                                               │  Show user context   │
                                               │  - Name              │
                                               │  - Email             │
                                               │  - Role              │
                                               │                      │
                                               │  [Return to Session] │
                                               │  [Logout]            │
                                               └──────────────────────┘
```

---

## 2. localStorage State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              BROWSER LOCALSTORAGE STATES                    │
└─────────────────────────────────────────────────────────────┘

STATE 1: NOT LOGGED IN
┌──────────────────────┐
│ localStorage:        │
│ - EMPTY              │
│                      │
│ Routes accessible:   │
│ ✓ / (AuthPage)       │
│ ✗ /pos-session       │
│ ✗ /module-loading    │
│ ✗ /tables            │
│ ✗ /pos/:tableId      │
│ ✗ /orders            │
└──────────┬───────────┘
           │
           │ User submits login
           │ Credentials valid
           │
           ↓
STATE 2: LOGGED IN
┌──────────────────────────────┐
│ localStorage:                │
│ {                            │
│   token: "JWT_STRING",       │
│   role: "ADMIN",             │
│   userId: "1",               │
│   user: {                    │
│     id: 1,                   │
│     name: "John Doe",        │
│     email: "john@example",   │
│     role: "ADMIN"            │
│   }                          │
│ }                            │
│                              │
│ Routes accessible:           │
│ ✓ / (redirects)              │
│ ✓ /pos-session               │
│ ✓ /module-loading            │
│ ✓ /tables                    │
│ ✓ /pos/:tableId              │
│ ✓ /orders                    │
└──────────┬──────────────────┘
           │
           │ User clicks logout
           │ OR token expires
           │
           ↓
STATE 3: LOGGED OUT
┌──────────────────────┐
│ localStorage:        │
│ - CLEARED            │
│ - EMPTY              │
│                      │
│ Routes accessible:   │
│ ✓ / (AuthPage)       │
│ ✗ /pos-session       │
│ ✗ /module-loading    │
│ ✗ /tables            │
│ ✗ /pos/:tableId      │
│ ✗ /orders            │
│                      │
│ Auto redirect to /   │
└──────────────────────┘
```

---

## 3. Component Hierarchy & Data Flow

```
                              ┌──────────────┐
                              │   App.jsx    │
                              │  (Router)    │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    │                │                │
       ┌────────────▼─────────┐  ┌──▼─────────────┐ ┌▼───────────────┐
       │   AuthPage (/)       │  │ Header (Dev)   │ │ ProtectedRoute │
       │   ┌────────────────┐ │  │                │ │ wrapper        │
       │   │ LoginForm      │ │  │ ┌────────────┐ │ └┬──────────────┘
       │   │ ┌────────────┐ │ │  │ │ User Info  │ │  │
       │   │ │ Email      │ │ │  │ │ Role badge │ │  │
       │   │ │ Password   │ │ │  │ │ Logout btn │ │  ├──→ /pos-session
       │   │ │ [Sign In]  │ │ │  │ └────────────┘ │  │
       │   │ └────────────┘ │ │  └────────────────┘  ├──→ /module-loading
       │   │                │ │                       │
       │   │ SignupForm     │ │                       ├──→ /tables
       │   │ ┌────────────┐ │ │                       │
       │   │ │ Name       │ │ │                       ├──→ /pos/:tableId
       │   │ │ Email      │ │ │                       │
       │   │ │ Password   │ │ │                       └──→ /orders
       │   │ │ Role Sel   │ │ │
       │   │ │ [Sign Up]  │ │ │
       │   │ └────────────┘ │ │
       │   └────────────────┘ │
       └────────┬─────────────┘
                │
                │ onAuthSuccess(token, role, user)
                │ localStorage.setItem('token', token)
                │ localStorage.setItem('role', role)
                │ localStorage.setItem('userId', user.id)
                │ localStorage.setItem('user', JSON.stringify(user))
                │ navigate('/pos-session')
                │
                ↓
        ┌──────────────────────┐
        │ POSSession.jsx       │
        │ (/pos-session)       │
        │ ┌──────────────────┐ │
        │ │ Navbar           │ │
        │ │ ┌──────────────┐ │ │
        │ │ │ Welcome Msg  │ │ │
        │ │ │ User Name    │ │ │
        │ │ │ Role Badge   │ │ │
        │ │ │ Logout btn   │ │ │
        │ │ └──────────────┘ │ │
        │ ├──────────────────┤ │
        │ │ Two Cards:       │ │
        │ │ ┌──────────────┐ │ │
        │ │ │ POS Session  │ │ │
        │ │ │ [Open Sess]→─┼─┼─┼──→ navigate('/module-loading')
        │ │ └──────────────┘ │ │
        │ │ ┌──────────────┐ │ │
        │ │ │ Status       │ │ │
        │ │ │ Ready to Go  │ │ │
        │ │ └──────────────┘ │ │
        │ └──────────────────┘ │
        └──────────────────────┘
                │
                │ handleOpenSession()
                │
                ↓
        ┌────────────────────────────┐
        │ ModuleLoading.jsx          │
        │ (/module-loading)          │
        │ ┌──────────────────────┐   │
        │ │ Integration Pending  │   │
        │ │ Message              │   │
        │ ├──────────────────────┤   │
        │ │ Current User Info    │   │
        │ │ - Name: {user.name}  │   │
        │ │ - Email: {user.email}│   │
        │ │ - Role: {user.role}  │   │
        │ ├──────────────────────┤   │
        │ │ [Return to Session]  │   │
        │ │ [Logout]             │   │
        │ └──────────────────────┘   │
        └────────────────────────────┘
```

---

## 4. API Request/Response Flow

```
FRONTEND REQUEST WITH JWT
┌───────────────────────────────────┐
│ Axios Interceptor (App.jsx)       │
└───┬─────────────────────────────┬─┘
    │                             │
    │ GET token from localStorage │
    │                             │
    └────────────┬────────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │ API Request Headers        │
    │ ──────────────────────────  │
    │ Authorization:             │
    │ Bearer eyJhbGciOiJIUzI1... │
    └────────────┬───────────────┘
                 │
                 ↓ SEND TO BACKEND
    ┌────────────────────────────────┐
    │ Backend authMiddleware         │
    ├────────────────────────────────┤
    │ 1. Extract token from header   │
    │ 2. Verify JWT signature        │
    │ 3. Check token expiration      │
    │ 4. Validate payload            │
    └────────┬───────────────────────┘
             │
             ├─ Valid? → Continue
             │
             └─ Invalid? → 401 Unauthorized
                           (Frontend clears storage)
```

---

## 5. Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────┐
│          ROLE HIERARCHY & PERMISSIONS                │
└─────────────────────────────────────────────────────┘

ROLES ALLOWED TO SIGN UP:
┌──────────────────────────────┐
│ ✓ ADMIN                      │
│   - Full system access       │
│   - Can manage employees     │
│   - Can manage settings      │
│   - Can start POS sessions   │
│                              │
│ ✓ EMPLOYEE                   │
│   - Can operate POS          │
│   - Can process sales        │
│   - Limited to assigned till │
│                              │
│ ✗ CUSTOMER                   │
│   - NOT allowed to sign up   │
│   - Managed inside POS       │
│   - Cannot login             │
└──────────────────────────────┘

SIGNUP VALIDATION:
┌─────────────────────────────────────────┐
│ 1. Check role parameter                 │
│ 2. Validate: ['ADMIN', 'EMPLOYEE']      │
│ 3. Convert to UPPERCASE                 │
│ 4. Store in users table                 │
│ 5. Include in JWT token payload         │
│ 6. Return to frontend in user object    │
└─────────────────────────────────────────┘

FUTURE FEATURE: Role-Based Routes
(Not yet implemented, but ready for)
┌─────────────────────────────────────┐
│ <AdminRoute>                        │
│   - Accessible only to ADMIN users  │
│   - Settings pages                  │
│   - Employee management             │
│   - System configuration            │
│                                     │
│ <OperatorRoute>                     │
│   - Accessible to ADMIN & EMPLOYEE  │
│   - POS session                     │
│   - Order management                │
│   - Sales operations                │
└─────────────────────────────────────┘
```

---

## 6. Session Lifecycle Timing Diagram

```
TIME →

[0ms] User opens app
      ↓
      localStorage is empty
      ProtectedRoute checks for token
      No token found → redirect to /
      ↓
[100ms] AuthPage loads
        ↓
        User fills login form
        ↓
[1500ms] User clicks "Sign In"
         LoginForm validates input
         ↓
[1600ms] API call: POST /auth/login
         Network latency ~200-500ms
         ↓
[2100ms] Backend receives login request
         ├─ Query database for user
         ├─ Compare passwords with bcrypt
         ├─ Generate JWT token (very fast)
         └─ Return response
         ↓
[2300ms] Frontend receives response
         {
           success: true,
           token: "JWT_STRING",
           user: {...}
         }
         ↓
[2310ms] onAuthSuccess() called
         ├─ localStorage.setItem('token', ...)
         ├─ localStorage.setItem('role', ...)
         ├─ localStorage.setItem('userId', ...)
         ├─ localStorage.setItem('user', ...)
         └─ navigate('/pos-session')
         ↓
[2400ms] /pos-session page loads
         useEffect checks localStorage
         Sets user state
         Renders welcome message
         ↓
[2500ms] User sees POS Session Dashboard
         Ready to click "Open Session"

[USER LOGS OUT]
         ↓
         handleLogout() called
         ├─ removeItem('token')
         ├─ removeItem('role')
         ├─ removeItem('userId')
         ├─ removeItem('user')
         └─ navigate('/')
         ↓
         window.location.href = '/'
         (Page reload)
         ↓
         AuthPage loads with empty localStorage
         User sees fresh login form
```

---

## 7. Error Handling Flow

```
LOGIN ATTEMPT
    │
    ├─ Empty email?
    │  └→ "Email is required"
    │
    ├─ Empty password?
    │  └→ "Password is required"
    │
    ├─ Network error?
    │  └→ "Failed to connect. Please try again"
    │
    ├─ Email not in database?
    │  └→ "Invalid email or password"
    │
    ├─ Password incorrect?
    │  └→ "Invalid email or password"
    │
    └─ Success!
       └→ Proceed to localStorage storage

SIGNUP ATTEMPT
    │
    ├─ Empty name?
    │  └→ "Name is required"
    │
    ├─ Empty email?
    │  └→ "Email is required"
    │
    ├─ Invalid email format?
    │  └→ "Please enter a valid email address"
    │
    ├─ Password < 6 chars?
    │  └→ "Password must be at least 6 chars"
    │
    ├─ Role not selected?
    │  └→ "Role is required"
    │
    ├─ Email already exists?
    │  └→ "Email is already registered"
    │
    ├─ Backend error?
    │  └→ "Signup failed. Please try again"
    │
    └─ Success!
       └→ Show "User created successfully"
          Show "Redirecting to login"
          Switch to login form

PROTECTED ROUTE ACCESS
    │
    ├─ No token in localStorage?
    │  └→ Redirect to /
    │
    ├─ Token invalid/expired?
    │  └→ API returns 401
    │  └→ Frontend should clear storage
    │  └→ Redirect to /
    │
    └─ Token valid?
       └→ Allow access to page
```

---

These diagrams provide a complete visual understanding of the authentication system architecture, data flow, and component relationships. Print or reference these when implementing, testing, or integrating with the team's POS module!
