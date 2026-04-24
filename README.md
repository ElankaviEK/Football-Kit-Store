# KitStore — Football Kit E-Commerce App

KitStore is a web application I built for my Secure Web Development 
module at National College of Ireland. The idea was simple — an online 
shop where people can buy football jerseys and kits. But the main focus 
of the project was not just building a working shop, it was building a 
secure one.

I chose this idea because e-commerce sites are one of the most commonly 
attacked types of web applications. They handle user accounts, passwords 
and orders — which makes security genuinely important rather than just 
a box-ticking exercise.

---

## Links

- GitHub: https://github.com/ElankaviEK/Football-Kit-Store
- Video Demo: [Insert YouTube Link]

---

## What the App Does

There are two types of users in the system.

Customers can create an account, log in, browse the product catalogue, 
filter by category, search by name, add items to their cart, place 
orders and view their order history.

Admins have all of that plus they can add new products, edit existing 
ones, delete products, view every order placed on the site, update 
order statuses, see all registered users and view a live audit log 
that records every important action taken on the site.

---

## Tech Stack

I used Node.js and Express for the backend because they have a large 
ecosystem of security-focused packages which was important for this 
project. The database is SQLite which I chose because it requires no 
server setup and works well for a local development and demo environment 
while still supporting proper SQL with parameterised queries.

The frontend uses EJS templates rendered on the server side along with 
Bootstrap 5 for layout and a custom dark theme CSS file.

For security I used bcrypt for password hashing, express-session for 
session management, Helmet.js for HTTP headers, express-rate-limit 
for brute force protection and express-validator for input validation.

---

## Project Structure
football-kit-store/
├── app.js               # Entry point. All middleware and routes registered here
├── seed.js              # Creates the database and adds demo data
├── eslint.config.js     # ESLint security scanning configuration
├── SECURITY.md          # Side by side comparison of vulnerable and secure code
├── config/
│   └── database.js      # Database connection and table creation
├── middleware/
│   ├── auth.js          # Checks if user is logged in or is an admin
│   └── logger.js        # Records security events to the database
├── routes/
│   ├── auth.js          # Register, login, logout
│   ├── products.js      # Browse, search and view products
│   ├── cart.js          # Add, update and remove cart items
│   ├── orders.js        # Place orders and view history
│   └── admin.js         # Everything the admin can do
├── views/               # All EJS page templates
├── public/
│   ├── css/style.css    # Dark theme stylesheet
│   └── images/          # Product images stored locally
└── data/                # SQLite database (auto created, not in repo)
---

## How to Run It

You will need Node.js v20 or higher installed.

```bash
# Clone the repo
git clone https://github.com/ElankaviEK/Football-Kit-Store.git
cd Football-Kit-Store

# Install packages
npm install

# Set up the database with demo data
node seed.js

# Start the app
npm start
```

Then open your browser and go to http://localhost:3000

---

## Login Details for Testing

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@kitstore.com | Admin@123 |
| Customer | john@example.com | Customer@123 |

---

## Security

This is the most important part of the project. Below I have explained 
each vulnerability I identified and what I did to fix it. The full 
side by side code comparison is in SECURITY.md.

---

### 1. Passwords Were Not Protected

The first thing I noticed was that if I did not add any protection, 
passwords would be saved to the database as plain readable text. If 
someone ever got access to the database they could read every single 
password immediately.

I fixed this using bcrypt. Every password is hashed before it is 
saved. I used a cost factor of 12 which means the hashing process 
takes around 300 milliseconds — that sounds fast for one attempt but 
it makes automated brute force attacks very slow. bcrypt also adds 
a unique random salt to each password automatically so two users 
with the same password will have completely different hashes stored.

```javascript
// Before — plain text stored directly
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
  .run(name, email, password);

// After — hashed before saving
const hashedPassword = await bcrypt.hash(password, 12);
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
  .run(name, email, hashedPassword);
```

File: `routes/auth.js`

---

### 2. SQL Injection Was Possible

If I had built the database queries by joining user input directly 
into the SQL string, an attacker could type something like 
`' OR '1'='1` into the login form and bypass authentication 
completely. This is one of the most well known web vulnerabilities 
and it is number one on the OWASP Top 10.

I fixed this by using parameterised queries for every single database 
call in the application. The question mark placeholder means the 
database treats whatever the user types as data only — it can never 
be interpreted as SQL code.

```javascript
// Before — dangerous string concatenation
"SELECT * FROM users WHERE email = '" + email + "'"

// After — parameterised query
db.prepare('SELECT * FROM users WHERE email = ?').get(email);
```

File: `routes/auth.js`, `routes/products.js`, `routes/admin.js`, 
`routes/cart.js`, `routes/orders.js`

---

### 3. Login Had No Brute Force Protection

Without any limit on login attempts, someone could just keep trying 
passwords automatically until they found the right one. There was 
nothing stopping that.

