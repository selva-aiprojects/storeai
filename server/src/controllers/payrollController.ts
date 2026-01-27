import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getPayrolls = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const payrolls = await prisma.payroll.findMany({
            where: {
                employee: {
                    department: {
                        tenantId: tenantId
                    }
                }
            },
            include: { employee: { include: { user: true } } },
            orderBy: { paymentDate: 'desc' }
        });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
};

export const createPayroll = async (req: AuthRequest, res: Response) => {
    const { employeeId, amount, month, status, monthlySales, overtimeHours } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
        return res.status(403).json({ error: 'Tenant context required' });
    }

    try {
        const payroll = await prisma.$transaction(async (tx) => {
            // Verify employee belongs to tenant
            const employee = await tx.employee.findFirst({
                where: {
                    id: employeeId,
                    department: { tenantId }
                }
            });

            if (!employee) throw new Error("Employee not found in this organization");

            const incentive = (monthlySales || 0) * (employee.incentivePercentage || 0);
            const overtimeRate = (employee.salary / 160) * 1.5; // Approx hourly rate * 1.5x
            const overtimeAmount = (overtimeHours || 0) * overtimeRate;
            const totalPayout = parseFloat(amount) + incentive + overtimeAmount;

            const newPayroll = await tx.payroll.create({
                data: {
                    employeeId,
                    amount: parseFloat(amount),
                    incentive,
                    overtimeAmount,
                    totalPayout,
                    month,
                    status: status || 'PAID'
                },
                include: { employee: true }
            });

            // Log total payout as an expense in the Ledger
            await tx.ledger.create({
                data: {
                    title: `Payroll: ${month} (${employee.employeeId})`,
                    type: 'DEBIT',
                    amount: totalPayout,
                    category: 'OPERATIONAL',
                    description: `Base: $${amount}, Comm: $${incentive.toFixed(2)}, OT: $${overtimeAmount.toFixed(2)}`,
                    tenantId
                }
            });

            return newPayroll;
        });
        res.status(201).json(payroll);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Payroll generation failed' });
    }
};
