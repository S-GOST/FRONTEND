import { BaseApiService } from './base.service';

export interface ServicioPayload {
  ID_SERVICIOS: string | number;
  Nombre: string;
  Categoria: string;
  Garantia: number;
  Estado: 'Disponible' | 'No disponible';
  Precio: number;
}

export interface ServicioRecord extends ServicioPayload {}

// 👉 Instancia centralizada que hereda toda la lógica de la API Base
export const servicioService = new BaseApiService<ServicioPayload>({
  baseUrl: '/servicios',
});

// 👉 Funciones exportadas con los mismos nombres para compatibilidad total
export const obtenerServicios = () => servicioService.obtenerTodos();
export const obtenerServicioPorId = (id: string | number) => servicioService.obtenerPorId(id);
export const crearServicio = (data: ServicioPayload) => servicioService.crear(data);
export const actualizarServicio = (id: string | number, data: ServicioPayload) => servicioService.actualizar(id, data);
export const eliminarServicio = (id: string | number) => servicioService.eliminar(id);