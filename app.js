const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://via.placeholder.com"],
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
  secret: process.env.SESSION_SECRET || 'KitStore_S3cr3t_K3y_Ch4ng3_In_Pr0duct10n!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 2
  },
  name: 'kitstore.sid'
}));

app.use((req, res, next) => {
  res.locals.csrfToken = '';
  next();
});

app.use(attachUser);

app.get('/', (req, res) => {
  const db = require('./config/database');
  const featured = db.prepare('SELECT * FROM products ORDER BY RANDOM() LIMIT 6').all();
  const categories = db.prepare('SELECT DISTINCT category FROM products').all();
  res.render('home', { title: 'Football Kit Store – Home', featured, categories });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 – Page Not Found',
    message: 'The page you are looking for does not exist.',
    currentUser: res.locals.currentUser || null,
    csrfToken: '',
    cartCount: res.locals.cartCount || 0
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong. Please try again later.',
    currentUser: res.locals.currentUser || null,
    csrfToken: '',
    cartCount: res.locals.cartCount || 0
  });
});

app.listen(PORT, () => {
  console.log(`\n⚽ Football Kit Store running at http://localhost:${PORT}`);
  console.log(`🔒 Security middleware active: Helmet, Sessions, Rate Limiting, bcrypt\n`);
});