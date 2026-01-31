import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Incentive Service
 * Handles employee incentive calculation and tracking for sales and purchases
 */

export const IncentiveService = {

    /**
     * Calculate and record purchase facilitation incentive
     * Called when GRN is created and employee is eligible for incentives
     */
    async calculatePurchaseIncentive(data: {
        orderId: string;
        employeeId: string;
        tenantId: string;
        orderAmount: number;
        tx?: any;
    }) {
        const runLogic = async (prismaTx: any) => {
            // 1. Fetch employee and check eligibility
            const employee = await prismaTx.employee.findUnique({
                where: { id: data.employeeId }
            });

            if (!employee) {
                throw new Error(`Employee ${data.employeeId} not found`);
            }

            if (!employee.eligibleForIncentive || employee.incentivePercentage === 0) {
                console.log(`Employee ${employee.employeeId} not eligible for incentives`);
                return null;
            }

            // 2. Check if incentive already calculated for this order
            const existing = await prismaTx.incentiveLedger.findFirst({
                where: {
                    referenceType: 'PURCHASE',
                    referenceId: data.orderId,
                    employeeId: data.employeeId
                }
            });

            if (existing) {
                console.log(`Incentive already calculated for order ${data.orderId}`);
                return existing;
            }

            // 3. Calculate incentive
            const baseAmount = data.orderAmount; // Full order amount
            const incentiveRate = employee.incentivePercentage;
            const incentiveAmount = (baseAmount * incentiveRate) / 100;

            // 4. Create Incentive Ledger Entry
            const incentive = await prismaTx.incentiveLedger.create({
                data: {
                    employeeId: data.employeeId,
                    referenceType: 'PURCHASE',
                    referenceId: data.orderId,
                    baseAmount,
                    incentiveRate,
                    incentiveAmount,
                    status: 'PENDING',
                    tenantId: data.tenantId
                }
            });

            // 5. Create Accounting Entries if Chart of Accounts is set up
            try {
                // Find Incentive Expense Account  
                const incentiveExpenseAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'INCENTIVE'
                    }
                });

                // Find Employee Payable Account
                const employeePayableAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'EMPLOYEE_PAYABLE'
                    }
                });

                if (incentiveExpenseAccount && employeePayableAccount) {
                    const voucherNumber = `INC-PURCH-${Date.now()}`;

                    // Dr Incentive Expense
                    await prismaTx.ledgerEntry.create({
                        data: {
                            accountId: incentiveExpenseAccount.id,
                            debitAmount: incentiveAmount,
                            creditAmount: 0,
                            referenceType: 'INCENTIVE',
                            referenceId: incentive.id,
                            description: `Purchase Incentive for ${employee.firstName} ${employee.lastName}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Cr Employee Payable
                    await prismaTx.ledgerEntry.create({
                        data: {
                            accountId: employeePayableAccount.id,
                            debitAmount: 0,
                            creditAmount: incentiveAmount,
                            referenceType: 'INCENTIVE',
                            referenceId: incentive.id,
                            description: `Purchase Incentive payable to ${employee.firstName} ${employee.lastName}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    console.log(`✓ Ledger entries created for purchase incentive: ₹${incentiveAmount}`);
                }
            } catch (ledgerError) {
                console.warn('Chart of Accounts not set up yet, skipping ledger entries');
            }

            console.log(`✓ Purchase incentive calculated: ₹${incentiveAmount} for ${employee.firstName} ${employee.lastName}`);
            return incentive;
        };

        if (data.tx) return runLogic(data.tx);
        return prisma.$transaction(runLogic);
    },

    /**
     * Calculate and record sales incentive
     * Called when Sale is created and salesman is eligible for incentives
     */
    async calculateSalesIncentive(data: {
        saleId: string;
        salesmanId: string;
        tenantId: string;
        saleAmount: number; // Total amount (includes tax)
        taxAmount: number;
        tx?: any;
    }) {
        const runLogic = async (prismaTx: any) => {
            // 1. Fetch employee and check eligibility
            const employee = await prismaTx.employee.findUnique({
                where: { id: data.salesmanId }
            });

            if (!employee) {
                throw new Error(`Employee ${data.salesmanId} not found`);
            }

            if (!employee.eligibleForIncentive || employee.incentivePercentage === 0) {
                console.log(`Employee ${employee.employeeId} not eligible for incentives`);
                return null;
            }

            // 2. Check if incentive already calculated for this sale
            const existing = await prismaTx.incentiveLedger.findFirst({
                where: {
                    referenceType: 'SALES',
                    referenceId: data.saleId,
                    employeeId: data.salesmanId
                }
            });

            if (existing) {
                console.log(`Incentive already calculated for sale ${data.saleId}`);
                return existing;
            }

            // 3. Calculate incentive (on base amount excluding tax)
            const baseAmount = data.saleAmount - data.taxAmount;
            const incentiveRate = employee.incentivePercentage;
            const incentiveAmount = (baseAmount * incentiveRate) / 100;

            // 4. Create Incentive Ledger Entry
            const incentive = await prismaTx.incentiveLedger.create({
                data: {
                    employeeId: data.salesmanId,
                    referenceType: 'SALES',
                    referenceId: data.saleId,
                    baseAmount,
                    incentiveRate,
                    incentiveAmount,
                    status: 'PENDING',
                    tenantId: data.tenantId
                }
            });

            // 5. Create Accounting Entries if Chart of Accounts is set up
            try {
                // Find Incentive Expense Account
                const incentiveExpenseAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'INCENTIVE'
                    }
                });

                // Find Employee Payable Account
                const employeePayableAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'EMPLOYEE_PAYABLE'
                    }
                });

                if (incentiveExpenseAccount && employeePayableAccount) {
                    const voucherNumber = `INC-SALES-${Date.now()}`;

                    // Dr Incentive Expense
                    await prismaTx.ledgerEntry.create({
                        data: {
                            accountId: incentiveExpenseAccount.id,
                            debitAmount: incentiveAmount,
                            creditAmount: 0,
                            referenceType: 'INCENTIVE',
                            referenceId: incentive.id,
                            description: `Sales Incentive for ${employee.firstName} ${employee.lastName}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Cr Employee Payable
                    await prismaTx.ledgerEntry.create({
                        data: {
                            accountId: employeePayableAccount.id,
                            debitAmount: 0,
                            creditAmount: incentiveAmount,
                            referenceType: 'INCENTIVE',
                            referenceId: incentive.id,
                            description: `Sales Incentive payable to ${employee.firstName} ${employee.lastName}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    console.log(`✓ Ledger entries created for sales incentive: ₹${incentiveAmount}`);
                }
            } catch (ledgerError) {
                console.warn('Chart of Accounts not set up yet, skipping ledger entries');
            }

            console.log(`✓ Sales incentive calculated: ₹${incentiveAmount} for ${employee.firstName} ${employee.lastName}`);
            return incentive;
        };

        if (data.tx) return runLogic(data.tx);
        return prisma.$transaction(runLogic);
    },

    /**
     * Get pending incentives for an employee
     */
    async getEmployeeIncentives(employeeId: string, tenantId: string) {
        return await prisma.incentiveLedger.findMany({
            where: {
                employeeId,
                tenantId
            },
            orderBy: { calculatedDate: 'desc' }
        });
    },

    /**
     * Get all pending incentives for a tenant
     */
    async getPendingIncentives(tenantId: string) {
        return await prisma.incentiveLedger.findMany({
            where: {
                tenantId,
                status: 'PENDING'
            },
            include: {
                employee: {
                    select: {
                        employeeId: true,
                        firstName: true,
                        lastName: true,
                        designation: true
                    }
                }
            },
            orderBy: { calculatedDate: 'desc' }
        });
    },

    /**
     * Approve incentive (ready to be paid in next payroll)
     */
    async approveIncentive(incentiveId: string, tenantId: string) {
        return await prisma.incentiveLedger.update({
            where: { id: incentiveId },
            data: { status: 'APPROVED' }
        });
    },

    /**
     * Mark incentive as paid (linked to payroll)
     */
    async markIncentiveAsPaid(incentiveId: string, payrollId: string, tenantId: string) {
        return await prisma.incentiveLedger.update({
            where: { id: incentiveId },
            data: {
                status: 'PAID',
                paidDate: new Date(),
                payrollId
            }
        });
    }
};
