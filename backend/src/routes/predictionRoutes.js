import { Router } from 'express';
import {
  getPrediction,
  generatePrediction,
  getSmartRecommendation,
} from '../controllers/predictionController.js';

const router = Router();

router.get('/:locationId/recommendation', getSmartRecommendation);
router.get('/:locationId/recommendations', getSmartRecommendation);
router.post('/:locationId/recommendation', getSmartRecommendation);
router.post('/:locationId/recommendations', getSmartRecommendation);
router.get('/:locationId', getPrediction);
router.post('/:locationId', generatePrediction);

export default router;
