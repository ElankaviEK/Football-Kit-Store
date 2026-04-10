// Middleware: ensure user is logged in
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
}

// Middleware: ensure user is an admin
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page.',
      user: req.session.userId ? { name: req.session.userName, role: req.session.role } : null
    });
  }
  next();
}

// Middleware: attach user info to all views
function attachUser(req, res, next) {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.role }
    : null;
  res.locals.cartCount = req.session.cart
    ? Object.values(req.session.cart).reduce((sum, item) => sum + item.qty, 0)
    : 0;
  next();
}

module.exports = { requireAuth, requireAdmin, attachUser };
