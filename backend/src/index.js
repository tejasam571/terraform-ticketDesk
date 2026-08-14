const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

require('./db/connection'); // ensures schema is created on boot

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const ticketTypeRoutes = require('./routes/ticketTypes.routes');
const ticketRoutes = require('./routes/tickets.routes');
const commentRoutes = require('./routes/comments.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'tickette-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ticket-types', ticketTypeRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets/:ticketId/comments', commentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback error handler (e.g. multer file-type errors)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || 'Something went wrong.' });
  }
  next();
});

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Tickette API running on http://localhost:${PORT}`);
});
