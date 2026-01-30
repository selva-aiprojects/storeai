import winston from 'winston';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');

// Custom format for console output (human-readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Structured format for file output (JSON for parsing)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'storeai-backend' },
    transports: [
        // Error logs - separate file for critical issues
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Combined logs - all log levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        }),

        // Console output - for development
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        }),
    ],
});

// Stream for Morgan HTTP logging
export const httpLogStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Helper functions for common logging patterns
export const logError = (error: Error, context?: Record<string, any>) => {
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        ...context,
    });
};

export const logAPICall = (method: string, path: string, userId?: string, tenantId?: string) => {
    logger.info('API Call', {
        method,
        path,
        userId,
        tenantId,
        timestamp: new Date().toISOString(),
    });
};

export const logDatabaseQuery = (query: string, duration: number, error?: Error) => {
    if (error) {
        logger.error('Database query failed', {
            query: query.substring(0, 200), // Limit query length
            duration,
            error: error.message,
        });
    } else {
        logger.debug('Database query executed', {
            query: query.substring(0, 200),
            duration,
        });
    }
};

export default logger;
