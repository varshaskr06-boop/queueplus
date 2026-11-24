import { Router } from 'express';
import { createReport, getReportsByLocation } from '../controllers/reportController.js';
import { optionalAuthenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createReportSchema } from '../validators/schemas.js';

const router = Router();

router.post('/', optionalAuthenticate, validateBody(createReportSchema), createReport);
router.get('/:locationId', getReportsByLocation);

export default router;
