import { Request, Response } from 'express';

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  isVerified: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

// In-memory initial reviews dataset mapped per product
const reviewsStore: Review[] = [
  {
    id: 'rev-101',
    productId: 'prod-demo-1',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    rating: 5,
    title: 'Outstanding quality & fast global shipping!',
    comment: 'Exceeded my expectations. The product quality is top notch and arrived 2 days early.',
    isVerified: true,
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'rev-102',
    productId: 'prod-demo-1',
    customerName: 'David Miller',
    customerEmail: 'david.m@example.com',
    rating: 4,
    title: 'Great value for money',
    comment: 'Very solid item. Packaging was great. Highly recommend for enterprise use.',
    isVerified: true,
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'rev-103',
    productId: 'prod-demo-2',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@example.com',
    rating: 5,
    title: 'Superb customer experience',
    comment: 'Smooth checkout and international currency calculation was seamless!',
    isVerified: true,
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export const getProductReviews = (req: Request, res: Response) => {
  const { productId } = req.params;
  
  const productReviews = reviewsStore.filter(r => r.productId === productId || !productId);
  const approvedReviews = productReviews.filter(r => r.status === 'APPROVED');
  
  const totalReviews = approvedReviews.length;
  const avgRating = totalReviews > 0
    ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 5.0;

  const ratingCounts = {
    5: approvedReviews.filter(r => r.rating === 5).length,
    4: approvedReviews.filter(r => r.rating === 4).length,
    3: approvedReviews.filter(r => r.rating === 3).length,
    2: approvedReviews.filter(r => r.rating === 2).length,
    1: approvedReviews.filter(r => r.rating === 1).length,
  };

  res.json({
    productId,
    avgRating,
    totalReviews,
    ratingCounts,
    reviews: approvedReviews
  });
};

export const createReview = (req: Request, res: Response) => {
  const { productId, customerName, customerEmail, rating, title, comment } = req.body;

  if (!productId || !rating || !title || !comment) {
    return res.status(400).json({ error: 'Product ID, rating, title, and comment are required' });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    customerName: customerName || 'Verified Customer',
    customerEmail: customerEmail || 'customer@example.com',
    rating: Number(rating),
    title,
    comment,
    isVerified: true,
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };

  reviewsStore.unshift(newReview);

  res.status(201).json({
    message: 'Review submitted successfully',
    review: newReview
  });
};

export const moderateReview = (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { status } = req.body;

  const review = reviewsStore.find(r => r.id === reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
    review.status = status;
  }

  res.json({ message: 'Review status updated', review });
};
