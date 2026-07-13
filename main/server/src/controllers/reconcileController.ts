import { Response } from 'express';
import prisma from '../lib/prisma';
import { Request } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Returns reconciliation between ledger and payments for top-level categories.
 * Response shape:
 * {
 *   totals: { payments: {...}, ledger: {...} },
 *   mismatches: [ { category, payments, ledger, difference } ]
 * }
 */
export const getReconciliation = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // Aggregate payments by type
        const paymentsAgg = await prisma.payment.groupBy({ by: ['type'], where: { tenantId }, _sum: { amount: true } });

        // Aggregate ledger by category
        const ledgerAgg = await prisma.ledger.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true } });

        const paymentsTotals: any = {};
        paymentsAgg.forEach(p => { paymentsTotals[p.type] = p._sum.amount || 0; });

        const ledgerTotals: any = {};
        ledgerAgg.forEach(l => { ledgerTotals[l.category] = l._sum.amount || 0; });

        // Build mismatch list for common categories (RECEIVABLE, PAYABLE)
        const categories = Array.from(new Set([...Object.keys(paymentsTotals), ...Object.keys(ledgerTotals)]));
        const mismatches = categories.map(cat => {
            const paymentsVal = paymentsTotals[cat] || 0;
            const ledgerVal = ledgerTotals[cat] || 0;
            return { category: cat, payments: paymentsVal, ledger: ledgerVal, difference: ledgerVal - paymentsVal };
        }).filter(m => m.difference !== 0);

        res.json({ totals: { payments: paymentsTotals, ledger: ledgerTotals }, mismatches });
    } catch (error) {
        console.error('Reconciliation error', error);
        res.status(500).json({ error: 'Failed to compute reconciliation' });
    }
};

export default { getReconciliation };
