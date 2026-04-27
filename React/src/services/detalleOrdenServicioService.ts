import { BaseApiService } from './base.service';

export interface DetalleOrdenServicioRecord {
  ID_DETALLES_ORDEN_SERVICIO: string;
  ID_ORDEN_SERVICIO: string;
  ID_SERVICIOS?: string;
  ID_PRODUCTOS?: string;
  Garantia?: number;
  Estado: string;
  Precio?: number;
}

export type DetalleOrdenServicioPayload = Omit<DetalleOrdenServicioRecord, 'ID_DETALLES_ORDEN_SERVICIO'>;

// 👉 Instancia centralizada que hereda autenticación, fallbacks y CRUD genérico
export const detalleOrdenServicioService = new BaseApiService<DetalleOrdenServicioPayload>({
  baseUrl: '/detalles_orden_servicio',
});

// 👉 Exportaciones idénticas para compatibilidad 100% con tus componentes
export const obtenerDetallesOrdenes = () => detalleOrdenServicioService.obtenerTodos();
export const obtenerDetalleOrdenPorId = (id: string) => detalleOrdenServicioService.obtenerPorId(id);
export const crearDetalleOrden = (data: DetalleOrdenServicioPayload) => detalleOrdenServicioService.crear(data);
export const actualizarDetalleOrden = (id: string, data: DetalleOrdenServicioPayload) => detalleOrdenServicioService.actualizar(id, data);
export const eliminarDetalleOrden = (id: string) => detalleOrdenServicioService.eliminar(id);