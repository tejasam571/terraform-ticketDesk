const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/tickette.db';
const resolvedPath = path.resolve(process.cwd(), DB_PATH);
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'itdesk', 'user')),
  department    TEXT,
  avatar_color  TEXT DEFAULT '#6366F1',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT DEFAULT 'Ticket',
  color       TEXT DEFAULT '#6366F1',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reference       TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  ticket_type_id  INTEGER NOT NULL REFERENCES ticket_types(id),
  priority        TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
  status          TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','On Hold','Resolved','Closed','Reopened')),
  raised_by       INTEGER NOT NULL REFERENCES users(id),
  assigned_to     INTEGER REFERENCES users(id),
  raised_at       TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at     TEXT,
  closed_at       TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id           INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id             INTEGER NOT NULL REFERENCES users(id),
  comment             TEXT,
  attachment_path     TEXT,
  is_resolution_proof INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ticket_status_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id   INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  INTEGER NOT NULL REFERENCES users(id),
  note        TEXT,
  changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by ON tickets(raised_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_ticket ON ticket_status_history(ticket_id);
`;

db.exec(SCHEMA);

module.exports = db;
