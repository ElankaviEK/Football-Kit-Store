const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /products - list all with search and category filter
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY created_at DESC';

  const products = db.prepare(query).all(...params);
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();

  res.render('products/index', {
    title: 'Shop',
    products,
    categories,
    search: search || '',
    activeCategory: category || ''
  });
});

// GET /products/:id - single product
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).render('error', { title: 'Not Found', message: 'Product not found.', user: res.locals.currentUser });
  }
  const related = db.prepare('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4').all(product.category, product.id);
  res.render('products/show', { title: product.name, product, related });
});

module.exports = router;
