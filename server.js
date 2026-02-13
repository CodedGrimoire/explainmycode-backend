require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ message: 'ExplainMyCode backend is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/explanations', require('./routes/explanationRoutes'));

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

setInterval(() => {
  // heartbeat to keep process visible if server fails to bind
}, 1000);
