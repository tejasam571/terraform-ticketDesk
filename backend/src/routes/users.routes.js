const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function toPublicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

// List users - admin sees everyone; itdesk can fetch itdesk list for reassignment context
router.get('/', authenticate, (req, res) => {
  const { role } = req.query;
  let rows;
  if (role) {
    rows = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY name').all(role);
  } else {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }
  res.json({ users: rows.map(toPublicUser) });
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password and role are required.' });
  }
  if (!['admin', 'itdesk', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Role must be admin, itdesk, or user.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ message: 'A user with this email already exists.' });

  const colors = ['#6366F1', '#0EA5E9', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const avatar_color = colors[Math.floor(Math.random() * colors.length)];
  const password_hash = bcrypt.hashSync(password, 10);

  const info = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), email.toLowerCase().trim(), password_hash, role, department || null, avatar_color);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user: toPublicUser(user) });
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, department, role, is_active } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      department = COALESCE(?, department),
      role = COALESCE(?, role),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name ?? null, department ?? null, role ?? null, is_active === undefined ? null : (is_active ? 1 : 0), req.params.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ user: toPublicUser(updated) });
});

router.post('/:id/reset-password', authenticate, authorize('admin'), (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, req.params.id);
  res.json({ message: 'Password reset successfully.' });
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const openTickets = db.prepare(`SELECT COUNT(*) AS c FROM tickets WHERE raised_by = ? OR assigned_to = ?`).get(req.params.id, req.params.id).c;
  if (openTickets > 0) {
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);
    return res.json({ message: 'User has ticket history, so the account was deactivated instead of deleted.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted successfully.' });
});

module.exports = router;
