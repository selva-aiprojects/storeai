import { Router, Request, Response } from 'express';
import { SUPPORTED_CURRENCIES, convertCurrency, formatCurrencyAmount } from '../services/currencyService';

const router = Router();

// GET /api/v1/currency/rates - Return supported currencies & rates
router.get('/rates', (req: Request, res: Response) => {
  res.json({
    baseCurrency: 'USD',
    currencies: SUPPORTED_CURRENCIES,
    updatedAt: new Date().toISOString()
  });
});

// POST /api/v1/currency/convert - Convert amount between currencies
router.post('/convert', (req: Request, res: Response) => {
  const { amount, from = 'USD', to = 'USD' } = req.body;
  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Valid numeric amount is required' });
  }

  const converted = convertCurrency(amount, from, to);
  const formatted = formatCurrencyAmount(converted, to);

  res.json({
    originalAmount: amount,
    fromCurrency: from,
    toCurrency: to,
    convertedAmount: converted,
    formatted: formatted
  });
});

export default router;
