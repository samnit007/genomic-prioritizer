import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export async function getMyTeams(req: AuthRequest, res: Response) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.userId },
    include: {
      team: {
        include: { _count: { select: { ownedPatients: true, members: true } } }
      }
    }
  });

  return res.json(memberships.map(m => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    role: m.role,
    patientCount: m.team._count.ownedPatients,
    memberCount: m.team._count.members
  })));
}

export async function getTeamMembers(req: AuthRequest, res: Response) {
  const { teamId } = req.params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: req.userId! } }
  });
  if (!membership) return res.status(403).json({ error: 'No access' });

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, username: true, email: true } } }
  });

  return res.json(members.map(m => ({
    userId: m.userId,
    name: m.user.name,
    username: m.user.username,
    email: m.user.email,
    role: m.role,
    joinedAt: m.joinedAt
  })));
}
