import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

async function getUserTeamForVariant(userId: string, variantId: string) {
  const variant = await prisma.variant.findUnique({ where: { id: variantId }, select: { patientId: true } });
  if (!variant) return null;

  const patient = await prisma.patient.findUnique({
    where: { id: variant.patientId },
    include: { sharedTeams: true }
  });
  if (!patient) return null;

  const memberships = await prisma.teamMember.findMany({ where: { userId } });
  const userTeamIds = memberships.map(m => m.teamId);

  const accessibleTeamIds = [patient.ownerTeamId, ...patient.sharedTeams.map(st => st.teamId)];
  const teamId = accessibleTeamIds.find(tid => userTeamIds.includes(tid));

  return teamId || null;
}

async function getUserRoleInTeam(userId: string, teamId: string) {
  const m = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } }
  });
  return m?.role || null;
}

export async function setPriority(req: AuthRequest, res: Response) {
  const { priority, teamId } = req.body;
  const variantId = req.params.id;

  if (!['IMPORTANT', 'LOW', 'AVOID'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value' });
  }

  const resolvedTeamId = teamId || await getUserTeamForVariant(req.userId!, variantId);
  if (!resolvedTeamId) return res.status(403).json({ error: 'No team access' });

  const role = await getUserRoleInTeam(req.userId!, resolvedTeamId);
  if (!role || role === 'VIEWER') {
    return res.status(403).json({ error: 'Viewers cannot set priority' });
  }

  const existing = await prisma.variantPriority.findUnique({
    where: { variantId_teamId: { variantId, teamId: resolvedTeamId } }
  });

  const updated = await prisma.variantPriority.upsert({
    where: { variantId_teamId: { variantId, teamId: resolvedTeamId } },
    update: { priority, setByUserId: req.userId! },
    create: { variantId, teamId: resolvedTeamId, priority, setByUserId: req.userId! }
  });

  await prisma.priorityAuditLog.create({
    data: {
      variantId,
      teamId: resolvedTeamId,
      userId: req.userId!,
      oldPriority: existing?.priority || null,
      newPriority: priority
    }
  });

  return res.json(updated);
}

export async function getNotes(req: AuthRequest, res: Response) {
  const teamId = await getUserTeamForVariant(req.userId!, req.params.id);
  if (!teamId) return res.status(403).json({ error: 'No access' });

  const notes = await prisma.variantNote.findMany({
    where: { variantId: req.params.id, teamId },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return res.json(notes);
}

export async function addNote(req: AuthRequest, res: Response) {
  const { noteText, teamId } = req.body;
  if (!noteText?.trim()) return res.status(400).json({ error: 'Note text required' });

  const resolvedTeamId = teamId || await getUserTeamForVariant(req.userId!, req.params.id);
  if (!resolvedTeamId) return res.status(403).json({ error: 'No team access' });

  const role = await getUserRoleInTeam(req.userId!, resolvedTeamId);
  if (!role || role === 'VIEWER') {
    return res.status(403).json({ error: 'Viewers cannot add notes' });
  }

  const note = await prisma.variantNote.create({
    data: {
      variantId: req.params.id,
      teamId: resolvedTeamId,
      userId: req.userId!,
      noteText: noteText.trim()
    },
    include: { user: { select: { name: true, username: true } } }
  });

  return res.status(201).json(note);
}

export async function getAuditLog(req: AuthRequest, res: Response) {
  const teamId = await getUserTeamForVariant(req.userId!, req.params.id);
  if (!teamId) return res.status(403).json({ error: 'No access' });

  const logs = await prisma.priorityAuditLog.findMany({
    where: { variantId: req.params.id, teamId },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { changedAt: 'desc' }
  });

  return res.json(logs);
}
