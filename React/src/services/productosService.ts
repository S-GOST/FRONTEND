import axios, { type AxiosResponse } from 'axios';

const API_URL = 'http://localhost:3000/api/productos';

export type ProductoId = string | number;

export interface ProductoPayload {
  ID_PRODUCTOS: ProductoId;
  Nombre: string;
  Marca: string;
  Categoria: string;
  Garantia: number;
  Cantidad: number;
  Precio: number;
  Estado?: 'Disponibles' | 'Agotados' | 'Próximamente' | string;
}

export type ProductoRecord = ProductoPayload;

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

type ProductoCollectionResponse =
  | ApiResponse<ProductoRecord[]>
  | { data?: ProductoRecord[]; productos?: ProductoRecord[] }
  | ProductoRecord[];

type ProductoMutationResponse =
  | ApiResponse<ProductoRecord | null>
  | ProductoRecord
  | null;

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

export const obtenerProductos = async () => {
  return requestWithFallback(
    () => axios.get<ProductoCollectionResponse>(`${API_URL}/obtener`, getAuthHeaders()),
    () => axios.get<ProductoCollectionResponse>(API_URL, getAuthHeaders())
  );
};

export const crearProducto = async (data: ProductoPayload) => {
  const payload = {
    ...data,
    Garantia: Number(data.Garantia),
    Cantidad: Number(data.Cantidad),
    Precio: Number(data.Precio),
  };

  return requestWithFallback(
    () => axios.post<ProductoMutationResponse>(`${API_URL}/crear`, payload, getAuthHeaders()),
    () => axios.post<ProductoMutationResponse>(API_URL, payload, getAuthHeaders())
  );
};

export const actualizarProducto = async (id: ProductoId, data: ProductoPayload) => {
  const payload = {
    ...data,
    Garantia: Number(data.Garantia),
    Cantidad: Number(data.Cantidad),
    Precio: Number(data.Precio),
  };

  return requestWithFallback(
    () =>
      axios.put<ProductoMutationResponse>(
        `${API_URL}/actualizar/${id}`,
        payload,
        getAuthHeaders()
      ),
    () => axios.put<ProductoMutationResponse>(`${API_URL}/${id}`, payload, getAuthHeaders())
  );
};

export const eliminarProducto = async (id: ProductoId) => {
  return requestWithFallback(
    () => axios.delete<ProductoMutationResponse>(`${API_URL}/eliminar/${id}`, getAuthHeaders()),
    () => axios.delete<ProductoMutationResponse>(`${API_URL}/${id}`, getAuthHeaders())
  );
};

export const obtenerProductoPorId = async (id: ProductoId) => {
  return requestWithFallback(
    () => axios.get<ApiResponse<ProductoRecord>>(`${API_URL}/buscar/${id}`, getAuthHeaders()),
    () => axios.get<ApiResponse<ProductoRecord>>(`${API_URL}/${id}`, getAuthHeaders())
  );
};
