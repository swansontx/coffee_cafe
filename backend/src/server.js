import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import inventoryRouter from './routes/inventory.js';
import plannerRouter from './routes/planner.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

try {
  initializeDatabase();
  console.log('✓ Database initialized');
} catch (error) {
  console.error('✗ Database initialization failed:', error);
  process.exit(1);
}

app.use('/api/inventory', inventoryRouter);
app.use('/api/planner', plannerRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Sometimes Coffee — Inventory & Planning API',
    version: '2.0.0',
    endpoints: {
      inventory: '/api/inventory',
      inventoryAvailable: '/api/inventory/available?program=&week_start=',
      planner: '/api/planner?weeks=',
      health: '/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`\n☕ Sometimes Coffee API running on http://localhost:${PORT}\n`);
});
