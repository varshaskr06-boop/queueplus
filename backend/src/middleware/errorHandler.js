import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  // Handle Zod validation error if uncaught
  if (err instanceof ZodError || err.issues) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        status: 400,
        details: (err.issues || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle Prisma Database Connection and Known Request Errors
  if (err.name === 'PrismaClientInitializationError' || err.code === 'P1001') {
    return res.status(503).json({
      error: {
        message: 'Database service is temporarily unavailable. Could not reach PostgreSQL at localhost:5432.',
        status: 503,
        code: 'DATABASE_UNAVAILABLE',
      },
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: {
        message: 'Unique constraint violation. A record with this value already exists.',
        status: 409,
        fields: err.meta?.target,
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: {
        message: 'Requested record was not found.',
        status: 404,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Internal Error]', err.stack || err.message);
  }

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      status: 404,
    },
  });
};
