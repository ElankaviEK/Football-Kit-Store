# ⚽ KitStore — Secure Football Kit E-Commerce Application

A secure e-commerce web application built for the Secure Web Development 
module at National College of Ireland (MSCCYB1). The application allows 
customers to browse and purchase football jerseys and kits, while 
administrators manage the store inventory, orders and users.

---

## 🔗 Important Links

- **GitHub Repository:** https://github.com/ElankaviEK/Football-Kit-Store
- **Video Presentation:** [Insert YouTube Link]

---

## 📌 Project Overview

KitStore was developed as part of a secure web development assessment 
where the goal was to build a web application that demonstrates 
enterprise-level security practices. Security was embedded at every 
phase of development — from requirements and design through to 
implementation and testing.

The application supports two user roles:

| Role | Capabilities |
|------|-------------|
| Customer | Register, login, browse products, add to cart, place orders, view order history |
| Admin | All customer features plus manage products, view all orders, manage users, view audit logs |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite (better-sqlite3) |
| Templating | EJS |
| Styling | Bootstrap 5 + Custom CSS |
| Authentication | bcrypt + express-session |
| Security | Helmet.js, express-rate-limit, express-validator |
| Logging | morgan + custom audit logger |

---

## 📁 Project Structure
football-kit-store/
├── app.js                  # Main entry point – all middleware registered here
├── seed.js                 # Seeds database with admin, customer and 12 products
├── eslint.config.js        # ESLint security plugin configuration
├── SECURITY.md             # Vulnerable vs secure code comparison
├── config/
│   └── database.js         # SQLite connection and schema creation
├── middleware/
│   ├── auth.js             # requireAuth, requireAdmin, attachUser middleware
│   └── logger.js           # Audit logging function
├── routes/
│   ├── auth.js             # Login, register, logout with bcrypt and rate limiting
│   ├── products.js         # Product listing, detail, search and filter
│   ├── cart.js             # Cart add, update and remove
│   ├── orders.js           # Checkout and order history
│   └── admin.js            # Admin dashboard, product CRUD, order and user management
├── views/
│   ├── partials/           # header.ejs and footer.ejs shared across all pages
│   ├── auth/               # login.ejs and register.ejs
│   ├── products/           # index.ejs (shop) and show.ejs (product detail)
│   ├── cart/               # index.ejs (cart page)
│   ├── orders/             # index.ejs (order history)
│   ├── admin/              # dashboard, products, product-form, orders, users
│   ├── home.ejs            # Homepage with featured products
│   └── error.ejs           # Error page
├── public/
│   ├── css/style.css       # Custom dark theme stylesheet
│   └── images/             # Local product images
└── data/                   # SQLite database files (auto-created, gitignored)
---

## ⚙️ Setup and Installation

### Prerequisites
- Node.js v20 or higher
- npm

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/ElankaviEK/Football-Kit-Store.git
cd Football-Kit-Store
```

**2. Install dependencies**
```bash
npm install
```

**3. Seed the database**
```bash
node seed.js
```
This creates the SQLite database and populates it with:
- 1 Admin account
- 1 Demo customer account
- 12 football products

**4. Start the application**
```bash
npm start
```

**5. Open in browser**
---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kitstore.com | Admin@123 |
| Customer | john@example.com | Customer@123 |

---

## 🚀 Usage Guide

### As a Customer
1. Go to http://localhost:3000
2. Click **Register** to create an account or **Login** with demo credentials
3. Browse products at **/products** — filter by category or search by name
4. Click any product and click **Add to Cart**
5. Go to **/cart** to review your cart and click **Place Order**
6. View your order history at **/orders**

### As an Admin
1. Login with `admin@kitstore.com` / `Admin@123`
2. You will be redirected to the **Admin Dashboard** at /admin
3. Click **Add New Product** to add a jersey to the catalogue
4. Click **Manage Orders** to view and update order statuses
5. Click **Manage Users** to view all registered customers
6. Scroll down on the dashboard to see the **Audit Log**

---

## 🔒 Security Features

This section explains each security vulnerability that was identified 
and the fix that was implemented.

---

### 1. Password Hashing — bcrypt

**Vulnerability:**
Storing passwords as plain text in the database means that if the 
database is ever compromised, every user's password is immediately 
exposed and readable.

**Vulnerable Code:**
```javascript
// INSECURE — password saved directly to database as plain text
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
  .run(name, email, password);
```

**Fix Applied:**
bcrypt was used to hash every password before saving. A cost factor 
of 12 was chosen — this makes each hash take around 300ms to generate, 
making brute force attacks very slow. bcrypt also automatically 
generates a unique salt for each password preventing rainbow table 
attacks.

**Secure Code — routes/auth.js:**
```javascript
// SECURE — password hashed with bcrypt cost factor 12
const hashedPassword = await bcrypt.hash(password, 12);
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
  .run(name, email, hashedPassword);
