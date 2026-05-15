import apiClient from '../config/axios';

export interface LoginResponse {
  token?: string;
  nombre?: string;
  rol?: 'admin' | 'tecnico' | 'cliente';
  [key: string]: any;
}

const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const storeSession = (data: LoginResponse, role: 'admin' | 'tecnico' | 'cliente') => {
  if (!data.token) return data;

  localStorage.setItem('user_token', data.token);
  localStorage.setItem('user_name', data.nombre ?? 'Usuario');
  localStorage.setItem('user_role', role);

  const posiblesIds = [
    data.id, data.ID_CLIENTES, data.usuario, data.email,
    data.data?.id, data.data?.ID_CLIENTES,
    data.data?.usuario, data.data?.email
  ];

  let userId = posiblesIds.find(id => id && id !== '');

  if (userId) {
    localStorage.setItem('user_id', String(userId));
    console.log('✅ [AUTH] user_id guardado:', userId);
  } else if (data.token) {
    const payload = decodeJwt(data.token);
    userId = payload?.id || payload?.sub || payload?.usuario || payload?.ID_CLIENTES;
    
    if (userId) {
      localStorage.setItem('user_id', String(userId));
      console.log('🔑 [AUTH] user_id extraído del JWT:', userId);
    } else {
      console.error('❌ [AUTH] El backend no envió ID. Respuesta completa:', data);
    }
  }

  return { ...data, rol: role };
};

export const clearSession = () => {
  localStorage.clear();
  window.location.replace('/login');
};

// 🚀 SERVICIO UNIFICADO DE LOGIN
export const loginService = async (usuario: string, contrasena: string) => {
  // 1. Limpieza crítica para evitar espacios invisibles
  const user = usuario.trim();
  const pass = contrasena.trim();

  try {
    // Intento 1: Técnicos
    const resTec = await apiClient.post<LoginResponse>('/tecnicos/login', { usuario: user, contrasena: pass });
    return storeSession(resTec.data, 'tecnico');
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Intento 2: Admins (solo si el error fue credenciales inválidas)
      const resAdm = await apiClient.post<LoginResponse>('/admins/login', { usuario: user, contrasena: pass });
      return storeSession(resAdm.data, 'admin');
    }
    // Si no es 401 (ej: error de red, 500, etc.), lanzamos el error original
    throw error;
  }
};

export const loginClienteService = async (usuario: string, contrasena: string) => {
  const user = usuario.trim();
  const pass = contrasena.trim();
  
  const res = await apiClient.post<LoginResponse>('/clientes/login', { usuario: user, contrasena: pass });
  return storeSession(res.data, 'cliente');
};