import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export interface ProductoPayload {
  ID_PRODUCTOS: string | number;
  ID_CATEGORIA: number | string;
  Marca: string;
  Nombre: string;
  precio_costo: number;
  precio_venta: number;
  Estado?: string;
  stock: number;
  stock_minimo: number;
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
  precio_venta: Number(p.precio_venta),
  precio_costo: Number(p.precio_costo),
  stock: Number(p.stock),
  stock_minimo: Number(p.stock_minimo),
  // Fallbacks por si el backend espera las llaves con otro formato
  Precio_Costo: Number(p.precio_costo),
  precioCosto: Number(p.precio_costo),
  Precio_Venta: Number(p.precio_venta),
  Stock: Number(p.stock),
  Stock_Minimo: Number(p.stock_minimo)
});

export const insertarProducto = (data: ProductoPayload) => productoService.crear(normalizarProducto(data));
export const actualizarProducto = (id: string | number, data: ProductoPayload) =>
  productoService.actualizar(id, normalizarProducto(data));

// El resto usa los métodos heredados automáticamente
export const obtenerProductos = () => productoService.obtenerTodos();
export const eliminarProducto = (id: string | number) => productoService.eliminar(id);
export const habilitarProducto = (id: string | number) =>
  apiClient.put(`/productos/habilitar/${id}`);
