import { LocationService } from '../services/locationService.js';

export const getLocations = async (req, res, next) => {
  try {
    const { category, search, page, limit } = req.query;
    const result = await LocationService.getLocations({ category, search, page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await LocationService.getLocationById(id);
    res.status(200).json({ location });
  } catch (error) {
    next(error);
  }
};

export const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
    const locations = await LocationService.getNearbyLocations({ lat, lng, radius });
    res.status(200).json({
      count: locations.length,
      origin: { lat, lng, radiusKm: radius },
      locations,
    });
  } catch (error) {
    next(error);
  }
};
