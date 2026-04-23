import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/informes'; // Ajusta si tu backend usa otra ruta

export type InformeId = string;

export interface InformePayload {
  ID_INFORME: InformeId;
  ID_DETALLES_ORDEN_SERVICIO: string;
  ID_ADMINISTRADOR: string;
  ID_TECNICOS?: string | null;
  Descripcion: string;
  Fecha: string;   // formato YYYY-MM-DD
  Estado: string;
}

export interface InformeRecord extends InformePayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type InformeCollectionResponse =
  | ApiResponse<InformeRecord[]>
  | { data?: InformeRecord[]; informes?: InformeRecord[] }
  | InformeRecord[];

type InformeMutationResponse = ApiResponse<InformeRecord | null> | InformeRecord | null;

// Obtener token de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');
  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
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

// Obtener todos los informes
export const obtenerInformes = async () => {
  return requestWithFallback(
    () => axios.get<InformeCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<InformeCollectionResponse>(API_URL, getAuthHeaders())
  );
};

// Obtener un informe por ID
export const obtenerInformePorId = async (id: InformeId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<InformeRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<InformeRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

// Crear nuevo informe
export const crearInforme = async (datosInforme: InformePayload) => {
  return requestWithFallback(
    () => axios.post<InformeMutationResponse>(`${API_URL}/insertar`, datosInforme, getAuthHeaders()),
    () => axios.post<InformeMutationResponse>(API_URL, datosInforme, getAuthHeaders())
  );
};

// Actualizar informe
export const actualizarInforme = async (id: InformeId, datosActualizados: InformePayload) => {
  const originalId = String(id ?? '').trim();
  return requestWithFallback(
    () => axios.put<InformeMutationResponse>(`${API_URL}/actualizar/${originalId}`, datosActualizados, getAuthHeaders()),
    () => axios.put<InformeMutationResponse>(`${API_URL}/${originalId}`, datosActualizados, getAuthHeaders())
  );
};

// Eliminar informe
export const eliminarInforme = async (id: InformeId) => {
  return requestWithFallback(
    () => axios.delete<InformeMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<InformeMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};