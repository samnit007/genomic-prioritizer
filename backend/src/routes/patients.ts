import { Router } from 'express';
import { getPatients, getPatient, getPatientStudies, getPatientVariants } from '../controllers/patients.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getPatients);
router.get('/:id', getPatient);
router.get('/:id/studies', getPatientStudies);
router.get('/:id/variants', getPatientVariants);

export default router;
