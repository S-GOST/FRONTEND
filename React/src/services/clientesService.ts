import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/clientes';

export type ClienteId = string | number;

export interface ClientePayload {
  ID_CLIENTES: ClienteId;
  Ubicacion: string;
  Nombre: string;
  usuario: string;
  contrasena?: string;
  TipoDocumento: string;
  Correo: string;
  Telefono: string;
}

export interface ClienteRecord extends ClientePayload {}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type ClienteCollectionResponse =
  | ApiResponse<ClienteRecord[]>
  | { data?: ClienteRecord[]; clientes?: ClienteRecord[] }
  | ClienteRecord[];

type ClienteMutationResponse = ApiResponse<ClienteRecord | null> | ClienteRecord | null;

type ClienteUpdatePayload = ClientePayload & {
  ID_CLIENTES_ORIGINAL?: ClienteId;
};

// clienteService.ts
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

export const obtenerClientes = async () => {
  return requestWithFallback(
    () => axios.get<ClienteCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<ClienteCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const obtenerClientePorId = async (id: ClienteId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<ClienteRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<ClienteRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const crearCliente = async (datosCliente: ClientePayload) => {
  return requestWithFallback(
    () => axios.post<ClienteMutationResponse>(`${API_URL}/insertar`, datosCliente, getAuthHeaders()),
    () => axios.post<ClienteMutationResponse>(API_URL, datosCliente, getAuthHeaders())
  );
};

export const actualizarCliente = async (id: ClienteId, datosActualizados: ClientePayload) => {
  const originalId = String(id ?? '').trim();
  const payload: ClienteUpdatePayload = {
    ...datosActualizados,
    ID_CLIENTES_ORIGINAL: originalId,
  };

  if (!originalId) {
    return axios.put<ClienteMutationResponse>(`${API_URL}/actualizar`, payload, getAuthHeaders());
  }

  return requestWithFallback(
    () => axios.put<ClienteMutationResponse>(`${API_URL}/actualizar/${originalId}`, payload, getAuthHeaders()),
    () => axios.put<ClienteMutationResponse>(`${API_URL}/${originalId}`, payload, getAuthHeaders())
  );
};

export const eliminarCliente = async (id: ClienteId) => {
  return requestWithFallback(
    () => axios.delete<ClienteMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<ClienteMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};