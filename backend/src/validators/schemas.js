import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['USER', 'STAFF', 'ADMIN']).optional().default('USER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const nearbyLocationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.coerce.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  radius: z.coerce.number().positive().max(100).optional().default(15), // km
});

export const joinQueueSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  serviceCounterId: z.string().uuid('Invalid service counter ID format').optional(),
});

export const updateQueueStatusSchema = z.object({
  status: z.enum(['WAITING', 'SERVING', 'COMPLETED', 'CANCELLED']),
  serviceCounterId: z.string().uuid().optional(),
});

export const createReportSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  crowdLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  peopleCount: z.coerce.number().int().min(0, 'People count cannot be negative').max(1000, 'People count exceeds facility capacity'),
  observedWaitMinutes: z.coerce.number().int().min(0).max(600).optional(),
  notes: z.string().max(280).optional(),
});

export const createLocationSchema = z.object({
  name: z.string().min(3).max(150),
  category: z.enum(['HOSPITAL', 'BANK', 'GOVERNMENT_OFFICE']),
  address: z.string().min(5).max(255),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Opening time must be HH:MM format'),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Closing time must be HH:MM format'),
  counters: z.array(z.string().min(1)).optional().default([]),
});

export const updateCounterSchema = z.object({
  counterName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(3).max(150).optional(),
  category: z.enum(['HOSPITAL', 'BANK', 'GOVERNMENT_OFFICE']).optional(),
  address: z.string().min(5).max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Opening time must be HH:MM format').optional(),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Closing time must be HH:MM format').optional(),
});
