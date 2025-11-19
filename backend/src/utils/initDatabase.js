import { initializeDatabase } from '../database.js';

// Run database initialization
try {
  initializeDatabase();
  console.log('✓ Database initialized successfully');
  process.exit(0);
} catch (error) {
  console.error('✗ Database initialization failed:', error);
  process.exit(1);
}
