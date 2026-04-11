const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { auditLog } = require('../middleware/logger');

// GET /orders - customer order history
router.get('/', requireAuth, (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.userId);

  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, p.name, p.image FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.render('orders/index', { title: 'My Orders', orders: ordersWithItems, query: req.query });
});

// POST /orders/checkout
router.post('/checkout', requireAuth, (req, res) => {
  const cart = req.session.cart;
  if (!cart || Object.keys(cart).length === 0) {
    return res.redirect('/cart');
  }

  try {
    let total = 0;
    const items = [];

    for (const [productId, item] of Object.entries(cart)) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(parseInt(productId));
      if (!product || product.stock < item.qty) {
        return res.redirect('/cart');
      }
      total += product.price * item.qty;
      items.push({ product, qty: item.qty });
    }

    // Insert order
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)'
    ).run(req.session.userId, parseFloat(total.toFixed(2)), 'pending');

    const orderId = orderResult.lastInsertRowid;

    // Insert order items & decrement stock
    for (const { product, qty } of items) {
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      ).run(orderId, product.id, qty, product.price);

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
    }

    auditLog('ORDER_PLACED', req.session.userId, req.ip, `Order #${orderId} - €${total.toFixed(2)}`);

    // Clear cart
    req.session.cart = {};
    res.redirect(`/orders?success=Order+%23${orderId}+placed+successfully`);

  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).render('error', { title: 'Checkout Error', message: 'Could not process your order. Please try again.', user: res.locals.currentUser });
  }
});

module.exports = router;
