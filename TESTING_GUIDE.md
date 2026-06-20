# 🧪 Testing Guide - Step-by-Step Instructions

## Pre-Testing Setup

### 1. Start the Backend

```bash
cd backend
npm install          # if not done yet
npm run dev          # starts on port 5000
```

Expected output:
```
Server running on port 5000
Database connected
```

### 2. Start the Frontend

In a new terminal:
```bash
cd frontend
npm install          # if not done yet
npm run dev          # starts on port 5173
```

Expected output:
```
VITE v8.0.12  ready in XXX ms

➜  Local:   http://localhost:5173/
```

### 3. Open in Browser

Navigate to: `http://localhost:5173`

You should see the login/signup page.

---

## TEST 1: Signup with ADMIN Role

**Objective:** Create a new admin account

### Steps:

1. Click the **Signup** card (or switch to signup on mobile)

2. Fill in the form:
   - **Full Name:** `Admin Test`
   - **Email Address:** `admin@test.com`
   - **Password:** `Admin1234`
   - **Account Role:** `ADMIN` (select from dropdown)

3. Click **Create Account** button

### Expected Results:

- ✅ Form validates inputs
- ✅ Success message: "User created successfully! Redirecting to login..."
- ✅ Auto-switches to login card after 1.5 seconds
- ✅ Email field in login shows: `admin@test.com`

### Verify in Database:

Open your database tool and check:
```sql
SELECT * FROM users WHERE email = 'admin@test.com';
```

Should show:
- `role` = `ADMIN`
- `password` = hashed (bcrypt)
- `email` = `admin@test.com`
- `name` = `Admin Test`

---

## TEST 2: Signup with EMPLOYEE Role

**Objective:** Create a new employee account

### Steps:

1. From signup card, fill:
   - **Full Name:** `Employee Test`
   - **Email Address:** `emp@test.com`
   - **Password:** `Emp12345`
   - **Account Role:** `EMPLOYEE`

2. Click **Create Account**

### Expected Results:

- ✅ Success message appears
- ✅ Auto-redirects to login
- ✅ Account created with EMPLOYEE role

### Database Check:

```sql
SELECT * FROM users WHERE email = 'emp@test.com';
```

Should show `role` = `EMPLOYEE`

---

## TEST 3: Signup Validation Errors

**Objective:** Test form validation

### Test 3a: Empty Email

1. Click signup
2. Leave email blank
3. Click **Create Account**

**Expected:** Error message: "Email is required."

### Test 3b: Invalid Email Format

1. Enter email: `notanemail`
2. Click **Create Account**

**Expected:** Error message: "Please enter a valid email address."

### Test 3c: Short Password

1. Enter password: `abc`
2. Click **Create Account**

**Expected:** Error message: "Password must be at least 6 characters long."

### Test 3d: Duplicate Email

1. Try signup with `admin@test.com` again
2. Click **Create Account**

**Expected:** Error message: "Email is already registered"

### Test 3e: No Name

1. Leave name blank
2. Click **Create Account**

**Expected:** Error message: "Name is required."

---

## TEST 4: Login with Valid Credentials

**Objective:** Successful login flow

### Steps:

1. On login card, enter:
   - **Email:** `admin@test.com`
   - **Password:** `Admin1234`

2. Click **Sign In**

### Expected Results:

- ✅ Button shows "Signing In..." with spinner
- ✅ After 1-2 seconds: redirects to `/pos-session`
- ✅ URL changes to: `http://localhost:5173/pos-session`
- ✅ Page title: "POS Session Dashboard"

### Verify localStorage:

Open browser DevTools (F12) → Application → Storage → Local Storage

Should see:
```
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
role: "ADMIN"
userId: "1"
user: {"id":1,"name":"Admin Test","email":"admin@test.com","role":"ADMIN"}
```

---

## TEST 5: POS Session Dashboard

**Objective:** Verify dashboard displays correctly

### Steps:

Already logged in from Test 4? Perfect! If not, login again.

### Verify Display Elements:

- [ ] **Header section:**
  - Logo shows "Odoo POS"
  - Role badge shows "ADMIN"
  - Navbar says "Welcome, Admin Test"
  - Logout button present with icon

