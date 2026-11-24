import { ReportService } from '../services/reportService.js';

export const createReport = async (req, res, next) => {
  try {
    const { locationId, crowdLevel, peopleCount, observedWaitMinutes, notes } = req.body;
    const report = await ReportService.createReport({
      locationId,
      crowdLevel,
      peopleCount,
      observedWaitMinutes,
      notes,
      user: req.user,
      clientIp: req.ip,
    });

    res.status(201).json({
      message: 'Crowd observation submitted successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportsByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const { limit } = req.query;

    const data = await ReportService.getReportsByLocation(locationId, limit);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
