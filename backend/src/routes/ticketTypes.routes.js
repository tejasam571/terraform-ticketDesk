const express = require('express');
const db = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const types = db.prepare('SELECT * FROM ticket_types ORDER BY name').all();
  res.json({ ticketTypes: types });
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  const existing = db.prepare('SELECT id FROM ticket_types WHERE name = ?').get(name.trim());
  if (existing) return res.status(409).json({ message: 'A ticket type with this name already exists.' });

  const info = db.prepare(`
    INSERT INTO ticket_types (name, description, icon, color) VALUES (?, ?, ?, ?)
  `).run(name.trim(), description || null, icon || 'Ticket', color || '#6366F1');

  const type = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ticketType: type });
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, description, icon, color } = req.body;
  const type = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(req.params.id);
  if (!type) return res.status(404).json({ message: 'Ticket type not found.' });

  db.prepare(`
    UPDATE ticket_types SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color)
    WHERE id = ?
  `).run(name ?? null, description ?? null, icon ?? null, color ?? null, req.params.id);

  const updated = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(req.params.id);
  res.json({ ticketType: updated });
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const inUse = db.prepare('SELECT COUNT(*) AS c FROM tickets WHERE ticket_type_id = ?').get(req.params.id).c;
  if (inUse > 0) {
    return res.status(400).json({ message: `Cannot delete: ${inUse} ticket(s) use this type.` });
  }
  const result = db.prepare('DELETE FROM ticket_types WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Ticket type not found.' });
  res.json({ message: 'Ticket type deleted.' });
});

module.exports = router;
