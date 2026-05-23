import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
console.log(`[API] Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401s and refresh tokens
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        // Skip interceptor for the refresh call
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const { access_token } = response.data;
        
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Dispatch unauthorized event to log out user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authUser');
        window.dispatchEvent(new Event('unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
  expected_cost?: number;
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

export const logoutAuth = async (refreshToken: string) => {
  await api.post('/auth/logout', { refresh_token: refreshToken });
};

// ── Cost / Metric API calls ──────────────────────────────

export const connectAWS = async (accessKeyId: string, secretAccessKey: string) => {
  const response = await api.post('/costs/aws/connect', { 
    access_key_id: accessKeyId, 
    secret_access_key: secretAccessKey 
  });
  return response.data;
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const response = await api.get<Recommendation[]>('/costs/aws/recommendations');
  return response.data;
};

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
  refresh_token?: string;
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
}

export interface UserProfile {
  username: string;
  email: string;
  is_verified: boolean;
  created_at: string;
  has_aws_credentials: boolean;
}

export interface AuthResponse {
  message: string;
  email_sent?: boolean;
  is_new?: boolean;
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

// ── Account Management API ────────────────────────────

export const fetchProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const updateEmail = async (
  currentPassword: string,
  newEmail: string
): Promise<AuthUser & { message: string }> => {
  const { data } = await api.put('/auth/update-email', {
    current_password: currentPassword,
    new_email: newEmail,
  });
  return data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const { data } = await api.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
};
