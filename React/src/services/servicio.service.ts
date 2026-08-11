import { BaseApiService } from './base.service';
import apiClient from '../config/axios';

export interface ServicioPayload {
  ID_SERVICIOS: string | number;
  ID_CATEGORIA: number | string;
  Nombre: string;
  Precio: number;
  Estado: 'Disponible' | 'No disponible';
  categoria_nombre?: string; // viene del JOIN en el backend
}

export interface ServicioRecord extends ServicioPayload {}

// 👉 Instancia centralizada que hereda toda la lógica de la API Base
export const servicioService = new BaseApiService<ServicioPayload>({
  baseUrl: '/servicios',
  routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' }
});

// 👉 Funciones exportadas con los mismos nombres para compatibilidad total
export const obtenerServicios = () => servicioService.obtenerTodos();
export const obtenerServicioPorId = (id: string | number) => servicioService.obtenerPorId(id);
export const insertarServicio = (data: ServicioPayload) => servicioService.crear(data);
export const actualizarServicio = (id: string | number, data: ServicioPayload) => servicioService.actualizar(id, data);
export const eliminarServicio = (id: string | number) => servicioService.eliminar(id);
export const habilitarServicio = (id: string | number) => 
  apiClient.put(`/servicios/habilitar/${id}`);