import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import { generateToken } from '../utils/tokens.js';
import { config } from '../config/index.js';
import { demoStore } from '../data/demoStore.js';
import { markDatabaseOffline, markDatabaseOnline, shouldAttemptDatabase } from '../utils/dbStatus.js';

export class AuthService {
  static async register({ name, email, password, role = 'USER' }) {
    if (shouldAttemptDatabase()) {
      try {
        const existing = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existing) {
          const err = new Error('A user with this email address already exists');
          err.statusCode = 409;
          throw err;
        }

        const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

        const user = await prisma.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            passwordHash,
            role,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        markDatabaseOnline();
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role,
        });

        return { user, token };
      } catch (dbErr) {
        if (dbErr.statusCode === 409) throw dbErr;
        markDatabaseOffline();
      }
    }

    // In-Memory Demo Fallback Mode
    const existingDemo = demoStore.findUserByEmail(email);
    if (existingDemo) {
      const err = new Error('A user with this email address already exists');
      err.statusCode = 409;
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);
    const user = demoStore.addUser({ name, email: email.toLowerCase(), passwordHash, role });
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      token,
    };
  }

  static async login({ email, password }) {
    let user = null;

    if (shouldAttemptDatabase()) {
      try {
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (user) markDatabaseOnline();
      } catch (dbErr) {
        markDatabaseOffline();
      }
    }

    if (!user) {
      user = demoStore.findUserByEmail(email);
    }

    if (!user) {
      const err = new Error('Invalid email or password credentials');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = demoStore.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getProfile(userId) {
    if (shouldAttemptDatabase()) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            queueEntries: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                location: {
                  select: { id: true, name: true, category: true, address: true },
                },
                serviceCounter: {
                  select: { id: true, counterName: true },
                },
              },
            },
          },
        });

        if (user) {
          markDatabaseOnline();
          return user;
        }
      } catch (dbErr) {
        markDatabaseOffline();
      }
    }

    const demoUser = demoStore.users.find((u) => u.id === userId) || {
      id: userId,
      name: 'Demonstration Citizen',
      email: 'citizen@queuepulse.demo',
      role: 'USER',
      createdAt: new Date(),
    };

    const userQueues = demoStore.queues.filter((q) => q.userId === userId);
    return {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      createdAt: demoUser.createdAt,
      queueEntries: userQueues,
    };
  }
}
