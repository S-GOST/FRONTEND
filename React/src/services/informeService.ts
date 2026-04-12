import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/informes';

export type InformeId = string | number;

export interface InformePayload {
  ID_INFORMES: InformeId;
  ID_MOTOS: string | number;
  Fecha: string;
  Descripcion: string;
  Diagnostico: string;
  Costo: number;
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

const getAuthHeaders = () => {
  // Temporalmente sin autenticación para desarrollo, igual que en motosService
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

export const obtenerInformes = async () => {
  return requestWithFallback(
    () => axios.get<InformeCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<InformeCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerInformePorId = async (id: InformeId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<InformeRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<InformeRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearInforme = async (datosInforme: InformePayload) => {
  return requestWithFallback(
    () => axios.post<InformeMutationResponse>(`${API_URL}/insertar`, datosInforme, getAuthHeaders()),
    () => axios.post<InformeMutationResponse>(API_URL, datosInforme, getAuthHeaders())
  );
};

export const actualizarInforme = async (id: InformeId, datosActualizados: InformePayload) => {
  const originalId = String(id ?? '').trim();

  if (!originalId) {
    return axios.put<InformeMutationResponse>(`${API_URL}/actualizar`, datosActualizados, getAuthHeaders());
  }

  return requestWithFallback(
    () =>
      axios.put<InformeMutationResponse>(
        `${API_URL}/actualizar/${originalId}`,
        datosActualizados,
        getAuthHeaders()
      ),
    () => axios.put<InformeMutationResponse>(`${API_URL}/${originalId}`, datosActualizados, getAuthHeaders())
  );
};

export const eliminarInforme = async (id: InformeId) => {
  return requestWithFallback(
    () => axios.delete<InformeMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<InformeMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};