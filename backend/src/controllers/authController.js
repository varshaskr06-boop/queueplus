import { AuthService } from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await AuthService.getProfile(req.user.id);
    res.status(200).json({
      user: profile,
    });
  } catch (error) {
    next(error);
  }
};
