import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDailyAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { date } = req.query; // YYYY-MM-DD

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // Parse date properly to query the range (start of day to end of day)
        const targetDate = date ? new Date(String(date)) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await prisma.attendance.findMany({
            where: {
                employee: { department: { tenantId } }, // Filter by tenant via employee -> department
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { date, records } = req.body;
        // records: [{ employeeId, status, checkIn, checkOut }]

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const targetDate = new Date(date);

        const results = await prisma.$transaction(
            records.map((record: any) => {
                // Check if record exists for this employee on this date (simplified logic)
                // In a real high-perf setup, we might delete-insert or upsert carefully
                // For now, let's try upsert logic or findFirst then update/create

                // Note: Prisma upsert requires a unique constraint. 
                // We'll filter by ID if we have it, but for bulk from UI we likely just have employeeId.
                // Best approach for bulk daily sheet: 
                // 1. Find existing record for (employeeId + date)
                // 2. Update or Create

                // Let's rely on finding first.
                return prisma.attendance.findFirst({
                    where: {
                        employeeId: record.employeeId,
                        date: {
                            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                            lte: new Date(targetDate.setHours(23, 59, 59, 999))
                        }
                    }
                }).then((existing) => {
                    if (existing) {
                        return prisma.attendance.update({
                            where: { id: existing.id },
                            data: {
                                status: record.status,
                                checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
                                checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
                                overtimeHours: record.overtimeHours || 0
                            }
                        });
                    } else {
                        return prisma.attendance.create({
                            data: {
                                date: new Date(date), // Use the specific date passed
                                status: record.status,
                                employeeId: record.employeeId,
                                checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
                                checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
                                overtimeHours: record.overtimeHours || 0
                            }
                        });
                    }
                });
            })
        );

        res.json({ message: 'Attendance updated successfully', count: results.length });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to mark attendance' });
    }
};
