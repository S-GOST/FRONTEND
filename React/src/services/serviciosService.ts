import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/servicios';

export type ServicioId = string | number;

export interface ServicioPayload {
  ID_SERVICIOS: ServicioId;
  Nombre: string;
  Categoria: string;
  Garantia: string;
  Estado: 'Activo' | 'Inactivo' | string;
  Precio: number | string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type ServicioCollectionResponse =
  | ApiResponse<ServicioPayload[]>
  | { data?: ServicioPayload[]; servicios?: ServicioPayload[] }
  | ServicioPayload[];

type ServicioMutationResponse = ApiResponse<ServicioPayload | null> | ServicioPayload | null;

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

export const obtenerServicios = async () => {
  return requestWithFallback(
    () => axios.get<ServicioCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<ServicioCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const crearServicio = async (data: ServicioPayload) => {
  return requestWithFallback(
    () => axios.post<ServicioMutationResponse>(`${API_URL}/insertar`, data, getAuthHeaders()),
    () => axios.post<ServicioMutationResponse>(API_URL, data, getAuthHeaders())
  );
};

export const actualizarServicio = async (
  id: ServicioId,
  data: ServicioPayload
) => {
  return requestWithFallback(
    () => axios.put<ServicioMutationResponse>(`${API_URL}/actualizar/${id}`, data, getAuthHeaders()),
    () => axios.put<ServicioMutationResponse>(`${API_URL}/${id}`, data, getAuthHeaders())
  );
};

export const eliminarServicio = async (id: ServicioId) => {
  return requestWithFallback(
    () => axios.delete<ServicioMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<ServicioMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const obtenerServicioPorId = async (id: ServicioId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<ServicioPayload>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<ServicioPayload>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
