import { BaseApiService } from './base.service';

export type ComprobanteId = string | number;

export interface ComprobantePayload {
  ID_COMPROBANTE: ComprobanteId;
  ID_INFORME?: string | null;
  ID_CLIENTES: string | number;
  ID_ADMINISTRADOR?: string | null;
  Monto: number;
  Fecha: string;
  Estado_pago: string;
}

export interface ComprobanteRecord extends Required<ComprobantePayload> {}

// 👉 Instancia centralizada que hereda autenticación, fallbacks y CRUD genérico
export const comprobanteService = new BaseApiService<ComprobantePayload>({
  baseUrl: '/comprobantes',
});

// 👉 Exportaciones idénticas para compatibilidad 100% con tus componentes
export const obtenerComprobantes = () => comprobanteService.obtenerTodos();
export const obtenerComprobantePorId = (id: ComprobanteId) => comprobanteService.obtenerPorId(id);
export const crearComprobante = (datos: ComprobantePayload) => comprobanteService.crear(datos);
export const actualizarComprobante = (id: ComprobanteId, datosActualizados: ComprobantePayload) => 
  comprobanteService.actualizar(id, datosActualizados);
export const eliminarComprobante = (id: ComprobanteId) => comprobanteService.eliminar(id);