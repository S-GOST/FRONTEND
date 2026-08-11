import axios from 'axios';

// ============================================================
// Configuración base de Axios
// ============================================================
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  // IMPORTANTE: Habilita el envío de cookies (refreshToken y XSRF-TOKEN)
  withCredentials: true,
  // Configuración para CSRF (RFN-005)
  xsrfCookieName: 'XSRF-TOKEN', // Nombre de la cookie que envía el backend
  xsrfHeaderName: 'X-CSRF-Token' // Nombre del header que espera el backend
});

// Flag para evitar múltiples llamadas de refresh simultáneas
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

// Helper para leer cookies
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

// ============================================================
// Interceptor de Request (Peticiones)
// ============================================================
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Leer y adjuntar CSRF Token manualmente (Axios no lo hace auto en cross-origin ports)
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  const monitoredUrl = config.url || '';
  if (monitoredUrl.includes('/admins/insertar') || monitoredUrl.includes('/admins/actualizar')) {
    console.debug('[apiClient] request', { method: config.method, url: monitoredUrl, data: config.data });
  }

  return config;
});

// ============================================================
// Interceptor de Response (Respuestas)
// ============================================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLogin = originalRequest?.url?.includes('/login');
    const isRefresh = originalRequest?.url?.includes('/refresh');

    // Si el error es 401 (Token Expirado) y no es la ruta de login ni de refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isLogin && !isRefresh) {
      const hasToken = localStorage.getItem('user_token');
      
      // Si ni siquiera hay token, significa que es un visitante anónimo intentando acceder a una ruta protegida.
      if (!hasToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya se está refrescando, ponemos la petición en cola
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // RFN-002: Intentar renovar el token usando el refreshToken (cookie)
        const { data } = await apiClient.post('/auth/refresh');
        
        // Guardar el nuevo access token
        localStorage.setItem('user_token', data.token);
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
        originalRequest.headers.Authorization = 'Bearer ' + data.token;
        
        processQueue(null, data.token);
        
        // Reintentar la petición original con el nuevo token
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.warn('⚠️ Sesión completamente expirada o inválida. Redirigiendo al login...');
        localStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Errores de permisos (403)
    if (error.response?.status === 403 && !isLogin) {
      console.error('🚫 Acceso denegado (403): No tienes permisos para esta acción.');
    }

    return Promise.reject(error);
  }
);


export default apiClient;