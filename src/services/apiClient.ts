import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import {API_CONFIG, ENDPOINTS} from '../config/api';
import {getAccessToken, storeTokens, getRefreshToken} from './tokenStorage';
import {extractTokens} from '../utils/apiNormalize';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {'Content-Type': 'application/json'},
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({resolve, reject}) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({resolve, reject});
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshTokenValue = await getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token');
      }

      const {data} = await axios.post(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
        {refreshToken: refreshTokenValue},
        {timeout: API_CONFIG.TIMEOUT},
      );

      const tokens = extractTokens(data);
      await storeTokens(tokens.accessToken, tokens.refreshToken);
      processQueue(null, tokens.accessToken);

      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await import('./tokenStorage').then(m => m.clearTokens());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
