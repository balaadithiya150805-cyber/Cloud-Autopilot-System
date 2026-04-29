import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ← ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] ✗ ${error.config?.url}`, error.message, error.response?.data);
    if (error.response?.status === 401) {
      // Clear token and reload if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('authUser');
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ── Types ──────────────────────────────────────────────

export interface DailyCost {
  date: string;
  cost: number;
}

export interface AnomalyCost extends DailyCost {
  status: string;
}

export interface PredictionCost {
  date: string;
  predicted_cost: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface ExplanationCost extends AnomalyCost {
  reason: string | null;
  suggestion: string | null;
}

// ── Fetchers ───────────────────────────────────────────

export const fetchCosts = async (): Promise<DailyCost[]> => {
  const { data } = await api.get('/costs/aws');
  return Array.isArray(data) ? data : [];
};

export const fetchAnomalies = async (): Promise<AnomalyCost[]> => {
  const { data } = await api.get('/costs/aws/anomalies');
  return Array.isArray(data) ? data : [];
};

export const fetchPredictions = async (): Promise<PredictionCost[]> => {
  const { data } = await api.get('/costs/aws/predict');
  return Array.isArray(data) ? data : [];
};

export const fetchExplanations = async (): Promise<ExplanationCost[]> => {
  const { data } = await api.get('/costs/aws/explain');
  return Array.isArray(data) ? data : [];
};

// ── Auth Types ─────────────────────────────────────────

export interface AuthUser {
  username: string;
  email: string;
  access_token?: string;
}

export interface AuthResponse {
  message: string;
  email_sent?: boolean;
}

// ── Auth API ───────────────────────────────────────────

export const signup = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/signup', { username, email, password });
  return data;
};

export const verifyOtp = async (
  email: string,
  otp: string
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data;
};

export const login = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const resendOtp = async (
  email: string
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/resend-otp', { email });
  return data;
};