```

---

### 2. SQL Injection — Parameterised Queries

**Vulnerability:**
Building SQL queries by joining user input directly into the string 
allows attackers to type SQL code into a form and manipulate the 
database. For example typing `' OR '1'='1` into the email field 
would bypass login entirely.

**Vulnerable Code:**
```javascript
// INSECURE — user input directly in SQL string
const user = db.prepare(
  "SELECT * FROM users WHERE email = '" + email + "'"
).get();
```

**Fix Applied:**
Every database call in the application uses parameterised prepared 
statements. The `?` placeholder tells the database driver to treat 
whatever the user types as plain data and never as executable SQL.

**Secure Code — routes/auth.js:**
```javascript
// SECURE — parameterised query prevents SQL injection
const user = db.prepare(
  'SELECT * FROM users WHERE email = ?'
).get(email);
```

---

### 3. Brute Force Attack — Rate Limiting

**Vulnerability:**
Without any restriction on login attempts, an attacker can write 
a script to try thousands of password combinations against any 
account until they find the correct one.

**Vulnerable Code:**
```javascript
// INSECURE — no limit on how many times login can be attempted
router.post('/login', async (req, res) => {
  // login logic with no rate limiting
});
```

**Fix Applied:**
express-rate-limit was added to the login route. An IP address is 
blocked after 5 failed attempts within a 15-minute window. The 
block event is also recorded in the audit log.

**Secure Code — routes/auth.js:**
```javascript
// SECURE — blocks IP after 5 failed attempts for 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Try again in 15 minutes.'
});

router.post('/login', loginLimiter, async (req, res) => {
  // login logic
});
```

---

### 4. Broken Access Control — Role-Based Middleware

**Vulnerability:**
Without access control, any logged-in customer could navigate 
directly to /admin in the browser and access the full admin 
panel — viewing all users, deleting products and changing orders.

**Vulnerable Code:**
```javascript
// INSECURE — any logged-in user can reach the admin dashboard
router.get('/admin', (req, res) => {
  res.render('admin/dashboard');
});
```

**Fix Applied:**
A requireAdmin middleware function was created that checks the 
user role stored in the server-side session. If the role is 
not admin the request is rejected with a 403 Forbidden response.

**Secure Code — middleware/auth.js and routes/admin.js:**
```javascript
// SECURE — admin role checked before any admin route is accessed
function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access Denied' });
  }
  next();
}

router.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/dashboard');
});
```

---

### 5. Security Misconfiguration — Helmet.js

**Vulnerability:**
By default Express sends no security-related HTTP headers. This 
leaves the application open to clickjacking where another website 
embeds your app in an iframe, and does not restrict what scripts 
or resources can be loaded.

**Vulnerable Code:**
```javascript
// INSECURE — no security headers configured
const app = express();
```

**Fix Applied:**
Helmet.js was added as application-level middleware. It sets 
protective headers on every single response automatically including 
Referrer-Policy and X-Frame-Options.

**Secure Code — app.js:**
```javascript
// SECURE — Helmet sets security headers on every response
app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

---

### 6. Insecure Session Configuration

**Vulnerability:**
The default Express session setup uses a weak secret and an 
unprotected cookie. This means JavaScript running on the page 
can access the session cookie — leaving it open to theft via 
cross-site scripting attacks.

**Vulnerable Code:**
```javascript
// INSECURE — weak secret, cookie accessible by JavaScript
app.use(session({
  secret: 'secret',
  cookie: {}
}));
```

**Fix Applied:**
The session was configured with a strong secret, httpOnly set 
to true so JavaScript cannot read the cookie, sameSite strict 
to prevent cross-site requests, a 2-hour expiry and a custom 
cookie name to hide the framework in use.

**Secure Code — app.js:**
```javascript
// SECURE — hardened session configuration
app.use(session({
  secret: 'KitStore_S3cr3t_K3y_Ch4ng3_In_Pr0duct10n!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 2
  },
  name: 'kitstore.sid'
}));
```

---

### 7. No Audit Trail — Audit Logging

**Vulnerability:**
Without logging there is no way to detect attacks in progress, 
investigate security incidents or know what actions administrators 
have taken in the system.

**Vulnerable Code:**
```javascript
// INSECURE — login and admin actions happen with no record kept
router.post('/login', async (req, res) => {
  // no logging of success or failure
});
```

**Fix Applied:**
A custom audit logging function was built that records every 
important event to the audit_logs database table. The log 
includes the action type, user ID, IP address and timestamp. 
Failed logins, successful logins, registrations, logouts, 
orders and all admin actions are all recorded and visible 
in the admin dashboard.

**Secure Code — middleware/logger.js:**
```javascript
// SECURE — all events logged with IP and timestamp
function auditLog(action, userId, ip, details) {
  db.prepare(
    'INSERT INTO audit_logs (user_id, action, ip, details) VALUES (?, ?, ?, ?)'
  ).run(userId || null, action, ip, details);
}

// Used in routes:
auditLog('LOGIN_FAILED', null, req.ip, email);
auditLog('LOGIN_SUCCESS', user.id, req.ip, user.email);
auditLog('PRODUCT_DELETED', req.session.userId, req.ip, productName);
```

---

## 🧪 Testing

### Static Application Security Testing (SAST)

ESLint with eslint-plugin-security was used to scan all route files.

```bash
npx eslint routes/auth.js routes/admin.js routes/products.js routes/cart.js routes/orders.js
```

**Results:** 0 errors, 7 warnings
All warnings were `security/detect-object-injection` in the cart 
route where bracket notation is used to access session cart data. 
These are known false positives when working with validated integer 
keys in session objects.

### Security Test Cases

| Test | Method | Expected | Result |
|------|--------|----------|--------|
| SQL Injection | Enter `' OR '1'='1` in login email | Login rejected | PASS |
| Brute Force | Submit wrong password 6 times | Blocked after 5 attempts | PASS |
| Privilege Escalation | Login as customer, go to /admin | 403 Forbidden | PASS |

---

## 📚 References

- OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/
- Helmet.js: https://helmetjs.github.io/
- bcrypt: https://www.npmjs.com/package/bcrypt
- express-validator: https://express-validator.github.io/
- express-rate-limit: https://www.npmjs.com/package/express-rate-limit
- NIST SP 800-63B: https://pages.nist.gov/800-63-3/sp800-63b.html