- [ ] **Main heading:** "POS Session Dashboard"
  - Subtitle shows: "Operator: admin@test.com • Role: ADMIN"

- [ ] **Card 1: POS Session**
  - Title and icon visible
  - Description text present
  - "Open Session" button clickable

- [ ] **Card 2: Session Status**
  - Title and icon visible
  - Shows "Ready to Start" badge in green

- [ ] **Footer buttons:**
  - "Settings" button (mocked)
  - "Customer Display" button (mocked)

---

## TEST 6: Open Session Navigation

**Objective:** Test "Open Session" button navigation

### Steps:

1. From POS Session Dashboard, click **Open Session** button

### Expected Results:

- ✅ URL changes to: `http://localhost:5173/module-loading`
- ✅ Page title: "POS Module Integration Pending"
- ✅ Spinner animation shows

### Verify Module Loading Page:

- [ ] **Heading:** "POS Module Integration Pending"
- [ ] **Message:** "The POS workflow will be provided by the integrated team module."
- [ ] **User Info Box shows:**
  - `Admin Test`
  - `Email: admin@test.com`
  - Badge: `ADMIN`
- [ ] **Buttons present:**
  - "Return to Session Dashboard"
  - In navbar: "POS Session" button
  - In navbar: "Logout" button

---

## TEST 7: Return to Session Dashboard

**Objective:** Test back navigation

### Steps:

1. From Module Loading page, click **Return to Session Dashboard** button

### Expected Results:

- ✅ URL changes back to: `http://localhost:5173/pos-session`
- ✅ POS Session Dashboard displays
- ✅ Same user info shows

---

## TEST 8: Logout Functionality

**Objective:** Test logout clears data and redirects

### Steps:

1. Click **Logout** button (top right)

### Expected Results:

- ✅ Page redirects to: `http://localhost:5173/`
- ✅ Shows login/signup page
- ✅ localStorage completely cleared

### Verify localStorage is cleared:

Open DevTools → Application → Local Storage

Should show:
- `token` - GONE
- `role` - GONE
- `userId` - GONE
- `user` - GONE

---

## TEST 9: Protected Routes

**Objective:** Verify unauthorized access is blocked

### Steps:

1. Ensure you're logged out (no token in localStorage)
2. Manually type in browser: `http://localhost:5173/pos-session`
3. Press Enter

### Expected Results:

- ✅ Page redirects to: `http://localhost:5173/`
- ✅ Shows login page
- ✅ Message: "Please log in to access this page"

### Repeat for other protected routes:

```
http://localhost:5173/module-loading → Redirect to /
http://localhost:5173/tables          → Redirect to /
http://localhost:5173/orders          → Redirect to /
http://localhost:5173/pos/1           → Redirect to /
```

---

## TEST 10: Login with Invalid Credentials

**Objective:** Test error messages

### Test 10a: Wrong Password

1. Login with:
   - Email: `admin@test.com`
   - Password: `WrongPassword123`

**Expected:** Error message: "Invalid email or password"

### Test 10b: Non-existent Email

1. Login with:
   - Email: `nobody@nowhere.com`
   - Password: `anything`

**Expected:** Error message: "Invalid email or password"

### Test 10c: Empty Fields

1. Leave email blank
2. Click **Sign In**

**Expected:** Error message: "Email is required."

1. Leave password blank
2. Click **Sign In**

**Expected:** Error message: "Password is required."

---

## TEST 11: Employee Account Login

**Objective:** Test EMPLOYEE role login

### Steps:

1. Click toggle to signup
2. Create account:
   - Name: `Employee Test2`
   - Email: `emp2@test.com`
   - Password: `Emp22222`
   - Role: `EMPLOYEE`

3. Login with this account
4. Verify on POS Session:
   - Role badge shows: `EMPLOYEE`
   - Welcome message shows: `Employee Test2`

### Expected Results:

- ✅ EMPLOYEE can login successfully
- ✅ Can access /pos-session
- ✅ Can access /module-loading
- ✅ Role displayed correctly

---

## TEST 12: API Authorization Header

**Objective:** Verify JWT token sent with API requests

### Steps:

1. Login successfully
2. Open DevTools (F12)
3. Go to **Network** tab
4. Any network request should show:
   - **Headers** section
   - **Authorization:** `Bearer eyJhbGciOiJIUzI1NiIs...`

