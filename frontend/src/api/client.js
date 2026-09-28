import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reads from frontend/.env -> EXPO_PUBLIC_API_URL (baked in at build/start time).
// Falls back to a placeholder so the error is obvious if it's not set.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://attendance-backend-czs2.onrender.com/api').trim().replace(/\s+/g, '');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s to accommodate Render free tier cold starts
});

// Attach the JWT to every request if we have one.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors into a readable message string.
export function getErrorMessage(err) {
  if (err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Server took too long to respond. If hosted on Render free tier, the server is waking up (takes ~30-50s). Please try once more.';
  }
  if (err.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection or server status.';
  }
  return 'Something went wrong. Please try again.';
}

export default api;
