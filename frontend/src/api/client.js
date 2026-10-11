
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  'https://attendance-backend-czs2.onrender.com/api'
)
  .trim()
  .replace(/\s+/g, '')
  .replace(/\/+$/, '');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the saved JWT to every API request.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');

      config.headers = config.headers || {};

      if (token && token.trim()) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      } else {
        delete config.headers.Authorization;
      }

      // Safe debugging: never print the actual token.
      if (__DEV__) {
        console.log('[API REQUEST]', {
          method: config.method,
          url: `${config.baseURL || ''}${config.url || ''}`,
          tokenExists: Boolean(token && token.trim()),
        });
      }

      return config;
    } catch (error) {
      console.error('[API AUTH] Failed to read stored token:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Normalize API errors.
export function getErrorMessage(err) {
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    if (status === 401) {
      return (
        data?.message ||
        data?.error ||
        'Authentication failed. Please log in again.'
      );
    }

    if (status === 403) {
      return (
        data?.message ||
        data?.error ||
        'You do not have permission to perform this action.'
      );
    }

    if (status >= 500) {
      return (
        data?.message ||
        'Server error. Please try again later.'
      );
    }

    return (
      data?.message ||
      data?.error ||
      `Request failed with status ${status}.`
    );
  }

  if (
    err.code === 'ECONNABORTED' ||
    err.message?.toLowerCase().includes('timeout')
  ) {
    return 'Server took too long to respond. Please try again.';
  }

  if (err.message === 'Network Error') {
    return 'Unable to connect to the server. Check your internet connection.';
  }

  return err.message || 'Something went wrong. Please try again.';
}

export default api;
