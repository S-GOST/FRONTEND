import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export interface CategoriaPayload {
  ID_CATEGORIA?: number;
  nombre: string;
  tipo: 'PRODUCTO' | 'SERVICIO';
  descripcion: string;
}

export type CategoriaRecord = CategoriaPayload;

export const categoriaService = new BaseApiService<CategoriaPayload>({
  baseUrl: '/categorias',
  routes: {
    createPrimary: '/insertar',
    deletePrimary: '/eliminar/:id',
    deleteFallback: ''
  }
});

// Funciones exportadas para compatibilidad
export const obtenerCategorias = () => categoriaService.obtenerTodos();
export const obtenerCategoriaPorId = (id: string | number) => categoriaService.obtenerPorId(id);
export const insertarCategoria = (data: CategoriaPayload) => categoriaService.crear(data);
export const actualizarCategoria = (id: string | number, data: CategoriaPayload) => categoriaService.actualizar(id, data);
export const eliminarCategoria = (id: string | number) => categoriaService.eliminar(id);

// Función especial para obtener categorías por tipo
export const obtenerCategoriasPorTipo = async (tipo: 'PRODUCTO' | 'SERVICIO') => {
  return apiClient.get(`/categorias/tipo/${tipo}`);
};
