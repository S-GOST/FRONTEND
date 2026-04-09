import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/detalles_orden_servicio';

export interface DetalleOrdenServicioRecord {
  ID_DETALLES_ORDEN_SERVICIO: string;
  ID_ORDEN_SERVICIO: string;
  ID_SERVICIOS?: string;
  ID_PRODUCTOS?: string;
  Garantia?: number;
  Estado: string;
  Precio?: number;
}

export type DetalleOrdenServicioPayload = Omit<DetalleOrdenServicioRecord, 'ID_DETALLES_ORDEN_SERVICIO'>;

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type DetalleOrdenesCollectionResponse =
  | ApiResponse<DetalleOrdenServicioRecord[]>
  | { data?: DetalleOrdenServicioRecord[]; detalles?: DetalleOrdenServicioRecord[] }
  | DetalleOrdenServicioRecord[];

const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
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

export const obtenerDetallesOrdenes = async () => {
  return requestWithFallback(
    () => axios.get<DetalleOrdenesCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<DetalleOrdenesCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerDetalleOrdenPorId = async (id: string) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearDetalleOrden = async (data: DetalleOrdenServicioPayload) => {
  return requestWithFallback(
    () => axios.post<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/insertar`, data, getAuthHeaders()),
    () => axios.post<ApiResponse<DetalleOrdenServicioRecord>>(API_URL, data, getAuthHeaders())
  );
};

export const actualizarDetalleOrden = async (id: string, data: DetalleOrdenServicioPayload) => {
  return requestWithFallback(
    () => axios.put<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/actualizar/${id}`, data, getAuthHeaders()),
    () => axios.put<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/${id}`, data, getAuthHeaders())
  );
};

export const eliminarDetalleOrden = async (id: string) => {
  return requestWithFallback(
    () => axios.delete<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<ApiResponse<DetalleOrdenServicioRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
