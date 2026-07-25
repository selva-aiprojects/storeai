import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  { id: 'r1', customerName: 'Sarah Jenkins', rating: 5, title: 'Outstanding quality & fast global shipping!', comment: 'Exceeded my expectations. The product quality is top notch and arrived 2 days early.', isVerified: true, createdAt: '2026-07-20' },
  { id: 'r2', customerName: 'David Miller', rating: 4, title: 'Great value for money', comment: 'Very solid item. Packaging was great. Highly recommend for enterprise store deployment.', isVerified: true, createdAt: '2026-07-18' },
  { id: 'r3', customerName: 'Elena Rostova', rating: 5, title: 'Seamless multi-currency checkout experience', comment: 'Smooth order fulfillment process and localized pricing was extremely accurate.', isVerified: true, createdAt: '2026-07-15' },
];

const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(s => (
      <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill={s <= rating ? 'var(--status-warning)' : 'var(--border-default)'}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const ProductReviews: React.FC<{ productId?: string }> = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');

  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / (totalReviews || 1)).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formComment) return;
    setReviews([{ id: `r-${Date.now()}`, customerName: formName || 'Verified Buyer', rating: formRating, title: formTitle, comment: formComment, isVerified: true, createdAt: new Date().toISOString().split('T')[0] }, ...reviews]);
    setShowModal(false);
    setFormName(''); setFormTitle(''); setFormComment('');
  };

  const card = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' };

  return (
    <div style={{ ...card, padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{t('reviews_title')}</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '2px' }}>Verified customer feedback from worldwide shoppers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--module-dashboard)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '8px 16px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-dashboard)' }}
        >
          + {t('write_review')}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{avgRating}</span>
          <StarRow rating={Math.round(Number(avgRating))} size={16} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{totalReviews} reviews</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[5, 4, 3, 2, 1].map(r => {
            const count = reviews.filter(rv => rv.rating === r).length;
            const pct = Math.round((count / (totalReviews || 1)) * 100);
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-secondary)', width: '12px' }}>{r}★</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--status-warning)', borderRadius: 'var(--radius-full)' }} />
                </div>
                <span style={{ color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reviews.map(rev => (
          <div key={rev.id} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{rev.customerName}</span>
                {rev.isVerified && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, background: 'var(--status-success-light)', color: 'var(--status-success-dark)', border: '1px solid var(--status-success)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>✓ Verified Buyer</span>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rev.createdAt}</span>
            </div>
            <StarRow rating={rev.rating} size={12} />
            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', margin: '6px 0 2px' }}>{rev.title}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rev.comment}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: 'var(--shadow-2xl)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Write a Verified Review</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Your Name" value={formName} onChange={e => setFormName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-body)', outline: 'none', boxSizing: 'border-box' }} />

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Rating</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setFormRating(n)}
                      style={{ flex: 1, padding: '6px', borderRadius: 'var(--radius-md)', border: formRating === n ? '1px solid var(--status-warning)' : '1px solid var(--border-default)', background: formRating === n ? 'var(--status-warning-light)' : 'var(--bg-body)', color: formRating === n ? 'var(--status-warning-dark)' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>
                      {n}★
                    </button>
                  ))}
                </div>
              </div>

              <input required placeholder="Headline / Title" value={formTitle} onChange={e => setFormTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-body)', outline: 'none', boxSizing: 'border-box' }} />
              <textarea required rows={3} placeholder="Share your experience..." value={formComment} onChange={e => setFormComment(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-body)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--module-dashboard)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', boxShadow: 'var(--shadow-dashboard)' }}>Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
