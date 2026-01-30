import cron from 'node-cron';
import { archiveOldAuditLogs } from '../services/auditArchivalService';
import { logger } from '../utils/logger';

/**
 * Initialize scheduled jobs
 */
export const initializeScheduledJobs = () => {
    logger.info('Initializing scheduled jobs...');

    // Archive audit logs every Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
        logger.info('Running scheduled audit log archival');
        try {
            const result = await archiveOldAuditLogs();
            logger.info('Scheduled audit log archival completed', result);
        } catch (error) {
            logger.error('Scheduled audit log archival failed', { error });
        }
    }, {
        timezone: 'UTC',
    });

    logger.info('Scheduled jobs initialized: Weekly audit log archival (Sundays 2 AM UTC)');
};

export default initializeScheduledJobs;
