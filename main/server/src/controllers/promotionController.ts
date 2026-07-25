import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

export interface Coupon {
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
}

const ACTIVE_COUPONS: Record<string, Coupon> = {
  'WELCOME10': { code: 'WELCOME10', discountType: 'PERCENT', discountValue: 10, minOrderValue: 500, maxDiscount: 1000, description: '10% OFF on your first purchase' },
  'STOREAI500': { code: 'STOREAI500', discountType: 'FLAT', discountValue: 500, minOrderValue: 2000, description: 'Flat ₹500 OFF on orders over ₹2000' },
  'VIP20': { code: 'VIP20', discountType: 'PERCENT', discountValue: 20, minOrderValue: 1500, maxDiscount: 3000, description: '20% Enterprise VIP Discount' },
};

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, orderSubtotal } = req.body;
    const cleanCode = (code || '').toUpperCase().trim();

    const coupon = ACTIVE_COUPONS[cleanCode];
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code. Try WELCOME10 or STOREAI500.' });
    }

    if (orderSubtotal < coupon.minOrderValue) {
      return res.status(400).json({ error: `Coupon requires a minimum order value of ₹${coupon.minOrderValue}` });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = (orderSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discountAmount.toFixed(2)),
      newTotal: Number(Math.max(0, orderSubtotal - discountAmount).toFixed(2)),
      description: coupon.description
    });
  } catch (error) {
    res.status(500).json({ error: 'Coupon validation failed' });
  }
};

export const getPromotions = async (req: AuthRequest, res: Response) => {
  res.json(Object.values(ACTIVE_COUPONS));
};
