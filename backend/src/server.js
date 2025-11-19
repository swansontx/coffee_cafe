import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import coffeesRouter from './routes/coffees.js';
import brewsRouter from './routes/brews.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database
try {
  initializeDatabase();
  console.log('✓ Database initialized');
} catch (error) {
  console.error('✗ Database initialization failed:', error);
  process.exit(1);
}

// Routes
app.use('/api/coffees', coffeesRouter);
app.use('/api/brews', brewsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Coffee Tracker API',
    version: '1.0.0',
    endpoints: {
      coffees: '/api/coffees',
      brews: '/api/brews',
      analytics: '/api/brews/analytics',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Coffee Tracker API running on http://localhost:${PORT}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  - GET    /api/coffees          - List all coffees`);
  console.log(`  - POST   /api/coffees          - Create new coffee`);
  console.log(`  - GET    /api/coffees/:id      - Get coffee by ID`);
  console.log(`  - PUT    /api/coffees/:id      - Update coffee`);
  console.log(`  - DELETE /api/coffees/:id      - Archive coffee`);
  console.log(`  - GET    /api/brews            - List all brews`);
  console.log(`  - POST   /api/brews            - Create new brew session`);
  console.log(`  - GET    /api/brews/:id        - Get brew by ID`);
  console.log(`  - GET    /api/brews/analytics  - Get analytics data`);
  console.log(`\n👀 Watching for changes...\n`);
});