### Steps to verify:

1. Logout and re-login
2. Immediately check network requests
3. Look for API calls (if any make requests)

**Expected:** Authorization header present with Bearer token

---

## TEST 13: Session Persistence

**Objective:** Verify session persists on page reload

### Steps:

1. Login to dashboard
2. Refresh page (F5)
3. Page should stay on `/pos-session`
4. User info should still display

### Expected Results:

- ✅ No redirect to login
- ✅ Dashboard loads immediately
- ✅ User data from localStorage displays
- ✅ All buttons functional

---

## TEST 14: Switch Between Users

**Objective:** Test multiple user accounts

### Steps:

1. Login as `admin@test.com`
2. Note the role badge and name
3. Click **Logout**
4. Login as `emp2@test.com`
5. Note the different role badge and name
6. Verify localStorage updated

### Expected Results:

- ✅ Each user sees their own data
- ✅ localStorage updates on new login
- ✅ Role changes from ADMIN to EMPLOYEE
- ✅ Name changes accordingly

---

## TEST 15: Decoupled Routes (Optional)

**Objective:** Verify old POS pages still work

### Steps:

1. Login to dashboard
2. Manually navigate to: `http://localhost:5173/tables`

### Expected Results:

- ✅ Tables page loads
- ✅ Header shows with user info
- ✅ Floor plan displays
- ✅ Can click logout

### Also test:

```
/pos/1                → Should show billing screen
/orders               → Should show orders list
```

---

## Troubleshooting

### Issue: "Cannot reach server"

**Solution:**
1. Check backend is running: `npm run dev` in backend folder
2. Check port 5000 is not blocked
3. Verify DATABASE_URL in .env

### Issue: "Login button not responding"

**Solution:**
1. Open DevTools → Console
2. Check for JavaScript errors
3. Verify network request in Network tab
4. Check backend logs for errors

### Issue: "localStorage not storing data"

**Solution:**
1. Check browser privacy settings
2. Try incognito/private mode
3. Clear existing localStorage
4. Try different browser

### Issue: "Page shows 'undefined' for user"

**Solution:**
1. Check localStorage has `user` key
2. Verify JSON parsing works
3. Hard refresh page (Ctrl+Shift+R)
4. Re-login

### Issue: "JWT token error"

**Solution:**
1. Verify `JWT_SECRET` in backend .env
2. Check token expiration time (24h)
3. Clear localStorage and re-login
4. Check clock sync between frontend/backend

---

## Test Results Checklist

Use this to track your testing progress:

### Signup & Validation
- [ ] Test 1: Signup ADMIN role ✓
- [ ] Test 2: Signup EMPLOYEE role ✓
- [ ] Test 3a: Empty email error ✓
- [ ] Test 3b: Invalid email error ✓
- [ ] Test 3c: Short password error ✓
- [ ] Test 3d: Duplicate email error ✓
- [ ] Test 3e: Missing name error ✓

### Login & Session
- [ ] Test 4: Valid login redirects ✓
- [ ] Test 5: Dashboard displays correctly ✓
- [ ] Test 6: Open Session navigates ✓
- [ ] Test 7: Return to dashboard works ✓
- [ ] Test 8: Logout clears everything ✓

### Security & Protection
- [ ] Test 9: Protected routes work ✓
- [ ] Test 10a: Wrong password error ✓
- [ ] Test 10b: Non-existent user error ✓
- [ ] Test 10c: Empty field validation ✓
- [ ] Test 12: JWT in headers ✓

### User Management
- [ ] Test 11: EMPLOYEE role works ✓
- [ ] Test 13: Session persists ✓
- [ ] Test 14: Multiple users work ✓
- [ ] Test 15: Decoupled routes accessible ✓

---

## Performance Notes

**Expected Performance:**

- Login to dashboard: < 2 seconds
- Dashboard page load: < 1 second
- Page refresh: < 500ms
- Logout: Instant

**If slower:**
1. Check network speed (F12 → Network)
2. Check backend response time
3. Clear browser cache
4. Restart backend server

---

**Testing Guide Created:** 2026-06-20
**Status:** Ready for QA Testing ✅
