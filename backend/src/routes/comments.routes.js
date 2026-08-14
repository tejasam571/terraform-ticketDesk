const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

// Add a comment (optionally with an image attachment) to a ticket
router.post('/', authenticate, upload.single('attachment'), (req, res) => {
  const ticketId = req.params.ticketId;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

  if (req.user.role === 'user' && ticket.raised_by !== req.user.id) {
    return res.status(403).json({ message: 'You can only comment on your own tickets.' });
  }

  const { comment, is_resolution_proof } = req.body;
  if (!comment && !req.file) {
    return res.status(400).json({ message: 'A comment or an attachment is required.' });
  }

  const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;
  const proofFlag = is_resolution_proof === 'true' || is_resolution_proof === true ? 1 : 0;

  const info = db.prepare(`
    INSERT INTO ticket_comments (ticket_id, user_id, comment, attachment_path, is_resolution_proof)
    VALUES (?, ?, ?, ?, ?)
  `).run(ticketId, req.user.id, comment || null, attachmentPath, proofFlag);

  db.prepare(`UPDATE tickets SET updated_at = datetime('now') WHERE id = ?`).run(ticketId);

  const created = db.prepare(`
    SELECT c.*, u.name AS user_name, u.role AS user_role, u.avatar_color AS user_color
    FROM ticket_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json({ comment: created });
});

module.exports = router;
