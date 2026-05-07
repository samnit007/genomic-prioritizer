import { Router } from 'express';
import {
  setPriority,
  getNotes,
  addNote,
  getAuditLog
} from '../controllers/variants.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.put('/:id/priority', setPriority);
router.get('/:id/notes', getNotes);
router.post('/:id/notes', addNote);
router.get('/:id/audit', getAuditLog);

export default router;
