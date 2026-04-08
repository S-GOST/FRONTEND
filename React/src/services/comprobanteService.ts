import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/comprobantes';

export type ComprobanteId = string | number;

// Interfaz para los datos que se envían y reciben
export interface ComprobantePayload {
  ID_COMPROBANTE: ComprobanteId;
  Fecha: string;
  Valor_Total: number;
  ID_CLIENTE: string | number;
  ID_MOTOS?: string | number;
  ID_SERVICIOS?: string | number;
  Estado: string;
}

export interface ComprobanteRecord extends ComprobantePayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

// Tipos para las respuestas de la API
type ComprobanteCollectionResponse =
  | ApiResponse<ComprobanteRecord[]>
  | { data?: ComprobanteRecord[]; comprobantes?: ComprobanteRecord[] }
  | ComprobanteRecord[];

type ComprobanteMutationResponse = ApiResponse<ComprobanteRecord | null> | ComprobanteRecord | null;

// Configuración de cabeceras con Token
const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// Lógica de fallback para rutas (si falla /obtener, intenta en la raíz /)
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

/**
 * SERVICIOS CRUD
 */

export const obtenerComprobantes = async () => {
  return requestWithFallback(
    () => axios.get<ComprobanteCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<ComprobanteCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerComprobantePorId = async (id: ComprobanteId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<ComprobanteRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<ComprobanteRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearComprobante = async (datos: ComprobantePayload) => {
  return requestWithFallback(
    () => axios.post<ComprobanteMutationResponse>(`${API_URL}/crear`, datos, getAuthHeaders()),
    () => axios.post<ComprobanteMutationResponse>(API_URL, datos, getAuthHeaders())
  );
};

export const actualizarComprobante = async (id: ComprobanteId, datosActualizados: ComprobantePayload) => {
  const originalId = String(id ?? '').trim();

  if (!originalId) {
    return axios.put<ComprobanteMutationResponse>(`${API_URL}/actualizar`, datosActualizados, getAuthHeaders());
  }

  return requestWithFallback(
    () =>
      axios.put<ComprobanteMutationResponse>(
        `${API_URL}/actualizar/${originalId}`,
        datosActualizados,
        getAuthHeaders()
      ),
    () => axios.put<ComprobanteMutationResponse>(`${API_URL}/${originalId}`, datosActualizados, getAuthHeaders())
  );
};

export const eliminarComprobante = async (id: ComprobanteId) => {
  return requestWithFallback(
    () => axios.delete<ComprobanteMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<ComprobanteMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};