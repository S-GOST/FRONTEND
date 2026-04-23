import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/admins';
const TECNICO_API_URL = 'http://localhost:3000/api/tecnicos';

export type AdminId = string | number;

// --- Interfaces ---
interface LoginResponse {
  token?: string;
  nombre?: string;
  rol?: 'admin' | 'tecnico';
}

export interface AdminPayload {
  ID_ADMINISTRADOR: AdminId;
  Nombre: string;
  Correo: string;
  TipoDocumento: string;
  Telefono: string;
  usuario: string;
  contrasena?: string;
}

export interface AdminRecord extends AdminPayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type AdminCollectionResponse =
  | ApiResponse<AdminRecord[]>
  | { data?: AdminRecord[]; admins?: AdminRecord[] }
  | AdminRecord[];

type AdminMutationResponse = ApiResponse<AdminRecord | null> | AdminRecord | null;

type AdminUpdatePayload = AdminPayload & {
  ID_ADMINISTRADOR_ORIGINAL?: AdminId;
};

// --- Helpers ---

export const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
};

// Interceptor corregido: Solo redirige si NO es una petición de login 
// y el error es de autenticación real.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');

    if (!isLoginRequest && error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        console.warn("Sesión inválida o expirada. Redirigiendo...");
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        
        // Evitar bucle de redirección si ya estamos en login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const shouldFallback = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

export const requestWithFallback = async <T>(
  primaryRequest: () => Promise<AxiosResponse<T>>,
  fallbackRequest: () => Promise<AxiosResponse<T>>
) => {
  try {
    return await primaryRequest();
  } catch (error) {
    if (shouldFallback(error)) {
      return await fallbackRequest();
    }
    throw error;
  }
};

// --- Servicios de Sesión ---

const storeSession = (data: LoginResponse, role: 'admin' | 'tecnico') => {
  if (data.token) {
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_name', data.nombre ?? '');
    localStorage.setItem('user_role', role);
  }
  return { ...data, rol: role };
};

export const loginService = async (usuario: string, contrasena: string) => {
  try {
    // Intento 1: Técnico
    const tecnicoRes = await axios.post<LoginResponse>(`${TECNICO_API_URL}/login`, { usuario, contrasena });
    return storeSession(tecnicoRes.data, 'tecnico');
  } catch (error) {
    // Intento 2: Admin (si el anterior falló con 401)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const adminRes = await axios.post<LoginResponse>(`${API_URL}/login`, { usuario, contrasena });
      return storeSession(adminRes.data, 'admin');
    }
    throw error;
  }
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

// --- CRUD de Administradores ---

export const obtenerAdmins = async () => {
  return requestWithFallback(
    () => axios.get<AdminCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<AdminCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerAdminPorId = async (id: AdminId) => {
  const cleanId = String(id).trim();
  return requestWithFallback(
    () => axios.get<ApiResponse<AdminRecord>>(`${API_URL}/buscar/${cleanId}`, getAuthHeaders()),
    () => axios.get<ApiResponse<AdminRecord>>(`${API_URL}/${cleanId}`, getAuthHeaders())
  );
};

export const crearAdmin = async (datosAdmin: AdminPayload) => {
  return requestWithFallback(
    () => axios.post<AdminMutationResponse>(`${API_URL}/insertar`, datosAdmin, getAuthHeaders()),
    () => axios.post<AdminMutationResponse>(API_URL, datosAdmin, getAuthHeaders())
  );
};

export const actualizarAdmin = async (id: AdminId, datosActualizados: AdminPayload) => {
  const originalId = String(id ?? '').trim();
  const payload: AdminUpdatePayload = {
    ...datosActualizados,
    ID_ADMINISTRADOR_ORIGINAL: originalId,
  };

  return requestWithFallback(
    () => axios.put<AdminMutationResponse>(`${API_URL}/actualizar/${originalId}`, payload, getAuthHeaders()),
    () => axios.put<AdminMutationResponse>(`${API_URL}/${originalId}`, payload, getAuthHeaders())
  );
};

export const eliminarAdmin = async (id: AdminId) => {
  const cleanId = String(id).trim();
  return requestWithFallback(
    () => axios.delete<AdminMutationResponse>(`${API_URL}/eliminar/${cleanId}`, getAuthHeaders()),
    () => axios.delete<AdminMutationResponse>(`${API_URL}/${cleanId}`, getAuthHeaders())
  );
};