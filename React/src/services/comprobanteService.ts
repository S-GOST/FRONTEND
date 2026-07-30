import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export type ComprobanteId = string | number;

export interface ComprobantePayload {
  id_comprobante?: ComprobanteId;
  id_orden: string | number;
  numero_comprobante?: string;
  fecha?: string;
  subtotal: number;
  total_pagar: number;
  metodo_pago: string;
  estado: string;
}

export interface ComprobanteRecord extends ComprobantePayload {
  id_comprobante: ComprobanteId;
  numero_comprobante: string;
  fecha: string;
}

// 👉 Instancia centralizada que hereda autenticación, fallbacks y CRUD genérico
export const comprobanteService = new BaseApiService<ComprobantePayload>({
  baseUrl: '/comprobantes',
  routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' }
});

// 👉 Exportaciones idénticas para compatibilidad 100% con tus componentes
export const obtenerComprobantes = () => comprobanteService.obtenerTodos();
export const obtenerComprobantePorId = (id: ComprobanteId) => comprobanteService.obtenerPorId(id);
export const insertarComprobante = (datos: ComprobantePayload) => comprobanteService.crear(datos);
export const actualizarComprobante = (id: ComprobanteId, datosActualizados: ComprobantePayload) => 
  comprobanteService.actualizar(id, datosActualizados);
export const eliminarComprobante = (id: ComprobanteId) => comprobanteService.eliminar(id);

// HU-004.1

export const generarComprobante = async (idInforme: number | string, metodo_pago?: string) => {
  const res = await apiClient.post(`/comprobantes/generar/${idInforme}`, { metodo_pago });
  return res.data;
};

export const obtenerMisComprobantes = async () => {
  const res = await apiClient.get('/comprobantes/mis-comprobantes');
  return res.data;
};

export const pagarComprobante = async (id: ComprobanteId) => {
  const res = await apiClient.put(`/comprobantes/pagar/${id}`);
  return res.data;
};