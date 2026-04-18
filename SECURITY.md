# Security Implementation

## 1. Password Hashing — bcrypt

Passwords were being stored as plain text. I fixed this using bcrypt 
with cost factor 12 to hash every password before saving to database.

Before:
```javascript
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
  .run(name, email, password);
```

After:
```javascript
const hashedPassword = await bcrypt.hash(password, 12);
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
  .run(name, email, hashedPassword);
```

---

## 2. SQL Injection — Parameterised Queries

User input was being joined directly into SQL strings. I fixed this 
using parameterised queries throughout all database calls.

Before:
```javascript
"SELECT * FROM users WHERE email = '" + email + "'"
```

After:
```javascript
db.prepare('SELECT * FROM users WHERE email = ?').get(email);
```

---

## 3. Brute Force — Rate Limiting

No restriction on login attempts. I added express-rate-limit to block 
an IP after 5 failed attempts for 15 minutes.

Before:
```javascript
router.post('/login', async (req, res) => { });
```

After:
```javascript
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
router.post('/login', loginLimiter, async (req, res) => { });
```

---

## 4. Broken Access Control

Any logged in user could access /admin by typing the URL. I created 
requireAdmin middleware that checks the session role and returns 403 
if the user is not an admin.

Before:
```javascript
router.get('/admin', (req, res) => { res.render('admin/dashboard'); });
```

After:
```javascript
router.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/dashboard');
});
```

---

## 5. Security Headers — Helmet.js

Express sends no security headers by default. I added Helmet.js which 
sets Content-Security-Policy, X-Frame-Options and other protective 
headers on every response.

Before:
```javascript
const app = express();
```

After:
```javascript
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "https://cdn.jsdelivr.net"]
}}}));
```

---

## 6. Insecure Session Configuration

Default session config had a weak secret and no cookie protection. 
I hardened it with httpOnly, sameSite strict and a 2 hour expiry.

Before:
```javascript
app.use(session({ secret: 'secret', cookie: {} }));
```

After:
```javascript
app.use(session({
  secret: 'KitStore_S3cr3t_K3y',
  cookie: { httpOnly: true, sameSite: 'strict', maxAge: 7200000 },
  name: 'kitstore.sid'
}));
```

---

## 7. Audit Logging

No record of login attempts or admin actions. I built an audit logger 
that saves every important event to the database with IP and timestamp.

Before:
```javascript
// no logging
```

After:
```javascript
auditLog('LOGIN_FAILED', null, req.ip, email);
auditLog('LOGIN_SUCCESS', user.id, req.ip, user.email);