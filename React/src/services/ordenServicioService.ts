import { BaseApiService } from './base.service';

export interface OrdenServicioRecord {
  ClienteNombre: string;
  ID_ORDEN_SERVICIO: string;
  ID_CLIENTES: string;
  ID_ADMINISTRADOR?: string;
  ID_TECNICOS?: string;
  ID_MOTOS?: string;
  Fecha_inicio: string;
  Fecha_estimada: string;
  Fecha_fin?: string | null;
  Estado: string;
}

export type OrdenServicioPayload = Omit<OrdenServicioRecord, 'ID_ORDEN_SERVICIO'> & {
  ID_ORDEN_SERVICIO?: string;
};

// 👉 Instancia centralizada que hereda autenticación, fallbacks y CRUD genérico
export const ordenServicioService = new BaseApiService<OrdenServicioPayload>({
  baseUrl: '/ordenes_servicio',
});

// 👉 Exportaciones idénticas a tu versión anterior para compatibilidad 100%
export const obtenerOrdenes = () => ordenServicioService.obtenerTodos();
export const obtenerOrdenPorId = (id: string) => ordenServicioService.obtenerPorId(id);
export const crearOrden = (data: OrdenServicioPayload) => ordenServicioService.crear(data);
export const eliminarOrden = (id: string) => ordenServicioService.eliminar(id);

export const actualizarOrden = (
  id: string,
  data: Partial<Pick<OrdenServicioRecord, 'Estado' | 'Fecha_inicio' | 'Fecha_estimada' | 'Fecha_fin' | 'ID_TECNICOS' | 'ID_MOTOS'>>
) => ordenServicioService.actualizar(id, data as OrdenServicioPayload);