import express from 'express';
import {
  createBrewSession,
  getBrewSessionById,
  getAllBrewSessions,
  getBrewSessionsByCoffee,
  getLastBrewForCoffee,
  updateBrewSession,
  deleteBrewSession,
  getAnalyticsData
} from '../models/brew.js';

const router = express.Router();

/**
 * GET /api/brews
 * Get all brew sessions with optional filters
 */
router.get('/', (req, res) => {
  try {
    const { coffee_id, method, start_date, end_date, limit } = req.query;

    const filters = {};
    if (coffee_id) filters.coffee_id = coffee_id;
    if (method) filters.method = method;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (limit) filters.limit = parseInt(limit);

    const brews = getAllBrewSessions(filters);
    res.json(brews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brews/analytics
 * Get analytics data for SCA chart
 */
router.get('/analytics', (req, res) => {
  try {
    const { method, coffee_id, start_date, end_date } = req.query;

    const filters = {};
    if (method) filters.method = method;
    if (coffee_id) filters.coffee_id = coffee_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const data = getAnalyticsData(filters);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brews/coffee/:coffeeId
 * Get all brews for a specific coffee
 */
router.get('/coffee/:coffeeId', (req, res) => {
  try {
    const brews = getBrewSessionsByCoffee(req.params.coffeeId);
    res.json(brews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brews/coffee/:coffeeId/last
 * Get last brew for a coffee (for auto-populate)
 */
router.get('/coffee/:coffeeId/last', (req, res) => {
  try {
    const { method } = req.query;
    const brew = getLastBrewForCoffee(req.params.coffeeId, method);

    if (!brew) {
      return res.status(404).json({ error: 'No previous brews found' });
    }

    res.json(brew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/brews/:id
 * Get brew session by ID
 */
router.get('/:id', (req, res) => {
  try {
    const brew = getBrewSessionById(req.params.id);
    if (!brew) {
      return res.status(404).json({ error: 'Brew session not found' });
    }
    res.json(brew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/brews
 * Create new brew session
 */
router.post('/', (req, res) => {
  try {
    // Validate required fields
    const { coffee_id, method, dose, tds } = req.body;

    if (!coffee_id || !method || !dose || !tds) {
      return res.status(400).json({
        error: 'Missing required fields: coffee_id, method, dose, tds'
      });
    }

    // Validate method
    const validMethods = ['espresso', 'batch', 'pourover'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        error: `Invalid method. Must be one of: ${validMethods.join(', ')}`
      });
    }

    // Validate TDS range
    if (tds < 0.1 || tds > 20) {
      return res.status(400).json({
        error: 'TDS must be between 0.1% and 20%'
      });
    }

    // Validate rating if provided
    if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Method-specific validation
    if (method === 'batch' && !req.body.water_volume) {
      return res.status(400).json({
        error: 'water_volume is required for batch brews'
      });
    }

    if ((method === 'espresso' || method === 'pourover') && !req.body.yield) {
      return res.status(400).json({
        error: 'yield is required for espresso and pourover brews'
      });
    }

    const brew = createBrewSession(req.body);
    res.status(201).json(brew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/brews/:id
 * Update brew session
 */
router.put('/:id', (req, res) => {
  try {
    const brew = updateBrewSession(req.params.id, req.body);
    if (!brew) {
      return res.status(404).json({ error: 'Brew session not found' });
    }
    res.json(brew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/brews/:id
 * Delete brew session
 */
router.delete('/:id', (req, res) => {
  try {
    const result = deleteBrewSession(req.params.id);
    res.json({ message: 'Brew session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
