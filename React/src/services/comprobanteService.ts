import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export type ComprobanteId = string | number;

interface ComprobantePayload {
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
const comprobanteService = new BaseApiService<ComprobantePayload>({
  baseUrl: '/comprobantes',
  routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' }
});

// 👉 Exportaciones idénticas para compatibilidad 100% con tus componentes
export const obtenerComprobantes = () => comprobanteService.obtenerTodos();

// HU-004.1

export const generarComprobante = async (idInforme: number | string, metodo_pago?: string) => {
  const res = await apiClient.post(`/comprobantes/generar/${idInforme}`, { metodo_pago });
  return res.data;
};

export const obtenerMisComprobantes = async () => {
  const res = await apiClient.get('/comprobantes/mis-comprobantes');
  return res.data;
};

export const pagarComprobante = async (id: ComprobanteId, metodo_pago?: string) => {
  const res = await apiClient.put(`/comprobantes/pagar/${id}`, { metodo_pago });
  return res.data;
};