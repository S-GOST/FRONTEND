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
    data.numero_documento, data.id_usuario, data.id, data.usuario, data.email,
    data.data?.numero_documento, data.data?.id_usuario, data.data?.id,
    data.data?.usuario, data.data?.email
  ];

  let userId = posiblesIds.find(id => id && id !== '');

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

export const clearSession = () => {
  localStorage.clear();
  window.location.replace('/login');
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

  const res = await apiClient.post<LoginResponse>('/auth/login', { usuario: user, password: pass });
  const role = mapRol(res.data.rol ?? 3);
  return storeSession(res.data, role);
};

// Alias para compatibilidad con Login.tsx que intenta loginClienteService como fallback
export const loginClienteService = loginService;