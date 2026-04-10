const db = require('../config/database');

function auditLog(action, userId, ip, details = '') {
  try {
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, ip, details) VALUES (?, ?, ?, ?)'
    ).run(userId || null, action, ip, details);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { auditLog };
