import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

// In-Memory store credit balances for customer wallets
const WALLET_BALANCES: Record<string, { balance: number; currency: string; history: any[] }> = {
  'demo-customer': {
    balance: 1250,
    currency: 'INR',
    history: [
      { id: 'w1', type: 'REFUND_CREDIT', amount: 1250, description: 'RMA-9081 Refund credited to store wallet', date: '2026-07-21' }
    ]
  }
};

export const getWalletBalance = async (req: AuthRequest, res: Response) => {
  const customerId = (req.query.customerId as string) || 'demo-customer';
  const wallet = WALLET_BALANCES[customerId] || { balance: 0, currency: 'INR', history: [] };
  res.json(wallet);
};

export const creditWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId = 'demo-customer', amount, rmaId, description } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid credit amount required' });

    if (!WALLET_BALANCES[customerId]) {
      WALLET_BALANCES[customerId] = { balance: 0, currency: 'INR', history: [] };
    }

    WALLET_BALANCES[customerId].balance += Number(amount);
    const txn = {
      id: `w-${Date.now()}`,
      type: 'REFUND_CREDIT',
      amount: Number(amount),
      description: description || `RMA ${rmaId || ''} Refund credited to store wallet`,
      date: new Date().toISOString().split('T')[0]
    };
    WALLET_BALANCES[customerId].history.unshift(txn);

    res.json({
      success: true,
      newBalance: WALLET_BALANCES[customerId].balance,
      transaction: txn,
      message: `₹${amount} credited to store wallet`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to credit store wallet' });
  }
};
