import { Router } from 'express';
import { downloadPatientPdf, downloadAllPdf } from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/patient/:patientId', downloadPatientPdf);
router.get('/all', downloadAllPdf);

export default router;
