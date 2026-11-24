import { ZodError } from 'zod';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError || error.issues) {
      const issues = error.issues || [];
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          status: 400,
          details: issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }
    next(error);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof ZodError || error.issues) {
      const issues = error.issues || [];
      return res.status(400).json({
        error: {
          message: 'Invalid query parameters',
          status: 400,
          details: issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }
    next(error);
  }
};
