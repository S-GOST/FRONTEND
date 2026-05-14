import { BaseApiService } from './base.service';

export interface ProductoPayload {
  ID_PRODUCTOS: string | number;
  Nombre: string;
  Marca: string;
  Categoria: string;
  Garantia: number;
  Cantidad: number;
  Precio: number;
  Estado?: string;
}
// Al final del archivo, después de las interfaces
export type ProductoRecord = ProductoPayload;   // 👈 Agrega esta línea
// 👉 Sobreescribimos SOLO lo que cambia
export const productoService = new BaseApiService<ProductoPayload>({
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
  Garantia: Number(p.Garantia),
  Cantidad: Number(p.Cantidad),
  Precio: Number(p.Precio)
});

export const insertarProducto = (data: ProductoPayload) => productoService.crear(normalizarProducto(data));
export const actualizarProducto = (id: string | number, data: ProductoPayload) => 
  productoService.actualizar(id, normalizarProducto(data));

// El resto usa los métodos heredados automáticamente
export const obtenerProductos = () => productoService.obtenerTodos();
export const eliminarProducto = (id: string | number) => productoService.eliminar(id);
