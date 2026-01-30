import { Request, Response, NextFunction } from 'express';
import { createAuditLog, extractRequestMetadata } from '../services/auditService';

// Actions that should be audited
const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    READ: 'READ',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
} as const;

// Module mappings based on routes
const ROUTE_TO_MODULE: Record<string, string> = {
    '/products': 'INVENTORY',
    '/categories': 'INVENTORY',
    '/sales': 'SALES',
    '/customers': 'CRM',
    '/orders': 'PROCUREMENT',
    '/suppliers': 'PROCUREMENT',
    '/hr': 'HR',
    '/payroll': 'HR',
    '/finance': 'FINANCE',
    '/accounts': 'FINANCE',
};

/**
 * Middleware to audit mutating operations (POST, PUT, DELETE)
 */
export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only audit mutating operations
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
    }

    const originalSend = res.send;
    const originalJson = res.json;

    // Store original body for comparison
    const requestBody = { ...req.body };

    // Intercept response to log after successful operation
    const auditAfterResponse = (data: any) => {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Extract user and tenant from request (set by auth middleware)
            const user = (req as any).user;
            if (!user) return; // Skip if no user context

            const { ipAddress, userAgent } = extractRequestMetadata(req);

            // Determine action
            let action: string = AUDIT_ACTIONS.CREATE;
            if (req.method === 'PUT') action = AUDIT_ACTIONS.UPDATE;
            if (req.method === 'DELETE') action = AUDIT_ACTIONS.DELETE;

            // Determine module from route
            const module = Object.keys(ROUTE_TO_MODULE).find(route =>
                req.path.includes(route)
            ) || 'SYSTEM';

            const moduleName = ROUTE_TO_MODULE[module] || 'SYSTEM';

            // Determine entity type and ID from path
            const pathParts = req.path.split('/').filter(Boolean);
            const entityType = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
            const entityId = req.params.id || data?.id || data?.data?.id;

            // Create audit log (async, don't block response)
            createAuditLog({
                userId: user.id,
                tenantId: user.tenantId,
                action,
                module: moduleName,
                entityType,
                entityId,
                oldValue: req.method === 'PUT' || req.method === 'DELETE' ? requestBody : undefined,
                newValue: req.method === 'POST' || req.method === 'PUT' ? data : undefined,
                ipAddress,
                userAgent,
            }).catch(err => {
                // Log error but don't fail request
                console.error('Audit logging failed:', err);
            });
        }
    };

    // Override send
    res.send = function (data: any) {
        auditAfterResponse(data);
        return originalSend.call(this, data);
    };

    // Override json
    res.json = function (data: any) {
        auditAfterResponse(data);
        return originalJson.call(this, data);
    };

    next();
};

export default auditMiddleware;
