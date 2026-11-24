import { Router } from 'express';
import authRoutes from './authRoutes.js';
import locationRoutes from './locationRoutes.js';
import queueRoutes from './queueRoutes.js';
import reportRoutes from './reportRoutes.js';
import predictionRoutes from './predictionRoutes.js';
import adminRoutes from './adminRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);
router.use('/queues', queueRoutes);
router.use('/reports', reportRoutes);
router.use('/predictions', predictionRoutes);
router.use('/admin', adminRoutes);
router.use('/', healthRoutes);

export default router;
