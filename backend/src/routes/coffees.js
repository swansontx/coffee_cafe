import express from 'express';
import {
  createCoffee,
  getCoffeeById,
  getAllCoffees,
  updateCoffee,
  archiveCoffee,
  getUniqueRoasters
} from '../models/coffee.js';

const router = express.Router();

/**
 * GET /api/coffees
 * Get all coffees with optional state filter
 */
router.get('/', (req, res) => {
  try {
    const { state } = req.query;
    const filters = state ? { state } : {};
    const coffees = getAllCoffees(filters);
    res.json(coffees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/coffees/roasters
 * Get unique roaster names for dropdown
 */
router.get('/roasters', (req, res) => {
  try {
    const roasters = getUniqueRoasters();
    res.json(roasters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/coffees/:id
 * Get coffee by ID
 */
router.get('/:id', (req, res) => {
  try {
    const coffee = getCoffeeById(req.params.id);
    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    res.json(coffee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/coffees
 * Create new coffee
 */
router.post('/', (req, res) => {
  try {
    // Validate required fields
    const { roaster, name, roast_date } = req.body;

    if (!roaster || !name || !roast_date) {
      return res.status(400).json({
        error: 'Missing required fields: roaster, name, roast_date'
      });
    }

    // Validate roast date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(roast_date)) {
      return res.status(400).json({
        error: 'Invalid roast_date format. Use YYYY-MM-DD'
      });
    }

    // Validate roast date is not in future
    const roastDate = new Date(roast_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (roastDate > today) {
      return res.status(400).json({
        error: 'Roast date cannot be in the future'
      });
    }

    const coffee = createCoffee(req.body);
    res.status(201).json(coffee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/coffees/:id
 * Update coffee
 */
router.put('/:id', (req, res) => {
  try {
    const coffee = updateCoffee(req.params.id, req.body);
    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    res.json(coffee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/coffees/:id
 * Archive coffee
 */
router.delete('/:id', (req, res) => {
  try {
    const coffee = archiveCoffee(req.params.id);
    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    res.json({ message: 'Coffee archived successfully', coffee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
