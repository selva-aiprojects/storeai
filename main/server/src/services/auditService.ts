import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuditLogInput {
    userId: string;
    tenantId: string;
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: AuditLogInput) => {
    try {
        const auditLog = await prisma.auditLog.create({
            data: {
                ...data,
                timestamp: new Date(),
            },
        });
        logger.debug('Audit log created', { auditLogId: auditLog.id, action: data.action });
        return auditLog;
    } catch (error) {
        logger.error('Failed to create audit log', { error, data });
        // Don't throw - audit logging should not break the main flow
    }
};

/**
 * Get audit logs for a tenant with optional filters
 */
export const getAuditLogs = async (filters: {
    tenantId: string;
    userId?: string;
    module?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}) => {
    const {
        tenantId,
        userId,
        module,
        action,
        entityType,
        entityId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
    } = filters;

    const where: any = { tenantId };

    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
};

/**
 * Helper to extract request metadata
 */
export const extractRequestMetadata = (req: Request) => {
    return {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
    };
};

export default {
    createAuditLog,
    getAuditLogs,
    extractRequestMetadata,
};
