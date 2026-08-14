const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const scope = req.user.role === 'user' ? 'WHERE raised_by = ?' : '';
  const scopeParams = req.user.role === 'user' ? [req.user.id] : [];

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS count FROM tickets ${scope} GROUP BY status
  `).all(...scopeParams);

  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) AS count FROM tickets ${scope} GROUP BY priority
  `).all(...scopeParams);

  const byType = db.prepare(`
    SELECT tt.name AS type, COUNT(*) AS count
    FROM tickets t JOIN ticket_types tt ON tt.id = t.ticket_type_id
    ${scope.replace('WHERE', 'WHERE t.').replace('raised_by', 't.raised_by') || ''}
    GROUP BY tt.name
  `).all(...scopeParams);

  const total = db.prepare(`SELECT COUNT(*) AS c FROM tickets ${scope}`).get(...scopeParams).c;

  const avgResolutionRow = db.prepare(`
    SELECT AVG((julianday(resolved_at) - julianday(raised_at)) * 24) AS avg_hours
    FROM tickets ${scope ? scope + ' AND' : 'WHERE'} resolved_at IS NOT NULL
  `).get(...scopeParams);

  let agentLoad = [];
  if (req.user.role !== 'user') {
    agentLoad = db.prepare(`
      SELECT u.id, u.name, u.avatar_color,
             SUM(CASE WHEN t.status IN ('Open','In Progress','On Hold','Reopened') THEN 1 ELSE 0 END) AS active_count,
             SUM(CASE WHEN t.status IN ('Resolved','Closed') THEN 1 ELSE 0 END) AS resolved_count
      FROM users u LEFT JOIN tickets t ON t.assigned_to = u.id
      WHERE u.role = 'itdesk'
      GROUP BY u.id
      ORDER BY active_count DESC
    `).all();
  }

  const recent = db.prepare(`
    SELECT t.id, t.reference, t.title, t.status, t.priority, t.raised_at,
           tt.name AS ticket_type_name, ru.name AS raised_by_name
    FROM tickets t
    JOIN ticket_types tt ON tt.id = t.ticket_type_id
    JOIN users ru ON ru.id = t.raised_by
    ${scope ? scope.replace('raised_by', 't.raised_by') : ''}
    ORDER BY t.raised_at DESC LIMIT 6
  `).all(...scopeParams);

  res.json({
    total,
    byStatus,
    byPriority,
    byType,
    avgResolutionHours: avgResolutionRow.avg_hours ? Math.round(avgResolutionRow.avg_hours * 10) / 10 : null,
    agentLoad,
    recent,
  });
});

module.exports = router;
