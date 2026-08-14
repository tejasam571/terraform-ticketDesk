const express = require('express');
const db = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Allowed status transitions. Admin can force any transition.
const TRANSITIONS = {
  'Open': ['In Progress', 'Closed'],
  'In Progress': ['On Hold', 'Resolved', 'Open'],
  'On Hold': ['In Progress'],
  'Resolved': ['Closed', 'Reopened'],
  'Reopened': ['In Progress'],
  'Closed': ['Reopened'],
};

function serializeTicket(row) {
  return row;
}

function getTicketWithJoins(id) {
  const ticket = db.prepare(`
    SELECT t.*,
           tt.name AS ticket_type_name, tt.color AS ticket_type_color, tt.icon AS ticket_type_icon,
           ru.name AS raised_by_name, ru.email AS raised_by_email, ru.department AS raised_by_department,
           au.name AS assigned_to_name, au.email AS assigned_to_email, au.avatar_color AS assigned_to_color
    FROM tickets t
    JOIN ticket_types tt ON tt.id = t.ticket_type_id
    JOIN users ru ON ru.id = t.raised_by
    LEFT JOIN users au ON au.id = t.assigned_to
    WHERE t.id = ?
  `).get(id);
  if (!ticket) return null;

  ticket.comments = db.prepare(`
    SELECT c.*, u.name AS user_name, u.role AS user_role, u.avatar_color AS user_color
    FROM ticket_comments c JOIN users u ON u.id = c.user_id
    WHERE c.ticket_id = ? ORDER BY c.created_at ASC
  `).all(id);

  ticket.history = db.prepare(`
    SELECT h.*, u.name AS changed_by_name
    FROM ticket_status_history h JOIN users u ON u.id = h.changed_by
    WHERE h.ticket_id = ? ORDER BY h.changed_at ASC
  `).all(id);

  return ticket;
}

// LIST tickets - scoped by role
router.get('/', authenticate, (req, res) => {
  const { status, priority, ticket_type_id, assigned_to, search } = req.query;
  const clauses = [];
  const params = [];

  if (req.user.role === 'user') {
    clauses.push('t.raised_by = ?');
    params.push(req.user.id);
  } else if (req.user.role === 'itdesk') {
    // IT desk sees everything, but can filter to "mine" via assigned_to=me on the client
  }

  if (status) { clauses.push('t.status = ?'); params.push(status); }
  if (priority) { clauses.push('t.priority = ?'); params.push(priority); }
  if (ticket_type_id) { clauses.push('t.ticket_type_id = ?'); params.push(ticket_type_id); }
  if (assigned_to) { clauses.push('t.assigned_to = ?'); params.push(assigned_to); }
  if (search) { clauses.push('(t.title LIKE ? OR t.reference LIKE ? OR t.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT t.*,
           tt.name AS ticket_type_name, tt.color AS ticket_type_color, tt.icon AS ticket_type_icon,
           ru.name AS raised_by_name,
           au.name AS assigned_to_name, au.avatar_color AS assigned_to_color
    FROM tickets t
    JOIN ticket_types tt ON tt.id = t.ticket_type_id
    JOIN users ru ON ru.id = t.raised_by
    LEFT JOIN users au ON au.id = t.assigned_to
    ${where}
    ORDER BY t.raised_at DESC
  `).all(...params);

  res.json({ tickets: rows });
});

// CREATE ticket (any authenticated user, typically role=user)
router.post('/', authenticate, (req, res) => {
  const { title, description, ticket_type_id, priority } = req.body;
  if (!title || !description || !ticket_type_id) {
    return res.status(400).json({ message: 'Title, description, and ticket type are required.' });
  }
  const type = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(ticket_type_id);
  if (!type) return res.status(400).json({ message: 'Invalid ticket type.' });

  const validPriority = ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium';

  const insert = db.prepare(`
    INSERT INTO tickets (reference, title, description, ticket_type_id, priority, status, raised_by)
    VALUES ('PENDING', ?, ?, ?, ?, 'Open', ?)
  `).run(title.trim(), description.trim(), ticket_type_id, validPriority, req.user.id);

  const id = insert.lastInsertRowid;
  const reference = `TCK-${1000 + id}`;
  db.prepare('UPDATE tickets SET reference = ? WHERE id = ?').run(reference, id);

  db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_by, note)
    VALUES (?, NULL, 'Open', ?, 'Ticket raised')
  `).run(id, req.user.id);

  res.status(201).json({ ticket: getTicketWithJoins(id) });
});

// GET single ticket detail
router.get('/:id', authenticate, (req, res) => {
  const ticket = getTicketWithJoins(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
  if (req.user.role === 'user' && ticket.raised_by !== req.user.id) {
    return res.status(403).json({ message: 'You can only view your own tickets.' });
  }
  res.json({ ticket });
});

// ASSIGN ticket to an IT desk agent (admin or itdesk claiming it)
router.patch('/:id/assign', authenticate, authorize('admin', 'itdesk'), (req, res) => {
  const { assigned_to } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

  if (assigned_to) {
    const agent = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(assigned_to, 'itdesk');
    if (!agent) return res.status(400).json({ message: 'Assignee must be an IT desk user.' });
  }

  db.prepare(`UPDATE tickets SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?`).run(assigned_to || null, req.params.id);

  let nextStatus = ticket.status;
  if (assigned_to && ticket.status === 'Open') {
    nextStatus = 'In Progress';
    db.prepare(`UPDATE tickets SET status = ? WHERE id = ?`).run(nextStatus, req.params.id);
    db.prepare(`INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)`)
      .run(req.params.id, ticket.status, nextStatus, req.user.id, 'Assigned and moved to In Progress');
  }

  res.json({ ticket: getTicketWithJoins(req.params.id) });
});

// UPDATE status (with workflow validation)
router.patch('/:id/status', authenticate, authorize('admin', 'itdesk'), (req, res) => {
  const { status, note } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
  if (!status) return res.status(400).json({ message: 'Target status is required.' });

  const allowed = TRANSITIONS[ticket.status] || [];
  if (req.user.role !== 'admin' && !allowed.includes(status)) {
    return res.status(400).json({ message: `Cannot move a ticket from "${ticket.status}" to "${status}".` });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const fields = { status, updated_at: now };
  if (status === 'Resolved') fields.resolved_at = now;
  if (status === 'Closed') fields.closed_at = now;
  if (status === 'Reopened') { fields.resolved_at = null; fields.closed_at = null; }
  if (status === 'In Progress' && !ticket.assigned_to && req.user.role === 'itdesk') {
    fields.assigned_to = req.user.id;
  }

  const setClauses = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE tickets SET ${setClauses} WHERE id = ?`).run(...Object.values(fields), req.params.id);

  db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_by, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, ticket.status, status, req.user.id, note || null);

  res.json({ ticket: getTicketWithJoins(req.params.id) });
});

// UPDATE ticket core fields (admin can edit type/priority/title)
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { title, description, ticket_type_id, priority } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

  db.prepare(`
    UPDATE tickets SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      ticket_type_id = COALESCE(?, ticket_type_id),
      priority = COALESCE(?, priority),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title ?? null, description ?? null, ticket_type_id ?? null, priority ?? null, req.params.id);

  res.json({ ticket: getTicketWithJoins(req.params.id) });
});

module.exports = router;
