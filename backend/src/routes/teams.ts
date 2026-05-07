import { Router } from 'express';
import { getMyTeams, getTeamMembers } from '../controllers/teams.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getMyTeams);
router.get('/:teamId/members', getTeamMembers);

export default router;
