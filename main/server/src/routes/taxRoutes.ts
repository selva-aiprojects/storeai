import { Router } from 'express';
import { calculateRegionalTax } from '../services/taxService';

const router = Router();
router.post('/calculate', (req, res) => {
  const result = calculateRegionalTax(req.body);
  res.json(result);
});

export default router;
