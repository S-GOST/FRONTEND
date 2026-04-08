import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/motos';

export type MotoId = string | number;

export interface MotoPayload {
  ID_MOTOS: MotoId;
  ID_CLIENTES: string | number;
  Placa: string;
  Modelo: string;
  Marca: string;
  Recorrido: number;
}

export interface MotoRecord extends MotoPayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type MotoCollectionResponse =
  | ApiResponse<MotoRecord[]>
  | { data?: MotoRecord[]; motos?: MotoRecord[] }
  | MotoRecord[];

type MotoMutationResponse = ApiResponse<MotoRecord | null> | MotoRecord | null;

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

export const obtenerMotos = async () => {
  return requestWithFallback(
    () => axios.get<MotoCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<MotoCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerMotoPorId = async (id: MotoId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<MotoRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<MotoRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearMoto = async (datosMotor: MotoPayload) => {
  return requestWithFallback(
    () => axios.post<MotoMutationResponse>(`${API_URL}/crear`, datosMotor, getAuthHeaders()),
    () => axios.post<MotoMutationResponse>(API_URL, datosMotor, getAuthHeaders())
  );
};

export const actualizarMoto = async (id: MotoId, datosActualizados: MotoPayload) => {
  const originalId = String(id ?? '').trim();

  if (!originalId) {
    return axios.put<MotoMutationResponse>(`${API_URL}/actualizar`, datosActualizados, getAuthHeaders());
  }

  return requestWithFallback(
    () =>
      axios.put<MotoMutationResponse>(
        `${API_URL}/actualizar/${originalId}`,
        datosActualizados,
        getAuthHeaders()
      ),
    () => axios.put<MotoMutationResponse>(`${API_URL}/${originalId}`, datosActualizados, getAuthHeaders())
  );
};

export const eliminarMoto = async (id: MotoId) => {
  return requestWithFallback(
    () => axios.delete<MotoMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<MotoMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
