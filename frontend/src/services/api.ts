import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Log every request & response for debugging
api.interceptors.request.use((config) => {
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
