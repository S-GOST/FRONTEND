import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/ordenes_servicio';

export interface OrdenServicioRecord {
  ID_ORDEN_SERVICIO: string;
  ID_CLIENTES: string;
  ID_ADMINISTRADOR?: string;
  ID_TECNICOS?: string;
  ID_MOTOS?: string;
  Fecha_inicio: string;
  Fecha_estimada: string;
  Fecha_fin?: string | null;
  Estado: string;
}

export type OrdenServicioPayload = Omit<OrdenServicioRecord, 'ID_ORDEN_SERVICIO'> & {
  ID_ORDEN_SERVICIO?: string;
};

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type OrdenesCollectionResponse =
  | ApiResponse<OrdenServicioRecord[]>
  | { data?: OrdenServicioRecord[]; ordenes?: OrdenServicioRecord[] }
  | OrdenServicioRecord[];

const getAuthHeaders = () => {
  // const token = localStorage.getItem('user_token');
  // return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return {}; // Temporalmente sin autenticación para desarrollo
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

export const obtenerOrdenes = async () => {
  return requestWithFallback(
    () => axios.get<OrdenesCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<OrdenesCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerOrdenPorId = async (id: string) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<OrdenServicioRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<OrdenServicioRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const actualizarOrden = async (
  id: string,
  data: Partial<Pick<OrdenServicioRecord, 'Estado' | 'Fecha_inicio' | 'Fecha_estimada' | 'Fecha_fin' | 'ID_TECNICOS' | 'ID_MOTOS'>>
) => {
  return requestWithFallback(
    () => axios.put<ApiResponse<OrdenServicioRecord>>(`${API_URL}/actualizar/${id}`, data, getAuthHeaders()),
    () => axios.put<ApiResponse<OrdenServicioRecord>>(`${API_URL}/${id}`, data, getAuthHeaders())
  );
};

export const crearOrden = async (data: OrdenServicioPayload) => {
  return requestWithFallback(
    () => axios.post<ApiResponse<OrdenServicioRecord>>(`${API_URL}/insertar`, data, getAuthHeaders()),
    () => axios.post<ApiResponse<OrdenServicioRecord>>(API_URL, data, getAuthHeaders())
  );
};

export const eliminarOrden = async (id: string) => {
  return requestWithFallback(
    () => axios.delete<ApiResponse<OrdenServicioRecord>>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<ApiResponse<OrdenServicioRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
