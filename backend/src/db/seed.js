const bcrypt = require('bcryptjs');
const db = require('./connection');

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

function run() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) {
    console.log('Database already seeded. Skipping. (Delete data/tickette.db to reseed.)');
    return;
  }

  console.log('Seeding Tickette database with demo data...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, avatar_color)
    VALUES (@name, @email, @password_hash, @role, @department, @avatar_color)
  `);

  const users = [
    { name: 'Ava Sterling', email: 'admin@tickette.com', password_hash: hash('Admin@123'), role: 'admin', department: 'IT Administration', avatar_color: '#7C3AED' },
    { name: 'Marcus Reed', email: 'itdesk@tickette.com', password_hash: hash('ItDesk@123'), role: 'itdesk', department: 'IT Support', avatar_color: '#0EA5E9' },
    { name: 'Priya Nandan', email: 'itdesk2@tickette.com', password_hash: hash('ItDesk@123'), role: 'itdesk', department: 'IT Support', avatar_color: '#14B8A6' },
    { name: 'Liam Carter', email: 'user@tickette.com', password_hash: hash('User@123'), role: 'user', department: 'Sales', avatar_color: '#F59E0B' },
    { name: 'Sofia Nguyen', email: 'sofia@tickette.com', password_hash: hash('User@123'), role: 'user', department: 'Marketing', avatar_color: '#EF4444' },
  ];
  const userIds = {};
  for (const u of users) {
    const info = insertUser.run(u);
    userIds[u.email] = info.lastInsertRowid;
  }

  const insertType = db.prepare(`
    INSERT INTO ticket_types (name, description, icon, color) VALUES (@name, @description, @icon, @color)
  `);
  const types = [
    { name: 'Hardware', description: 'Laptops, desktops, printers, peripherals', icon: 'Cpu', color: '#6366F1' },
    { name: 'Software', description: 'Application errors, installs, licensing', icon: 'AppWindow', color: '#0EA5E9' },
    { name: 'Network', description: 'Wi-Fi, VPN, connectivity issues', icon: 'Wifi', color: '#14B8A6' },
    { name: 'Access Request', description: 'New accounts, permissions, resets', icon: 'KeyRound', color: '#F59E0B' },
    { name: 'Other', description: 'Anything else the help desk can assist with', icon: 'HelpCircle', color: '#8B5CF6' },
  ];
  const typeIds = {};
  for (const t of types) {
    const info = insertType.run(t);
    typeIds[t.name] = info.lastInsertRowid;
  }

  const insertTicket = db.prepare(`
    INSERT INTO tickets (reference, title, description, ticket_type_id, priority, status, raised_by, assigned_to, raised_at, resolved_at, closed_at)
    VALUES (@reference, @title, @description, @ticket_type_id, @priority, @status, @raised_by, @assigned_to, @raised_at, @resolved_at, @closed_at)
  `);
  const insertHistory = db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_by, note, changed_at)
    VALUES (@ticket_id, @from_status, @to_status, @changed_by, @note, @changed_at)
  `);
  const insertComment = db.prepare(`
    INSERT INTO ticket_comments (ticket_id, user_id, comment, attachment_path, is_resolution_proof, created_at)
    VALUES (@ticket_id, @user_id, @comment, @attachment_path, @is_resolution_proof, @created_at)
  `);

  const demoTickets = [
    {
      reference: 'TCK-1001', title: 'Laptop will not power on',
      description: 'My laptop screen stays black even after holding the power button for 10 seconds. Charger light is on.',
      ticket_type_id: typeIds['Hardware'], priority: 'High', status: 'Resolved',
      raised_by: userIds['user@tickette.com'], assigned_to: userIds['itdesk@tickette.com'],
      raised_at: '2026-08-01 09:15:00', resolved_at: '2026-08-01 14:40:00', closed_at: '2026-08-02 10:00:00',
      history: [
        { from_status: null, to_status: 'Open', note: 'Ticket raised', changed_at: '2026-08-01 09:15:00' },
        { from_status: 'Open', to_status: 'In Progress', note: 'Assigned to Marcus Reed', changed_at: '2026-08-01 09:40:00' },
        { from_status: 'In Progress', to_status: 'Resolved', note: 'Replaced faulty power adapter and verified boot.', changed_at: '2026-08-01 14:40:00' },
        { from_status: 'Resolved', to_status: 'Closed', note: 'Confirmed working by requester', changed_at: '2026-08-02 10:00:00' },
      ],
      comments: [
        { user: 'itdesk@tickette.com', comment: 'Picked this up, heading to your desk in 10 minutes.', at: '2026-08-01 09:41:00' },
        { user: 'itdesk@tickette.com', comment: 'Root cause was a dead power brick. Swapped it and tested a full boot cycle.', attachment: null, proof: true, at: '2026-08-01 14:39:00' },
        { user: 'user@tickette.com', comment: 'Works perfectly now, thank you!', at: '2026-08-02 09:58:00' },
      ],
    },
    {
      reference: 'TCK-1002', title: 'Cannot connect to office VPN',
      description: 'VPN client times out at 90% every time I try to connect from home.',
      ticket_type_id: typeIds['Network'], priority: 'Urgent', status: 'In Progress',
      raised_by: userIds['sofia@tickette.com'], assigned_to: userIds['itdesk2@tickette.com'],
      raised_at: '2026-08-07 08:05:00', resolved_at: null, closed_at: null,
      history: [
        { from_status: null, to_status: 'Open', note: 'Ticket raised', changed_at: '2026-08-07 08:05:00' },
        { from_status: 'Open', to_status: 'In Progress', note: 'Investigating VPN gateway logs', changed_at: '2026-08-07 08:30:00' },
      ],
      comments: [
        { user: 'itdesk2@tickette.com', comment: 'Can you share the error code shown on the client?', at: '2026-08-07 08:31:00' },
        { user: 'sofia@tickette.com', comment: 'It says ERR_CONN_TIMEOUT 619.', at: '2026-08-07 08:50:00' },
      ],
    },
    {
      reference: 'TCK-1003', title: 'Need access to Finance shared drive',
      description: 'I was moved to the Finance project and need read/write access to the shared drive.',
      ticket_type_id: typeIds['Access Request'], priority: 'Medium', status: 'Open',
      raised_by: userIds['user@tickette.com'], assigned_to: null,
      raised_at: '2026-08-08 11:20:00', resolved_at: null, closed_at: null,
      history: [
        { from_status: null, to_status: 'Open', note: 'Ticket raised', changed_at: '2026-08-08 11:20:00' },
      ],
      comments: [],
    },
    {
      reference: 'TCK-1004', title: 'Excel crashes when opening large spreadsheet',
      description: 'Excel closes immediately when I open the Q3 forecast workbook (45MB).',
      ticket_type_id: typeIds['Software'], priority: 'Low', status: 'Reopened',
      raised_by: userIds['sofia@tickette.com'], assigned_to: userIds['itdesk@tickette.com'],
      raised_at: '2026-08-04 13:00:00', resolved_at: null, closed_at: null,
      history: [
        { from_status: null, to_status: 'Open', note: 'Ticket raised', changed_at: '2026-08-04 13:00:00' },
        { from_status: 'Open', to_status: 'In Progress', note: 'Assigned', changed_at: '2026-08-04 13:20:00' },
        { from_status: 'In Progress', to_status: 'Resolved', note: 'Repaired Office installation.', changed_at: '2026-08-05 10:00:00' },
        { from_status: 'Resolved', to_status: 'Reopened', note: 'Issue came back after reboot.', changed_at: '2026-08-06 09:00:00' },
      ],
      comments: [
        { user: 'sofia@tickette.com', comment: 'It crashed again this morning, same file.', at: '2026-08-06 09:00:00' },
      ],
    },
  ];

  for (const t of demoTickets) {
    const info = insertTicket.run({
      reference: t.reference, title: t.title, description: t.description,
      ticket_type_id: t.ticket_type_id, priority: t.priority, status: t.status,
      raised_by: t.raised_by, assigned_to: t.assigned_to,
      raised_at: t.raised_at, resolved_at: t.resolved_at, closed_at: t.closed_at,
    });
    const ticketId = info.lastInsertRowid;
    for (const h of t.history) {
      insertHistory.run({ ticket_id: ticketId, from_status: h.from_status, to_status: h.to_status, changed_by: t.assigned_to || t.raised_by, note: h.note, changed_at: h.changed_at });
    }
    for (const c of t.comments) {
      insertComment.run({
        ticket_id: ticketId, user_id: userIds[c.user], comment: c.comment,
        attachment_path: c.attachment || null, is_resolution_proof: c.proof ? 1 : 0, created_at: c.at,
      });
    }
  }

  console.log('Seed complete.');
  console.log('  Admin   -> admin@tickette.com / Admin@123');
  console.log('  IT Desk -> itdesk@tickette.com / ItDesk@123 (also itdesk2@tickette.com)');
  console.log('  User    -> user@tickette.com / User@123 (also sofia@tickette.com)');
}

run();
