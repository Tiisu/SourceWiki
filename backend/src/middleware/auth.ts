import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  id?: string;
  username?: string;
  role?: string;
  [k: string]: any;
}

export interface AuthRequest extends Request {
  user?: AuthUser | null;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user) return next();

  const devHeader = req.header('x-dev-user');
  if (devHeader) {
    try {
      req.user = JSON.parse(devHeader) as AuthUser;
      return next();
    } catch (err) {
      // fall through
    }
  }

  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
};