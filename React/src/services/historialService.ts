// historialService.ts
import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/historial';

export type HistorialId = string | number;

export interface HistorialPayload {
  ID_HISTORIAL: HistorialId;            // Obligatorio (se envía siempre)
  ID_ORDEN_SERVICIO?: string | null;
  ID_COMPROBANTE?: string | null;
  ID_INFORME?: string | null;
  ID_TECNICOS?: string | null;
  ID_CLIENTES?: string | null;
  Descripcion: string;                  // ← sin acento
  Fecha_registro?: string;
}

export interface HistorialRecord extends Required<HistorialPayload> {}

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

// Obtener todos (ruta principal)
export const obtenerHistorial = async () => {
  return requestWithFallback(
    () => axios.get<HistorialCollectionResponse>(API_URL, getAuthHeaders()),
    () => axios.get<HistorialCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()) // fallback
  );
};

// Obtener por ID (ruta con /:id)
export const obtenerHistorialPorId = async (id: HistorialId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<HistorialRecord>>(`${API_URL}/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<HistorialRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders())
  );
};

// Crear (POST a la raíz)
export const crearHistorial = async (datosHistorial: HistorialPayload) => {
  return requestWithFallback(
    () => axios.post<HistorialMutationResponse>(API_URL, datosHistorial, getAuthHeaders()),
    () => axios.post<HistorialMutationResponse>(`${API_URL}/insertar`, datosHistorial, getAuthHeaders())
  );
};

// Actualizar (PUT a /:id)
export const actualizarHistorial = async (id: HistorialId, datosActualizados: HistorialPayload) => {
  const originalId = String(id ?? '').trim();
  return requestWithFallback(
    () => axios.put<HistorialMutationResponse>(`${API_URL}/${originalId}`, datosActualizados, getAuthHeaders()),
    () => axios.put<HistorialMutationResponse>(`${API_URL}/actualizar/${originalId}`, datosActualizados, getAuthHeaders())
  );
};

// Eliminar (DELETE a /:id)
export const eliminarHistorial = async (id: HistorialId) => {
  return requestWithFallback(
    () => axios.delete<HistorialMutationResponse>(`${API_URL}/${id}`, getAuthHeaders()),
    () => axios.delete<HistorialMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders())
  );
};