import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: { team: true }
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      teams: memberships.map(m => ({
        id: m.team.id,
        name: m.team.name,
        role: m.role
      }))
    }
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      teamMemberships: { include: { team: true } }
    }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    teams: user.teamMemberships.map(m => ({
      id: m.team.id,
      name: m.team.name,
      role: m.role
    }))
  });
}
