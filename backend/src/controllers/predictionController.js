import { PredictionService } from '../services/predictionService.js';

export const getPrediction = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const prediction = await PredictionService.getLatestPrediction(locationId);
    res.status(200).json({ prediction });
  } catch (error) {
    next(error);
  }
};

export const generatePrediction = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const result = await PredictionService.generatePrediction(locationId);
    res.status(201).json({
      message: 'Forecast generated and stored successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSmartRecommendation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const travelDuration = req.query.travelDuration || req.body?.travelDuration || 20;
    const result = await PredictionService.getSmartVisitRecommendation(locationId, travelDuration);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
