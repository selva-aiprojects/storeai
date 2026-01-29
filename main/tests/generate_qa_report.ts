
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const REPORT_PATH = path.join(__dirname, '../../docs/QA_TEST_CHECKLIST_v1.0.csv');

async function runQA() {
    console.log('--- STARTING QA AUTOMATION ---');
    const results: string[] = [];
    results.push('Module,Test_ID,Scenario,Expected,Actual,Status,Timestamp');

    const addResult = (module: string, id: string, scenario: string, expected: string, actual: string, status: 'PASS' | 'FAIL') => {
        results.push(`${module},${id},"${scenario}","${expected}","${actual}",${status},${new Date().toISOString()}`);
        console.log(`[${status}] ${module} - ${scenario}`);
    };

    try {
        // --- 1. CORE AUTH ---
        // Validate Admin Exists
        const admin = await prisma.user.findUnique({ where: { email: 'admin@storeai.com' } });
        addResult('AUTH', 'TC-001', 'Verify Admin User Exists', 'User found in DB', admin ? 'User found' : 'User missing', admin ? 'PASS' : 'FAIL');

        // --- 2. INVENTORY ---
        // Warehouse Default
        if (!prisma.warehouse) throw new Error("Prisma Warehouse Model missing - Run npx prisma generate");
        const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });
        addResult('INVENTORY', 'TC-002', 'Verify Default Hub', 'Default Warehouse (True)', warehouse ? `Found: ${warehouse.name}` : 'Missing', warehouse ? 'PASS' : 'FAIL');

        // Ensure Dependencies
        let customer = await prisma.customer.findFirst();
        if (!customer) {
            customer = await prisma.customer.create({
                data: { name: 'QA Customer', email: 'qa@test.com' }
            });
        }

        // Stock Flow
        const verifyProd = await prisma.product.findFirst();
        if (verifyProd) {
            const stock = await prisma.stock.findUnique({ where: { warehouseId_productId: { warehouseId: warehouse!.id, productId: verifyProd.id } } });
            addResult('INVENTORY', 'TC-003', 'Stock Record Check', 'Stock record exists for product', stock ? `Qty: ${stock.quantity}` : 'No Record', stock ? 'PASS' : 'FAIL');
        } else {
            addResult('INVENTORY', 'TC-003', 'Stock Record Check', 'Product should exist', 'No Products Found', 'FAIL');
        }

        // --- 3. CRM ---
        // Pipeline
        const deal = await prisma.deal.create({
            data: { title: `QA-Deal-${Date.now()}`, value: 1000, stage: 'NEW', probability: 10 }
        });
        addResult('CRM', 'TC-004', 'Create New Deal', 'Deal Created in NEW stage', `Created: ${deal.title}`, 'PASS');

        const updatedDeal = await prisma.deal.update({ where: { id: deal.id }, data: { stage: 'WON', probability: 100 } });
        addResult('CRM', 'TC-005', 'Promote Deal to WON', 'Stage=WON, Prob=100', `Stage=${updatedDeal.stage}`, updatedDeal.stage === 'WON' ? 'PASS' : 'FAIL');

        // --- 4. SALES & FINANCE ---
        // Create Sale
        const sale = await prisma.sale.create({
            data: {
                invoiceNo: `QA-INV-${Date.now()}`,
                totalAmount: 100,
                taxAmount: 5,
                discountAmount: 0,
                status: 'COMPLETED',
                customerId: (await prisma.customer.findFirst())?.id || "MISSING"
            }
        });
        addResult('SALES', 'TC-006', 'Generate Invoice', 'Invoice Created', `Invoice: ${sale.invoiceNo}`, 'PASS');

        // Ledger
        const ledger = await prisma.ledger.create({
            data: { title: `Ref: ${sale.invoiceNo}`, type: 'CREDIT', amount: 100, category: 'REVENUE' }
        });
        addResult('FINANCE', 'TC-007', 'Post to Ledger', 'Ledger Entry Created', `Ledger ID: ${ledger.id}`, 'PASS');

        // --- 5. HR ---
        const emp = await prisma.employee.findFirst();
        addResult('HR', 'TC-008', 'Employee Directory', 'At least 1 active employee', emp ? `Found: ${emp.employeeId}` : 'None', emp ? 'PASS' : 'FAIL');

    } catch (e: any) {
        addResult('SYSTEM', 'TC-999', 'Critical Error Exception', 'No Exceptions', e.message, 'FAIL');
    } finally {
        fs.writeFileSync(REPORT_PATH, results.join('\n'));
        console.log(`REPORT SAVED: ${REPORT_PATH}`);
        await prisma.$disconnect();
    }
}

runQA();
