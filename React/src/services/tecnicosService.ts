import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/tecnicos';

export type TecnicoId = string | number;

export interface TecnicoPayload {
  ID_TECNICOS: TecnicoId;
  Nombre: string;
  Correo: string;
  TipoDocumento: string;
  Telefono: string;
  usuario: string;
  contrasena?: string;
}

export interface TecnicoRecord extends TecnicoPayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type TecnicoCollectionResponse =
  | ApiResponse<TecnicoRecord[]>
  | { data?: TecnicoRecord[]; tecnicos?: TecnicoRecord[] }
  | TecnicoRecord[];

type TecnicoMutationResponse = ApiResponse<TecnicoRecord | null> | TecnicoRecord | null;
type TecnicoUpdatePayload = TecnicoPayload & {
  ID_TECNICOS_ORIGINAL?: TecnicoId;
};

// tecnicoService.ts
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

export const obtenerTecnicos = async () => {
  return requestWithFallback(
    () => axios.get<TecnicoCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<TecnicoCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerTecnicoPorId = async (id: TecnicoId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<TecnicoRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<TecnicoRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearTecnico = async (datosTecnico: TecnicoPayload) => {
  return requestWithFallback(
    () => axios.post<TecnicoMutationResponse>(`${API_URL}/insertar`, datosTecnico, getAuthHeaders()),
    () => axios.post<TecnicoMutationResponse>(API_URL, datosTecnico, getAuthHeaders())
  );
};

export const actualizarTecnico = async (id: TecnicoId, datosActualizados: TecnicoPayload) => {
  const originalId = String(id ?? '').trim();
  const payload: TecnicoUpdatePayload = {
    ...datosActualizados,
    ID_TECNICOS_ORIGINAL: originalId,
  };

  if (!originalId) {
    return axios.put<TecnicoMutationResponse>(`${API_URL}/actualizar`, payload, getAuthHeaders());
  }

  return requestWithFallback(
    () => axios.put<TecnicoMutationResponse>(`${API_URL}/actualizar/${originalId}`, payload, getAuthHeaders()),
    () => axios.put<TecnicoMutationResponse>(`${API_URL}/${originalId}`, payload, getAuthHeaders())
  );
};

export const eliminarTecnico = async (id: TecnicoId) => {
  return requestWithFallback(
    () => axios.delete<TecnicoMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<TecnicoMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
