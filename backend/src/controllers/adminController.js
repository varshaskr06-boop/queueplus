import { AdminService } from '../services/adminService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await AdminService.getDashboardStats();
    res.status(200).json({
      dashboard: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const location = await AdminService.createLocation(req.body);
    res.status(201).json({
      message: 'Facility location created successfully',
      location,
    });
  } catch (error) {
    next(error);
  }
};

export const editLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await AdminService.editLocation(id, req.body);
    res.status(200).json({
      message: 'Facility details updated successfully',
      location,
    });
  } catch (error) {
    next(error);
  }
};

export const addCounter = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const { counterName } = req.body;
    const counter = await AdminService.addCounter(locationId, counterName || 'General Desk');
    res.status(201).json({
      message: 'Service counter added successfully',
      counter,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCounter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const counter = await AdminService.updateCounter(id, req.body);
    res.status(200).json({
      message: 'Service counter updated successfully',
      counter,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    const report = await AdminService.verifyReport(id, verified !== false);
    res.status(200).json({
      message: `Crowd report verification updated to ${Boolean(verified)}`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getPredictionHistory = async (req, res, next) => {
  try {
    const { locationId, limit } = req.query;
    const history = await AdminService.getPredictionHistory(locationId, limit);
    res.status(200).json({
      history,
      predictions: history,
    });
  } catch (error) {
    next(error);
  }
};
