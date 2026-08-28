import apiClient from '../config/axios';

export interface LoginResponse {
  token?: string;
  nombre?: string;
  rol?: 'admin' | 'tecnico' | 'cliente' | number;
  id_usuario?: number;
  numero_documento?: string;
  id?: number | string;
  usuario?: string;
  email?: string;
  data?: {
    id_usuario?: number;
    numero_documento?: string;
    id?: number | string;
    usuario?: string;
    email?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const storeSession = (data: LoginResponse, role: 'admin' | 'tecnico' | 'cliente') => {
  if (!data.token) return data;

  localStorage.setItem('user_token', data.token);
  localStorage.setItem('user_name', data.nombre ?? 'Usuario');
  localStorage.setItem('user_role', role);

  const posiblesIds = [
    data.id_usuario, data.data?.id_usuario,  // PK real (autoincremental) — prioridad máxima
    data.numero_documento, data.data?.numero_documento,
    data.id, data.data?.id,
    data.usuario, data.email,
    data.data?.usuario, data.data?.email
  ];

  let userId = posiblesIds.find(id => id !== undefined && id !== null && id !== '');

  if (userId) {
    localStorage.setItem('user_id', String(userId));
    console.log('✅ [AUTH] user_id guardado:', userId);
  } else if (data.token) {
    const payload = decodeJwt(data.token);
    userId = payload?.id_usuario || payload?.id || payload?.sub || payload?.usuario;
    
    if (userId) {
      localStorage.setItem('user_id', String(userId));
      console.log('🔑 [AUTH] user_id extraído del JWT:', userId);
    } else {
      console.error('❌ [AUTH] El backend no envió ID. Respuesta completa:', data);
    }
  }

  return { ...data, rol: role };
};

export const clearSession = async (redirectToLogin = true) => {
  try {
    // Intentar invalidar el refresh token en el servidor
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.warn('Falló el logout en el servidor', error);
  } finally {
    // Limpiar siempre localmente
    localStorage.clear();
    if (redirectToLogin) {
      window.location.replace('/login');
    }
  }
};

// 🚀 SERVICIO UNIFICADO DE LOGIN (usa /auth/login)
const mapRol = (rolId: number | string): 'admin' | 'tecnico' | 'cliente' => {
  const id = Number(rolId);
  if (id === 1) return 'admin';
  if (id === 2) return 'tecnico';
  return 'cliente';
};

export const loginService = async (usuario: string, contrasena: string) => {
  const user = usuario.trim();
  const pass = contrasena.trim();

  // RFN-005: Aseguramos tener el token CSRF antes del POST de login
  try {
    await apiClient.get('/auth/csrf-token');
  } catch (e) {
    // Ignoramos si falla, el backend podría haberlo enviado antes
  }

  const res = await apiClient.post<LoginResponse>('/auth/login', { usuario: user, password: pass });
  const role = mapRol(res.data.rol ?? 3);
  return storeSession(res.data, role);
};


// Recuperación de Contraseña
export const requestPasswordReset = async (correo: string) => {
  return apiClient.post('/auth/forgot-password', { correo });
};

export const resetPassword = async (token: string, password: string) => {
  return apiClient.post('/auth/reset-password', { token, password });
};