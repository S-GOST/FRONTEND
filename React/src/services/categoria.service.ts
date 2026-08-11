import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export interface CategoriaPayload {
  ID_CATEGORIA?: number;
  nombre?: string;
  tipo?: string;
  descripcion?: string | null;
  estado?: string;
}

const categoriaService = new BaseApiService<CategoriaPayload>({
  baseUrl: '/categorias',
  routes: {
    createPrimary: '/insertar',
    deletePrimary: '/eliminar/:id',
    deleteFallback: ''
  }
});

// Funciones exportadas para compatibilidad
export const obtenerCategorias = () => categoriaService.obtenerTodos();

export const insertarCategoria = (data: CategoriaPayload) => categoriaService.crear(data);
export const actualizarCategoria = (id: string | number, data: CategoriaPayload) => categoriaService.actualizar(id, data);
export const eliminarCategoria = (id: string | number, force?: boolean) => 
  apiClient.delete(`/categorias/eliminar/${id}${force ? '?force=true' : ''}`);
export const habilitarCategoria = (id: string | number) => 
  apiClient.put(`/categorias/habilitar/${id}`);

// Función especial para obtener categorías por tipo
export const obtenerCategoriasPorTipo = async (tipo: 'PRODUCTO' | 'SERVICIO') => {
  return apiClient.get(`/categorias/tipo/${tipo}`);
};
