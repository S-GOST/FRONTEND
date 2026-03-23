import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/admins';

export type AdminId = string | number;

interface LoginResponse {
  token?: string;
  nombre?: string;
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
};

const shouldFallback = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

const requestWithFallback = async <T>(
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

export const loginService = async (usuario: string, contrasena: string) => {
  const response = await axios.post<LoginResponse>(`${API_URL}/login`, { usuario, contrasena });

  if (response.data.token) {
    localStorage.setItem('user_token', response.data.token);
    localStorage.setItem('user_name', response.data.nombre ?? '');
  }

  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_name');
  window.location.href = '/login';
};

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
