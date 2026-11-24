import { Router } from 'express';
import { getLocationQueue, joinQueue, updateQueueStatus } from '../controllers/queueController.js';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { joinQueueSchema, updateQueueStatusSchema } from '../validators/schemas.js';

const router = Router();

router.get('/:locationId', getLocationQueue);
router.post('/join', optionalAuthenticate, validateBody(joinQueueSchema), joinQueue);
router.patch('/:id/status', authenticateToken, validateBody(updateQueueStatusSchema), updateQueueStatus);

export default router;
