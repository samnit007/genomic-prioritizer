import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

async function getAccessiblePatientIds(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMember.findMany({ where: { userId } });
  const teamIds = memberships.map(m => m.teamId);

  const owned = await prisma.patient.findMany({
    where: { ownerTeamId: { in: teamIds } },
    select: { id: true }
  });

  const shared = await prisma.patientTeam.findMany({
    where: { teamId: { in: teamIds } },
    select: { patientId: true }
  });

  const ids = new Set([
    ...owned.map(p => p.id),
    ...shared.map(p => p.patientId)
  ]);

  return [...ids];
}

export async function getPatients(req: AuthRequest, res: Response) {
  const { teamId, search } = req.query as { teamId?: string; search?: string };
  const patientIds = await getAccessiblePatientIds(req.userId!);

  let whereClause: any = { id: { in: patientIds } };

  if (teamId) {
    whereClause = {
      AND: [
        { id: { in: patientIds } },
        {
          OR: [
            { ownerTeamId: teamId },
            { sharedTeams: { some: { teamId } } }
          ]
        }
      ]
    };
  }

  if (search) {
    whereClause = {
      AND: [
        whereClause,
        {
          OR: [
            { patientCode: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    };
  }

  const patients = await prisma.patient.findMany({
    where: whereClause,
    include: {
      ownerTeam: { select: { id: true, name: true } },
      _count: { select: { studies: true, variants: true } }
    },
    orderBy: { patientCode: 'asc' }
  });

  return res.json(patients);
}

export async function getPatient(req: AuthRequest, res: Response) {
  const patientIds = await getAccessiblePatientIds(req.userId!);
  if (!patientIds.includes(req.params.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      ownerTeam: true,
      sharedTeams: { include: { team: true } },
      _count: { select: { studies: true, variants: true } }
    }
  });

  return res.json(patient);
}

export async function getPatientStudies(req: AuthRequest, res: Response) {
  const patientIds = await getAccessiblePatientIds(req.userId!);
  if (!patientIds.includes(req.params.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const studies = await prisma.study.findMany({
    where: { patientId: req.params.id },
    include: { _count: { select: { variants: true } } },
    orderBy: { dateConducted: 'desc' }
  });

  return res.json(studies);
}

export async function getPatientVariants(req: AuthRequest, res: Response) {
  const { gene, chromosome, teamId } = req.query as Record<string, string>;
  const patientIds = await getAccessiblePatientIds(req.userId!);
  if (!patientIds.includes(req.params.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const whereClause: any = { patientId: req.params.id };
  if (gene) whereClause.geneName = { contains: gene, mode: 'insensitive' };
  if (chromosome) whereClause.chromosome = chromosome;

  const memberships = await prisma.teamMember.findMany({ where: { userId: req.userId } });
  const userTeamIds = memberships.map(m => m.teamId);
  const resolvedTeamId = teamId && userTeamIds.includes(teamId) ? teamId : userTeamIds[0];

  const variants = await prisma.variant.findMany({
    where: whereClause,
    include: {
      priorities: {
        where: { teamId: resolvedTeamId },
        include: { setByUser: { select: { name: true } } }
      },
      notes: {
        where: { teamId: resolvedTeamId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      },
      study: { select: { studyName: true, studyType: true } }
    },
    orderBy: [{ caddScore: 'desc' }, { clinicalSignificance: 'asc' }]
  });

  return res.json(variants);
}
