import { PrismaClient, Employee, SalaryStructure } from '@prisma/client';

const prisma = new PrismaClient();

export const HRService = {

    /**
     * Calculate LOP (Loss of Pay) Days from Attendance
     */
    async calculateLopDays(employeeId: string, month: number, year: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                employeeId,
                date: { gte: startDate, lte: endDate }
            }
        });

        let lopDays = 0;
        attendanceRecords.forEach(record => {
            // Logic: Status is ABSENT or 'isLop' flag is explicitly set
            if (record.status === 'ABSENT' || record.isLop) {
                lopDays += 1;
            }
            // Late mark logic could convert 3 late marks to 0.5 LOP
        });

        return lopDays;
    },

    /**
     * Generate Payroll for Employee
     */
    async generatePayrollForEmployee(employeeId: string, monthStr: string) {
        // monthStr format: "YYYY-MM"
        const [year, month] = monthStr.split('-').map(Number);

        // 1. Get Employee & Structure
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { salaryStructure: true }
        });

        if (!employee || !employee.salaryStructure) {
            throw new Error("Employee or Salary Structure not found");
        }

        const structure = employee.salaryStructure;

        // 2. Calculate LOP
        const lopDays = await this.calculateLopDays(employeeId, month, year);
        const daysInMonth = new Date(year, month, 0).getDate();
        const perDaySalary = structure.basic / daysInMonth; // Usually based on Basic or Gross? Let's assume Basic.
        const lopDeduction = lopDays * perDaySalary;

        // 3. Components
        const allowances = structure.medical + structure.transport + structure.special + structure.da;
        const grossSalary = structure.basic + structure.hra + allowances;

        // 4. Deductions (PF, Tax, LOP)
        const pf = structure.providentFund;
        const profTax = structure.professionalTax;
        const totalDeductions = pf + profTax + lopDeduction;

        // 5. Net
        const netSalary = grossSalary - totalDeductions;

        // 6. Save Payroll
        return await prisma.payroll.create({
            data: {
                employeeId,
                month: monthStr,
                paymentDate: new Date(),
                amount: structure.basic, // Required field, mapping to Basic or similar
                basicSalary: structure.basic,
                hra: structure.hra,
                allowances: allowances,
                grossSalary: grossSalary,
                deductions: totalDeductions,
                netSalary: netSalary,
                totalPayout: netSalary, // Required field
                status: 'GENERATED'
            }
        });
    }
};
