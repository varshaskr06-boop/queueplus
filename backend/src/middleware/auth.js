import { verifyToken } from '../utils/tokens.js';
import prisma from '../prisma/client.js';

/**
 * Middleware to authenticate requests using JWT in the Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Authentication token required. Please provide a valid Bearer token.',
        status: 401,
      },
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      error: {
        message: 'Invalid or expired authentication token',
        status: 401,
      },
    });
  }

  try {
    // Optionally verify user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'User belonging to this token no longer exists',
          status: 401,
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Fallback if database check fails
    req.user = decoded;
    next();
  }
};

/**
 * Optional authentication middleware: sets req.user if a valid token is present,
 * but allows unauthenticated requests to proceed.
 */
export const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      req.user = decoded;
    }
  }
  next();
};

/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param {string|string[]} roles - One or more allowed roles ('ADMIN', 'STAFF', 'USER')
 */
export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required before role verification',
          status: 401,
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] roles. Your role is ${req.user.role}.`,
          status: 403,
        },
      });
    }

    next();
  };
};
