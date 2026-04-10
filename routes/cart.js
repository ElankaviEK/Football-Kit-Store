const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function getCart(req) {
  return req.session.cart || {};
}

// GET /cart
router.get('/', requireAuth, (req, res) => {
  const cart = getCart(req);
  const items = [];
  let total = 0;

  for (const [productId, item] of Object.entries(cart)) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(parseInt(productId));
    if (product) {
      const subtotal = product.price * item.qty;
      items.push({ ...product, qty: item.qty, subtotal });
      total += subtotal;
    }
  }

  res.render('cart/index', { title: 'Your Cart', items, total: total.toFixed(2) });
});

// POST /cart/add
router.post('/add', requireAuth, (req, res) => {
  const productId = parseInt(req.body.productId);
  const qty = parseInt(req.body.qty) || 1;

  if (isNaN(productId) || qty < 1 || qty > 10) {
    return res.redirect('/products');
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product || product.stock < 1) {
    return res.redirect('/products');
  }

  if (!req.session.cart) req.session.cart = {};
  const cart = req.session.cart;

  if (cart[productId]) {
    cart[productId].qty = Math.min(cart[productId].qty + qty, product.stock);
  } else {
    cart[productId] = { qty };
  }

  res.redirect('/cart');
});

// POST /cart/update
router.post('/update', requireAuth, (req, res) => {
  const productId = parseInt(req.body.productId);
  const qty = parseInt(req.body.qty);

  if (!req.session.cart) return res.redirect('/cart');

  if (isNaN(qty) || qty < 1) {
    delete req.session.cart[productId];
  } else {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
    if (product) {
      req.session.cart[productId] = { qty: Math.min(qty, product.stock) };
    }
  }

  res.redirect('/cart');
});

// POST /cart/remove
router.post('/remove', requireAuth, (req, res) => {
  const productId = parseInt(req.body.productId);
  if (req.session.cart) delete req.session.cart[productId];
  res.redirect('/cart');
});

module.exports = router;
