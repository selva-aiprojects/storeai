import { Request, Response } from 'express';

export interface ReturnRequestItem {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'CHANGED_MIND' | 'SIZE_FIT_ISSUE';
  condition: 'UNOPENED' | 'OPENED' | 'DAMAGED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  refundAmount: number;
  comments?: string;
  createdAt: string;
}

const rmaStore: ReturnRequestItem[] = [
  {
    id: 'RMA-9081',
    orderId: 'ORD-8821',
    customerName: 'Marcus Aurelius',
    customerEmail: 'marcus@example.com',
    productName: 'Wireless Noise-Canceling Headphones',
    quantity: 1,
    reason: 'SIZE_FIT_ISSUE',
    condition: 'UNOPENED',
    status: 'APPROVED',
    refundAmount: 199.99,
    comments: 'Preferred over-ear instead of on-ear model.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'RMA-9082',
    orderId: 'ORD-8845',
    customerName: 'Claire Redfield',
    customerEmail: 'claire@example.com',
    productName: 'Ergonomic Mechanical Keyboard',
    quantity: 1,
    reason: 'DEFECTIVE',
    condition: 'OPENED',
    status: 'PENDING',
    refundAmount: 149.50,
    comments: 'Spacebar key switch intermittently stutters.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const getReturnRequests = (req: Request, res: Response) => {
  const { customerEmail } = req.query;
  if (customerEmail) {
    const customerReturns = rmaStore.filter(r => r.customerEmail.toLowerCase() === String(customerEmail).toLowerCase());
    return res.json({ returns: customerReturns });
  }
  res.json({ returns: rmaStore });
};

export const createReturnRequest = (req: Request, res: Response) => {
  const { orderId, customerName, customerEmail, productName, quantity, reason, condition, refundAmount, comments } = req.body;

  if (!orderId || !productName || !reason) {
    return res.status(400).json({ error: 'Order ID, Product Name, and Reason are required for return initialization' });
  }

  const newReturn: ReturnRequestItem = {
    id: `RMA-${Math.floor(1000 + Math.random() * 9000)}`,
    orderId,
    customerName: customerName || 'Valued Customer',
    customerEmail: customerEmail || 'customer@example.com',
    productName,
    quantity: quantity || 1,
    reason,
    condition: condition || 'OPENED',
    status: 'PENDING',
    refundAmount: refundAmount || 0,
    comments: comments || '',
    createdAt: new Date().toISOString()
  };

  rmaStore.unshift(newReturn);

  res.status(201).json({
    message: 'Return request submitted successfully',
    rma: newReturn
  });
};

export const updateReturnStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const rma = rmaStore.find(r => r.id === id);
  if (!rma) {
    return res.status(404).json({ error: 'RMA Return request not found' });
  }

  if (['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'].includes(status)) {
    rma.status = status;
  }

  res.json({ message: 'Return request status updated', rma });
};
