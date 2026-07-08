import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const monitoredUrl = config.url || '';
  if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
    if (config.data && JSON.stringify(config.data).includes('especialidad')) {
      console.warn('[apiClient] request contains especialidad', { method: config.method, url: monitoredUrl, data: config.data });
    }
  }

  if (monitoredUrl.includes('/admins/insertar') || monitoredUrl.includes('/admins/actualizar')) {
    console.debug('[apiClient] request', { method: config.method, url: monitoredUrl, data: config.data });
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/login');
    if (!isLogin && (error.response?.status === 401 || error.response?.status === 403)) {
      console.warn('⚠️ Sesión expirada. Redirigiendo...');
      localStorage.clear();
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;