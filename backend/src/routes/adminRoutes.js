import { Router } from 'express';
import {
  getDashboard,
  createLocation,
  editLocation,
  addCounter,
  updateCounter,
  verifyReport,
  getPredictionHistory,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createLocationSchema,
  updateLocationSchema,
  updateCounterSchema,
} from '../validators/schemas.js';

const router = Router();

// Apply auth to all admin endpoints
router.use(authenticateToken);

// Dashboard requires ADMIN role
router.get('/dashboard', requireRole('ADMIN'), getDashboard);

// Locations management requires ADMIN role
router.post('/locations', requireRole('ADMIN'), validateBody(createLocationSchema), createLocation);
router.patch('/locations/:id', requireRole('ADMIN'), validateBody(updateLocationSchema), editLocation);
router.post('/locations/:locationId/counters', requireRole('ADMIN'), addCounter);

// Counter status updates can be performed by either STAFF or ADMIN
router.patch('/counters/:id', requireRole(['ADMIN', 'STAFF']), validateBody(updateCounterSchema), updateCounter);

// Review & verify / flag crowd reports
router.patch('/reports/:id/verify', requireRole('ADMIN'), verifyReport);

// Prediction audit history
router.get('/predictions/history', requireRole('ADMIN'), getPredictionHistory);

export default router;
