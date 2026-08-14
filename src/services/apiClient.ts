import axios from 'axios';
import {API_CONFIG} from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: Add request interceptor to attach Bearer token from keychain
// TODO: Add response interceptor for 401 → token refresh flow

export default apiClient;
