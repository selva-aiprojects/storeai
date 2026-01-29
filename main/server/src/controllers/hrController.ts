import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const createEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { employeeId, designation, joiningDate, salary, departmentId, userId, incentivePercentage, firstName, lastName, pan, bankAccountNo } = req.body;

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // Verify department belongs to tenant
        const dept = await prisma.department.findFirst({ where: { id: departmentId, tenantId } });
        if (!dept) return res.status(400).json({ error: 'Invalid department' });

        let finalFirstName = firstName;
        let finalLastName = lastName;

        // If linked to a User, try to pull names if not provided
        if (userId) {
            const linkedUser = await prisma.user.findUnique({ where: { id: userId } });
            if (linkedUser) {
                finalFirstName = finalFirstName || linkedUser.firstName;
                finalLastName = finalLastName || linkedUser.lastName;
            }
        }

        const employee = await prisma.employee.create({
            data: {
                employeeId,
                firstName: finalFirstName || 'Unknown',
                lastName: finalLastName || 'Staff',
                designation,
                joiningDate: new Date(joiningDate),
                salary: Number(salary),
                incentivePercentage: Number(incentivePercentage || 0),
                departmentId,
                userId: userId || null,
                pan: pan || null,
                bankAccountNo: bankAccountNo || null
            }
        });
        res.status(201).json(employee);
    } catch (error) {
        res.status(400).json({ error: 'Employee creation failed' });
    }
};

export const getDepartments = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const departments = await prisma.department.findMany({
            where: { tenantId }
        });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

export const getEmployees = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const employees = await prisma.employee.findMany({
            where: {
                isDeleted: false,
                department: { tenantId }
            },
            include: {
                user: true,
                department: true,
                attendances: {
                    take: 1,
                    orderBy: { date: 'desc' }
                }
            }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    const { employeeId, status } = req.body;
    const tenantId = req.user?.tenantId;

    try {
        // Verify employee belongs to tenant
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, department: { tenantId } }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const attendance = await prisma.attendance.create({
            data: {
                employeeId,
                status,
                checkIn: status === 'PRESENT' ? new Date() : null
            }
        });
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ error: 'Attendance logging failed' });
    }
};

export const updatePerformance = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { performanceRating } = req.body;
    const tenantId = req.user?.tenantId;

    try {
        // Ensure tenant ownership
        const employee = await prisma.employee.findFirst({
            where: { id, department: { tenantId } }
        });
        if (!employee) return res.status(404).json({ error: 'Employee access denied' });

        const updated = await prisma.employee.update({
            where: { id },
            data: { performanceRating: parseInt(performanceRating) }
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Performance update failed' });
    }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
        await prisma.employee.updateMany({
            where: {
                id,
                department: { tenantId }
            },
            data: { isDeleted: true }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete employee' });
    }
};

/**
 * HR Service Integration
 */
import { HRService } from '../services/hr.service';

export const generatePayroll = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const { employeeId, monthStr } = req.body;
        // monthStr: YYYY-MM

        const result = await HRService.generatePayrollForEmployee(employeeId, monthStr);
        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Payroll generation failed' });
    }
};
