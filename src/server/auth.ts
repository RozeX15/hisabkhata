import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from './db';
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
    let clientUser = db.users.find(u => (targetId && u.id === targetId) || (targetEmail && u.email?.toLowerCase() === targetEmail.toLowerCase()));
    if (!clientUser && (targetId || targetEmail)) {
      const nowIso = new Date().toISOString();
      const isOwner = targetEmail.toLowerCase() === 'sultanitbangladesh@gmail.com';
      clientUser = {
        id: targetId || `usr-${Date.now()}`,
        name: targetEmail ? targetEmail.split('@')[0] : 'User',
        email: targetEmail || `${targetId}@hishabkhata.app`,
        role: isOwner ? 'admin' : 'user',
        plan: isOwner ? 'pro' : 'free',
        status: 'active',
        preferredCurrency: 'BDT',
        preferredLanguage: 'en',
        emailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.users.push(clientUser);
      saveDb();
    }
    if (clientUser) {
      req.user = clientUser;
      next();
      return;
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; plan?: string };
    let user = db.users.find(u => u.id === decoded.id || (decoded.email && u.email?.toLowerCase() === decoded.email.toLowerCase()));

    if (!user) {
      const nowIso = new Date().toISOString();
      const userEmail = decoded.email || (req.headers['x-user-email'] as string) || `${decoded.id}@hishabkhata.app`;
      const isOwner = userEmail.toLowerCase() === 'sultanitbangladesh@gmail.com';
      user = {
        id: decoded.id || (req.headers['x-user-id'] as string) || `usr-${Date.now()}`,
        name: userEmail.split('@')[0] || 'User',
        email: userEmail,
        role: (decoded.role as any) || (isOwner ? 'admin' : 'user'),
        plan: (decoded.plan as any) || (isOwner ? 'pro' : 'free'),
        status: 'active',
        preferredCurrency: 'BDT',
        preferredLanguage: 'en',
        emailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.users.push(user);
      saveDb();
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