I added express-rate-limit to the login route specifically. After 
5 failed attempts from the same IP address the user is blocked for 
15 minutes. Every blocked attempt is also recorded in the audit log.

```javascript
// Before — unlimited attempts allowed
router.post('/login', async (req, res) => { ... });

// After — blocked after 5 attempts
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
router.post('/login', loginLimiter, async (req, res) => { ... });
```

File: `routes/auth.js`

---

### 4. Customers Could Access Admin Pages

This one was straightforward but important. Without any check, 
a logged in customer could just type /admin into the browser and 
reach the admin dashboard. They could see all users, delete products 
and change orders.

I created a middleware function called requireAdmin that runs before 
any admin route is processed. It checks the role stored in the 
server side session. If the role is not admin it immediately returns 
a 403 Forbidden response and the page never loads.

```javascript
// Before — no protection on admin routes
router.get('/admin', (req, res) => {
  res.render('admin/dashboard');
});

// After — role checked first
router.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/dashboard');
});

function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access Denied' });
  }
  next();
}
```

File: `middleware/auth.js`, `routes/admin.js`

---

### 5. No HTTP Security Headers

By default Express does not send any security related HTTP headers. 
This means the app was open to things like clickjacking where 
another site could embed it in an iframe and trick users into 
clicking things.

I added Helmet.js which sets a range of protective headers 
automatically on every response. This includes X-Frame-Options 
to block iframe embedding and Referrer-Policy to control what 
information gets sent when navigating away from the site.

```javascript
// Before
const app = express(); // no headers set

// After
app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

File: `app.js`

---

### 6. Session Cookie Was Not Secured

The default session setup in Express uses a weak secret and 
leaves the cookie completely unprotected. That means JavaScript 
running on the page could read the session cookie which opens 
the door to session theft through cross site scripting.

I hardened the session configuration with several changes. 
The httpOnly flag stops JavaScript from touching the cookie. 
The sameSite strict setting blocks cross site requests from 
using it. I set a 2 hour expiry so sessions do not last forever. 
I also renamed the cookie from the Express default to avoid 
revealing what framework the app is built with.

```javascript
// Before
app.use(session({ secret: 'secret', cookie: {} }));

// After
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

File: `app.js`

---

### 7. Nothing Was Being Logged

Without any logging there is no way to know if someone is 
trying to break into accounts or what admins are doing in 
the system. If something went wrong there would be no way 
to investigate it.

I built a simple audit logging function that saves important 
events to the audit_logs table in the database. Every login 
attempt whether successful or not, every logout, every order 
placed and every admin action gets recorded with the user ID, 
IP address and timestamp. The admin dashboard shows the 10 
most recent entries so it is easy to spot anything suspicious.

```javascript
// Before — nothing recorded
router.post('/login', async (req, res) => { ... });

// After — every event logged
auditLog('LOGIN_FAILED', null, req.ip, email);
auditLog('LOGIN_SUCCESS', user.id, req.ip, user.email);

function auditLog(action, userId, ip, details) {
  db.prepare(
    'INSERT INTO audit_logs (user_id, action, ip, details) VALUES (?, ?, ?, ?)'
  ).run(userId || null, action, ip, details);
}
```

File: `middleware/logger.js`

---

## Testing

### SAST — ESLint Security Plugin

I ran ESLint with the security plugin across all the route files 
to check for common security issues in the code.

```bash
npx eslint routes/auth.js routes/admin.js routes/products.js 
routes/cart.js routes/orders.js
```

The scan came back with 0 errors and 7 warnings. All 7 warnings 
were the same type — `security/detect-object-injection` — found 
in the cart route where bracket notation is used to access session 
data. I looked into these and they are false positives in this 
context because the keys being used are validated integers before 
they ever reach that point in the code. No actual security issues 
were found.

### Manual Security Tests

I tested three specific security scenarios manually:

**Test 1 — SQL Injection**
I typed `' OR '1'='1` into the email field on the login page. 
The login was rejected. The parameterised query treated the 
input as a plain string with no SQL effect.

**Test 2 — Brute Force**
I submitted the login form with a wrong password six times in 
a row. After the fifth attempt the rate limiter kicked in and 
returned a 429 Too Many Requests response. The sixth attempt 
was blocked completely.

**Test 3 — Privilege Escalation**
I logged in as a regular customer and then typed 
http://localhost:3000/admin directly into the browser. 
The requireAdmin middleware caught it and returned a 
403 Forbidden page. The admin dashboard never loaded.

All three tests passed as expected.

---

## References

- OWASP Top 10 (2021) — https://owasp.org/www-project-top-ten/
- Helmet.js documentation — https://helmetjs.github.io/
- bcrypt npm package — https://www.npmjs.com/package/bcrypt
- express-rate-limit — https://www.npmjs.com/package/express-rate-limit
- express-validator — https://express-validator.github.io/
- NIST SP 800-63B Digital Identity Guidelines — https://pages.nist.gov/800-63-3/sp800-63b.html
- SQLite documentation — https://www.sqlite.org/docs.html