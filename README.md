# ⚽ KitStore — Secure Football Kit E-Commerce App

A secure e-commerce web application for purchasing football jerseys and kits. Built with Node.js and Express as part of the Secure Web Development module at National College of Ireland.

---

## Project Overview

KitStore is a full-stack e-commerce platform where customers can browse and purchase football kits, and admins can manage products, orders, and users. The application was built with security as a first-class concern across all phases of development.

**Two user roles:**
- **Customer** — browse products, add to cart, place orders, view order history
- **Admin** — manage products (CRUD), view and update all orders, view users, view audit logs

---

## Security Features Implemented

| # | Feature | Implementation |
|---|---------|---------------|
| 1 | **Password Hashing** | bcrypt with cost factor 12 — passwords never stored in plaintext |
| 2 | **SQL Injection Prevention** | Parameterised queries via `better-sqlite3` throughout |
| 3 | **CSRF Protection** | Double-submit cookie pattern via `csrf-csrf` on all POST forms |
| 4 | **Rate Limiting** | Max 5 login attempts per 15 minutes via `express-rate-limit` |
| 5 | **Security Headers** | Helmet.js — sets CSP, X-Frame-Options, HSTS, etc. |
| 6 | **Secure Sessions** | httpOnly, sameSite=strict cookies, session regeneration on login |
| 7 | **Input Validation** | Server-side validation on all forms via `express-validator` |
| 8 | **Role-Based Access Control** | Admin routes protected by middleware — returns 403 for unauthorised |
| 9 | **Audit Logging** | All auth events and admin actions logged to DB with IP and timestamp |
| 10 | **Safe Error Handling** | Stack traces never exposed to users — generic messages shown |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (`better-sqlite3`)
- **Templating:** EJS
- **Auth:** bcrypt, express-session, connect-sqlite3
- **Security:** helmet, csrf-csrf, express-rate-limit, express-validator
- **Styling:** Bootstrap 5, custom CSS

---

## Project Structure

```
football-kit-store/
├── app.js                  # Main entry point, all middleware registered here
├── seed.js                 # Database seeder (admin + demo customer + products)
├── config/
│   └── database.js         # SQLite connection, schema creation
├── middleware/
│   ├── auth.js             # requireAuth, requireAdmin, attachUser
│   └── logger.js           # Audit logging helper
├── routes/
│   ├── auth.js             # Login, register, logout
│   ├── products.js         # Product listing and detail
│   ├── cart.js             # Cart add/update/remove
│   ├── orders.js           # Checkout and order history
│   └── admin.js            # Admin dashboard, CRUD, order management
├── views/
│   ├── partials/           # header.ejs, footer.ejs
│   ├── auth/               # login.ejs, register.ejs
│   ├── products/           # index.ejs, show.ejs
│   ├── cart/               # index.ejs
│   ├── orders/             # index.ejs
│   ├── admin/              # dashboard.ejs, products.ejs, product-form.ejs, orders.ejs, users.ejs
│   ├── home.ejs
│   └── error.ejs
├── public/
│   └── css/style.css       # Custom dark-theme stylesheet
└── data/                   # SQLite DB files (auto-created, gitignored)
```

---

## Setup & Installation

### Prerequisites
- Node.js v18 or higher
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/football-kit-store.git
cd football-kit-store

# 2. Install dependencies
npm install

# 3. Seed the database (creates admin, demo customer, and 12 products)
node seed.js

# 4. Start the application
npm start
# or for development with auto-reload:
npm run dev
```

Visit: **http://localhost:3000**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kitstore.com | Admin@123 |
| Customer | john@example.com | Customer@123 |

---

## Usage

- **Browse products** at `/products` — filter by category, search by name
- **Register/Login** at `/auth/register` and `/auth/login`
- **Add to cart** and checkout at `/cart`
- **View orders** at `/orders`
- **Admin panel** at `/admin` (admin login required)

---

## Testing

### SAST
ESLint with `eslint-plugin-security` was used for static analysis.

### Security Test Cases
1. **SQL Injection** — attempted `' OR '1'='1` in login email → rejected by parameterised queries
2. **XSS** — attempted `<script>alert(1)</script>` in search → sanitised by EJS auto-escaping
3. **Broken Access Control** — accessing `/admin` as customer → returns 403 Forbidden

---

## Security Improvements Summary

- Replaced string-concatenated queries with parameterised prepared statements
- Added bcrypt hashing (cost factor 12) replacing any plaintext storage
- Implemented CSRF tokens on every state-changing form
- Added rate limiting on authentication endpoints
- Configured secure session cookies with httpOnly and sameSite flags
- Added Helmet.js for full HTTP security header coverage
- Implemented server-side input validation and sanitisation on all inputs
- Added role-based middleware preventing privilege escalation
- Implemented audit logging for all authentication and admin events

---

## References
- OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/
- Helmet.js documentation: https://helmetjs.github.io/
- bcrypt: https://github.com/kelektiv/node.bcrypt.js
- express-validator: https://express-validator.github.io/
- NIST SP 800-63B — Digital Identity Guidelines
