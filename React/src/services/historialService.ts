import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/historial';

export type HistorialId = string | number;

export interface HistorialPayload {
  ID_HISTORIAL: HistorialId;
  ID_MOTOS: string | number;
  Fecha: string;
  Descripcion: string;
  Diagnostico: string;
  Costo: number;
}

export interface HistorialRecord extends HistorialPayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type HistorialCollectionResponse =
  | ApiResponse<HistorialRecord[]>
  | { data?: HistorialRecord[]; historial?: HistorialRecord[] }
  | HistorialRecord[];

type HistorialMutationResponse = ApiResponse<HistorialRecord | null> | HistorialRecord | null;

const getAuthHeaders = () => {
  // Se mantiene sin autenticación para desarrollo según tu estructura previa
  return {}; 
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

export const obtenerHistorial = async () => {
  return requestWithFallback(
    () => axios.get<HistorialCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<HistorialCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerHistorialPorId = async (id: HistorialId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<HistorialRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<HistorialRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearHistorial = async (datosHistorial: HistorialPayload) => {
  return requestWithFallback(
    () => axios.post<HistorialMutationResponse>(`${API_URL}/insertar`, datosHistorial, getAuthHeaders()),
    () => axios.post<HistorialMutationResponse>(API_URL, datosHistorial, getAuthHeaders())
  );
};

export const actualizarHistorial = async (id: HistorialId, datosActualizados: HistorialPayload) => {
  const originalId = String(id ?? '').trim();

  if (!originalId) {
    return axios.put<HistorialMutationResponse>(`${API_URL}/actualizar`, datosActualizados, getAuthHeaders());
  }

  return requestWithFallback(
    () =>
      axios.put<HistorialMutationResponse>(
        `${API_URL}/actualizar/${originalId}`,
        datosActualizados,
        getAuthHeaders()
      ),
    () => axios.put<HistorialMutationResponse>(`${API_URL}/${originalId}`, datosActualizados, getAuthHeaders())
  );
};

export const eliminarHistorial = async (id: HistorialId) => {
  return requestWithFallback(
    () => axios.delete<HistorialMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<HistorialMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};