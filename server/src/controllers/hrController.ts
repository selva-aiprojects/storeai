import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { employeeId, designation, joiningDate, salary, departmentId, userId, incentivePercentage, firstName, lastName } = req.body;

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
                userId: userId || null
            }
        });
        res.status(201).json(employee);
    } catch (error) {
        res.status(400).json({ error: 'Employee creation failed' });
    }
};

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

export const getEmployees = async (req: Request, res: Response) => {
    try {
        const employees = await prisma.employee.findMany({
            where: { isDeleted: false },
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

export const markAttendance = async (req: Request, res: Response) => {
    const { employeeId, status } = req.body;
    try {
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

export const updatePerformance = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { performanceRating } = req.body;
    try {
        const employee = await prisma.employee.update({
            where: { id },
            data: { performanceRating: parseInt(performanceRating) }
        });
        res.json(employee);
    } catch (error) {
        res.status(400).json({ error: 'Performance update failed' });
    }
};

export const deleteEmployee = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.employee.update({
            where: { id },
            data: { isDeleted: true }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete employee' });
    }
};
