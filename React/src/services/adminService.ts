import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/admins';
const TECNICO_API_URL = 'http://localhost:3000/api/tecnicos';

export type AdminId = string | number;

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

export const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,// Lo usamos para todas las requests
        },
      }
    : {};
};

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

const storeSession = (data: LoginResponse, role: 'admin' | 'tecnico') => {
  if (data.token) {
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_name', data.nombre ?? '');
    localStorage.setItem('user_role', role);
    console.log('Saved role to localStorage:', role);
  }

  return { ...data, rol: role };
};

const tryLogin = async (url: string, usuario: string, contrasena: string) => {
  const response = await axios.post<LoginResponse>(url, { usuario, contrasena });
  return response.data;
};

export const loginService = async (usuario: string, contrasena: string) => {
  try {
    const tecnicoData = await tryLogin(`${TECNICO_API_URL}/login`, usuario, contrasena);
    console.log('Login tecnico success:', tecnicoData);
    return storeSession(tecnicoData, 'tecnico');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const adminData = await tryLogin(`${API_URL}/login`, usuario, contrasena);
      console.log('Login admin success:', adminData);
      return storeSession(adminData, 'admin');
    }
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_role');
  window.location.href = '/login';
};
axios.interceptors.response.use(
  response => response,
  error => {
    const isLoginRequest =
      axios.isAxiosError(error) &&
      error.config?.url?.endsWith('/login');

    if (!isLoginRequest && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // El token murió o no existe
      localStorage.removeItem('user_token');
      window.location.href = '/login'; // Lo sacamos de la app
    }

    return Promise.reject(error);
  }
);
export const obtenerAdmins = async () => {
  return requestWithFallback(
    () => axios.get<AdminCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<AdminCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerAdminPorId = async (id: AdminId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<AdminRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<AdminRecord>>(`${API_URL}/${id}`, getAuthHeaders())
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

  if (!originalId) {
    return axios.put<AdminMutationResponse>(`${API_URL}/actualizar`, payload, getAuthHeaders());
  }

  return requestWithFallback(
    () => axios.put<AdminMutationResponse>(`${API_URL}/actualizar/${originalId}`, payload, getAuthHeaders()),
    () => axios.put<AdminMutationResponse>(`${API_URL}/${originalId}`, payload, getAuthHeaders())
  );
};

export const eliminarAdmin = async (id: AdminId) => {
  return requestWithFallback(
    () => axios.delete<AdminMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<AdminMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
