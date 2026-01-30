import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// LocalStack S3 configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
    forcePathStyle: true, // Required for LocalStack
});

const AUDIT_LOG_BUCKET = 'storeai-audit-logs';
const RETENTION_DAYS = 7;

/**
 * Archive audit logs older than retention period to S3
 */
export const archiveOldAuditLogs = async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    logger.info(`Starting audit log archival for logs older than ${cutoffDate.toISOString()}`);

    try {
        // Fetch logs to archive
        const logsToArchive = await prisma.auditLog.findMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                tenant: {
                    select: {
                        slug: true,
                        name: true,
                    },
                },
            },
        });

        if (logsToArchive.length === 0) {
            logger.info('No audit logs to archive');
            return { archived: 0, deleted: 0 };
        }

        logger.info(`Found ${logsToArchive.length} audit logs to archive`);

        // Group by tenant and week for organized storage
        const groupedLogs = logsToArchive.reduce((acc, log) => {
            const weekKey = getWeekKey(log.timestamp);
            const tenantKey = log.tenantId;
            const key = `${tenantKey}/${weekKey}`;

            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(log);
            return acc;
        }, {} as Record<string, any[]>);

        // Upload to S3
        let uploadedCount = 0;
        for (const [key, logs] of Object.entries(groupedLogs)) {
            const s3Key = `audit-logs/${key}.json`;
            const data = JSON.stringify({
                archivedAt: new Date().toISOString(),
                count: logs.length,
                logs,
            }, null, 2);

            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: AUDIT_LOG_BUCKET,
                    Key: s3Key,
                    Body: data,
                    ContentType: 'application/json',
                    Metadata: {
                        'archived-at': new Date().toISOString(),
                        'log-count': logs.length.toString(),
                    },
                }));
                uploadedCount += logs.length;
                logger.info(`Uploaded ${logs.length} logs to S3: ${s3Key}`);
            } catch (error) {
                logger.error(`Failed to upload logs to S3: ${s3Key}`, { error });
            }
        }

        // Delete archived logs from database
        const deleteResult = await prisma.auditLog.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });

        logger.info(`Archived ${uploadedCount} logs to S3 and deleted ${deleteResult.count} from database`);

        return {
            archived: uploadedCount,
            deleted: deleteResult.count,
        };
    } catch (error) {
        logger.error('Audit log archival failed', { error });
        throw error;
    }
};

/**
 * Get week key for organizing logs (YYYY-WXX format)
 */
function getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Manual trigger for archival (for testing or admin use)
 */
export const triggerArchival = async () => {
    logger.info('Manual audit log archival triggered');
    return await archiveOldAuditLogs();
};

export default {
    archiveOldAuditLogs,
    triggerArchival,
};
