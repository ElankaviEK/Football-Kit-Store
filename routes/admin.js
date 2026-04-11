const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/logger');

// All admin routes require admin role
router.use(requireAdmin);

// GET /admin - dashboard
router.get('/', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer').count,
    products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
    orders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
    revenue: db.prepare("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != 'cancelled'").get().total
  };
  const recentOrders = db.prepare(
    'SELECT o.*, u.name as customer FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5'
  ).all();
  const logs = db.prepare('SELECT al.*, u.name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 10').all();

  res.render('admin/dashboard', { title: 'Admin Dashboard', stats, recentOrders, logs });
});

// ── PRODUCTS ─────────────────────────────────────────────────────────────────

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.render('admin/products', { title: 'Manage Products', products, errors: [], old: {} });
});

router.get('/products/new', (req, res) => {
  res.render('admin/product-form', { title: 'Add Product', product: null, errors: [], old: {} });
});

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required.').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required.').isLength({ max: 500 }),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number.'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
  body('category').trim().notEmpty().withMessage('Category is required.').isLength({ max: 50 }),
];

router.post('/products', productValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('admin/product-form', {
      title: 'Add Product', product: null, errors: errors.array(), old: req.body
    });
  }
  const { name, description, price, stock, category, image } = req.body;
  const result = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description, parseFloat(price), parseInt(stock), category, image || 'default.jpg');

  auditLog('PRODUCT_CREATED', req.session.userId, req.ip, `Product #${result.lastInsertRowid}: ${name}`);
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');
  res.render('admin/product-form', { title: 'Edit Product', product, errors: [], old: product });
});

router.post('/products/:id/edit', productValidation, (req, res) => {
  const errors = validationResult(req);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');

  if (!errors.isEmpty()) {
    return res.status(400).render('admin/product-form', {
      title: 'Edit Product', product, errors: errors.array(), old: req.body
    });
  }
  const { name, description, price, stock, category, image } = req.body;
  db.prepare(
    'UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image=? WHERE id=?'
  ).run(name, description, parseFloat(price), parseInt(stock), category, image || product.image, product.id);

  auditLog('PRODUCT_UPDATED', req.session.userId, req.ip, `Product #${product.id}: ${name}`);
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (product) {
    db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
    auditLog('PRODUCT_DELETED', req.session.userId, req.ip, `Product #${product.id}: ${product.name}`);
  }
  res.redirect('/admin/products');
});

// ── ORDERS ────────────────────────────────────────────────────────────────────

router.get('/orders', (req, res) => {
  const orders = db.prepare(
    'SELECT o.*, u.name as customer, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
  ).all();
  res.render('admin/orders', { title: 'All Orders', orders });
});

router.post('/orders/:id/status', (req, res) => {
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;
  if (!allowed.includes(status)) return res.redirect('/admin/orders');
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  auditLog('ORDER_STATUS_UPDATED', req.session.userId, req.ip, `Order #${req.params.id} → ${status}`);
  res.redirect('/admin/orders');
});

// ── USERS ─────────────────────────────────────────────────────────────────────

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
  res.render('admin/users', { title: 'Manage Users', users });
});

module.exports = router;
