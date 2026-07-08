import { BaseApiService } from './base.service';

export interface DetalleOrdenServicioRecord {
  ID_DETALLES_ORDEN_SERVICIO: number;
  ID_ORDEN_SERVICIO: number | string;
  ID_SERVICIOS?: number | string;
  ID_PRODUCTOS?: number | string;
  Garantia?: number | string;
  Estado: string;
  Precio?: number | string;
}

export type DetalleOrdenServicioPayload = Omit<DetalleOrdenServicioRecord, 'ID_DETALLES_ORDEN_SERVICIO'>;

// 👉 Instancia centralizada que hereda autenticación, fallbacks y CRUD genérico
export const detalleOrdenServicioService = new BaseApiService<DetalleOrdenServicioPayload>({
  baseUrl: '/detalles_orden_servicio',
  routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' }
});

// 👉 Exportaciones idénticas para compatibilidad 100% con tus componentes
export const obtenerDetallesOrdenes = () => detalleOrdenServicioService.obtenerTodos();
export const obtenerDetalleOrdenPorId = (id: number) => detalleOrdenServicioService.obtenerPorId(id);
export const insertarDetalleOrden = (data: DetalleOrdenServicioPayload) => detalleOrdenServicioService.crear(data);
export const actualizarDetalleOrden = (id: number, data: DetalleOrdenServicioPayload) => detalleOrdenServicioService.actualizar(id, data);
export const eliminarDetalleOrden = (id: number) => detalleOrdenServicioService.eliminar(id);