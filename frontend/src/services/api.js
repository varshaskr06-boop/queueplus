import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : '';
const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL !== undefined ? import.meta.env.VITE_ML_SERVICE_URL : '/ml';

export const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mlApi = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('queuepulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Expired Sessions & Unauthorized Access
backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or register endpoint failures
      const isAuthRequest = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthRequest) {
        localStorage.removeItem('queuepulse_token');
        localStorage.removeItem('queuepulse_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Service Call Helpers
export const authService = {
  login: async (email, password) => {
    const res = await backendApi.post('/api/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await backendApi.post('/api/auth/register', userData);
    return res.data;
  },
  getProfile: async () => {
    const res = await backendApi.get('/api/auth/profile');
    return res.data.user;
  },
};

export const locationService = {
  getLocations: async (params = {}) => {
    const res = await backendApi.get('/api/locations', { params });
    return res.data;
  },
  getLocationById: async (id) => {
    const res = await backendApi.get(`/api/locations/${id}`);
    return res.data.location;
  },
  getNearby: async (lat, lng, radius = 15) => {
    const res = await backendApi.get('/api/locations/nearby', {
      params: { lat, lng, radius },
    });
    return res.data;
  },
};

export const queueService = {
  getLocationQueue: async (locationId) => {
    const res = await backendApi.get(`/api/queues/${locationId}`);
    return res.data;
  },
  joinQueue: async (locationId, serviceCounterId) => {
    const res = await backendApi.post('/api/queues/join', {
      locationId,
      serviceCounterId,
    });
    return res.data;
  },
  updateStatus: async (ticketId, status, serviceCounterId) => {
    const res = await backendApi.patch(`/api/queues/${ticketId}/status`, {
      status,
      serviceCounterId,
    });
    return res.data;
  },
};

export const reportService = {
  submitReport: async (locationId, crowdLevel, peopleCount, observedWaitMinutes, notes) => {
    const res = await backendApi.post('/api/reports', {
      locationId,
      crowdLevel,
      peopleCount,
      observedWaitMinutes: observedWaitMinutes ? parseInt(observedWaitMinutes, 10) : undefined,
      notes,
    });
    return res.data;
  },
  getReports: async (locationId) => {
    const res = await backendApi.get(`/api/reports/${locationId}`);
    return res.data;
  },
};

export const predictionService = {
  getPrediction: async (locationId) => {
    const res = await backendApi.get(`/api/predictions/${locationId}`);
    return res.data.prediction;
  },
  generatePrediction: async (locationId) => {
    const res = await backendApi.post(`/api/predictions/${locationId}`);
    return res.data;
  },
  getVisitRecommendation: async (locationId, travelDuration = 20) => {
    const res = await backendApi.get(`/api/predictions/${locationId}/recommendation`, {
      params: { travelDuration },
    });
    return res.data;
  },
};

export const adminService = {
  getDashboard: async () => {
    const res = await backendApi.get('/api/admin/dashboard');
    return res.data.dashboard;
  },
  createLocation: async (data) => {
    const res = await backendApi.post('/api/admin/locations', data);
    return res.data.location;
  },
  editLocation: async (id, data) => {
    const res = await backendApi.patch(`/api/admin/locations/${id}`, data);
    return res.data.location;
  },
  addCounter: async (locationId, counterName) => {
    const res = await backendApi.post(`/api/admin/locations/${locationId}/counters`, { counterName });
    return res.data.counter;
  },
  updateCounter: async (counterId, data) => {
    const res = await backendApi.patch(`/api/admin/counters/${counterId}`, data);
    return res.data.counter;
  },
  verifyReport: async (reportId, verified = true) => {
    const res = await backendApi.patch(`/api/admin/reports/${reportId}/verify`, { verified });
    return res.data.report;
  },
  getPredictionHistory: async (locationId = null) => {
    const res = await backendApi.get('/api/admin/predictions/history', {
      params: locationId ? { locationId } : undefined,
    });
    return res.data.history;
  },
};

export const checkBackendHealth = async () => {
  const response = await backendApi.get('/api/health');
  return response.data;
};

export const checkMlHealth = async () => {
  const response = await mlApi.get('/health');
  return response.data;
};
