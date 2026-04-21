import express from 'express';
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getAvailableForProgram
} from '../models/inventory.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { type, program } = req.query;
    const items = getAllInventory({ type, program });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/available', (req, res) => {
  try {
    const { program, week_start, featured_burn_rate } = req.query;
    if (!program || !week_start) {
      return res.status(400).json({ error: 'program and week_start are required' });
    }
    const items = getAvailableForProgram(
      program,
      week_start,
      featured_burn_rate ? parseFloat(featured_burn_rate) : null
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const item = getInventoryById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { type, roaster, coffee_name } = req.body;
    if (!type || !roaster || !coffee_name) {
      return res.status(400).json({ error: 'type, roaster, and coffee_name are required' });
    }
    if (!['brewing', 'retail'].includes(type)) {
      return res.status(400).json({ error: 'type must be brewing or retail' });
    }
    const item = createInventory(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const item = updateInventory(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const item = getInventoryById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    deleteInventory(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
