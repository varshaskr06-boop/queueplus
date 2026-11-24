import { QueueService } from '../services/queueService.js';

export const getLocationQueue = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const data = await QueueService.getLocationQueue(locationId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const joinQueue = async (req, res, next) => {
  try {
    const { locationId, serviceCounterId } = req.body;
    const userId = req.user ? req.user.id : null;

    const result = await QueueService.joinQueue({
      locationId,
      userId,
      serviceCounterId,
    });

    res.status(201).json({
      message: 'Joined queue successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQueueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, serviceCounterId } = req.body;

    const updated = await QueueService.updateQueueStatus({
      id,
      status,
      serviceCounterId,
      user: req.user,
    });

    res.status(200).json({
      message: `Queue status updated to ${status}`,
      queueEntry: updated,
    });
  } catch (error) {
    next(error);
  }
};
