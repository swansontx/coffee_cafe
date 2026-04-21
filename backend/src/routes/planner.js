import express from 'express';
import {
  getFullPlannerGrid,
  upsertPlannerEntry,
  clearPlannerEntry
} from '../models/planner.js';

const router = express.Router();

// GET /api/planner?weeks=2025-04-21,2025-04-28,2025-05-05,2025-05-12
router.get('/', (req, res) => {
  try {
    const { weeks } = req.query;
    if (!weeks) {
      return res.status(400).json({ error: 'weeks query parameter is required (comma-separated dates)' });
    }
    const weekStartDates = weeks.split(',').map(d => d.trim());
    const grid = getFullPlannerGrid(weekStartDates);
    res.json(grid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/planner/:weekStart/:program
router.put('/:weekStart/:program', (req, res) => {
  try {
    const { weekStart, program } = req.params;
    const { inventory_id, featured_burn_rate } = req.body;

    const validPrograms = ['house_espresso', 'featured_espresso', 'batch_drip', 'pour_over'];
    if (!validPrograms.includes(program)) {
      return res.status(400).json({ error: 'Invalid program' });
    }

    if (inventory_id === null || inventory_id === '') {
      clearPlannerEntry(weekStart, program);
      return res.json({ cleared: true });
    }

    const entry = upsertPlannerEntry(
      weekStart,
      program,
      inventory_id ?? null,
      featured_burn_rate ? parseFloat(featured_burn_rate) : null
    );
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/planner/:weekStart/:program
router.delete('/:weekStart/:program', (req, res) => {
  try {
    const { weekStart, program } = req.params;
    clearPlannerEntry(weekStart, program);
    res.json({ cleared: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
