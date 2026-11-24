import { Router } from 'express';
import { getLocations, getLocationById, getNearby } from '../controllers/locationController.js';
import { validateQuery } from '../middleware/validate.js';
import { nearbyLocationSchema } from '../validators/schemas.js';

const router = Router();

router.get('/nearby', validateQuery(nearbyLocationSchema), getNearby);
router.get('/:id', getLocationById);
router.get('/', getLocations);

export default router;
