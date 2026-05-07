import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  userId?: string;
  teamId?: string;
  role?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function requireTeamAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const teamId = req.params.teamId || req.query.teamId as string;
  if (!teamId || !req.userId) return next();

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: req.userId } }
  });

  if (!membership) {
    return res.status(403).json({ error: 'No access to this team' });
  }

  req.teamId = teamId;
  req.role = membership.role;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
