import { BaseApiService } from './base.service';

export interface OrdenServicioRecord {
  ClienteNombre: string;
  ID_ORDEN_SERVICIO: string;
  ID_CLIENTES: string;
  ID_ADMINISTRADOR?: string;
  ID_TECNICOS?: string;
  ID_MOTOS?: string;
  Fecha_inicio: string;
  Fecha_estimada?: string | null;
  Fecha_fin?: string | null;
  Estado: string;
  total?: number | string;
  observaciones?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detalles?: any[];
}

export type OrdenServicioPayload = Omit<OrdenServicioRecord, 'ID_ORDEN_SERVICIO'> & {
  ID_ORDEN_SERVICIO?: string;
};

// 👉 Instancia centralizada que hereda autenticación, fallbacks y CRUD genérico
const ordenServicioService = new BaseApiService<OrdenServicioPayload>({
  baseUrl: '/ordenes_servicio',
  routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' }
});

// 👉 Exportaciones idénticas a tu versión anterior para compatibilidad 100%
export const obtenerOrdenes = () => ordenServicioService.obtenerTodos();

export const insertarOrden = (data: OrdenServicioPayload) => ordenServicioService.crear(data);
export const eliminarOrden = (id: string) => ordenServicioService.eliminar(id);

export const actualizarOrden = (
  id: string,
  data: Partial<Pick<OrdenServicioRecord, 'Estado' | 'Fecha_inicio' | 'Fecha_estimada' | 'Fecha_fin' | 'ID_TECNICOS' | 'ID_MOTOS'>>
) => ordenServicioService.actualizar(id, data as OrdenServicioPayload);

// Obtener solo las órdenes del cliente autenticado
export const obtenerMisOrdenes = () => {
  return ordenServicioService['http'].get('/ordenes_servicio/mis-ordenes');
};

export const obtenerDetallesPorOrden = (idOrden: string | number) => {
  return ordenServicioService['http'].get(`/detalles_orden_servicio/por_orden/${idOrden}`);
};