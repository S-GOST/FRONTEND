import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export interface ProductoPayload {
  ID_PRODUCTOS: string | number;
  ID_CATEGORIA: number | string;
  Marca: string;
  Nombre: string;
  Precio: number;
  Estado?: string;
  categoria_nombre?: string; // viene del JOIN en el backend
}
// Al final del archivo, después de las interfaces
export type ProductoRecord = ProductoPayload;   // 👈 Agrega esta línea
// 👉 Sobreescribimos SOLO lo que cambia
const productoService = new BaseApiService<ProductoPayload>({
  baseUrl: '/productos',
  routes: {
    createPrimary: '/insertar',   // 👈 nuevo endpoint para creación
    deletePrimary: '/eliminar/:id',   // 👈 nuevo endpoint para eliminación
    deleteFallback: ''
  }
});

// Normalización automática de números antes de enviar
const normalizarProducto = (p: ProductoPayload) => ({
  ...p,
  ID_CATEGORIA: Number(p.ID_CATEGORIA),
  Precio: Number(p.Precio)
});

export const insertarProducto = (data: ProductoPayload) => productoService.crear(normalizarProducto(data));
export const actualizarProducto = (id: string | number, data: ProductoPayload) =>
  productoService.actualizar(id, normalizarProducto(data));

// El resto usa los métodos heredados automáticamente
export const obtenerProductos = () => productoService.obtenerTodos();
export const eliminarProducto = (id: string | number) => productoService.eliminar(id);
export const habilitarProducto = (id: string | number) =>
  apiClient.put(`/productos/habilitar/${id}`);
