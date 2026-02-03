import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        tenantId: string;
        tenantSlug: string;
        role: string;
        permissions: string[];
        features: any;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const checkPermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.permissions.includes(permission)) {
            return res.status(403).json({ error: `Insufficient permissions: ${permission} required` });
        }
        next();
    };
};

export const checkFeature = (featureName: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.features[featureName]) {
            return res.status(403).json({ error: `Feature '${featureName}' is not available on your current plan` });
        }
        next();
    };
};
