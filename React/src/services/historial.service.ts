import { BaseApiService } from './base.service';

export interface HistorialPayload {
  id_historial?: string | number;
  id_usuario: string | number;
  tabla_afectada: string;
  id_registro: string | number;
  accion: string;
  descripcion: string;
  fecha_registro?: string;
}

// 👇 ASEGÚRATE DE EXPORTAR ESTA INTERFAZ TAMBIÉN PARA QUE EL COMPONENTE LA ENCUENTRE
export interface HistorialRecord extends HistorialPayload {
  id_historial: number;
}

// Instanciar la API Base (ya no es abstracta, así que funciona 'new')
export const historialService = new BaseApiService<HistorialPayload>({
  baseUrl: '/historial',
  routes: {
    listPrimary: '',
    listFallback: '/obtener',
    getByIdPrimary: '/:id',
    getByIdFallback: '/buscar/:id',
    createPrimary: '',
    createFallback: '/insertar',
    updatePrimary: '/:id',
    updateFallback: '/actualizar/:id',
    deletePrimary: '/eliminar/:id',
    deleteFallback: ''
  }
});

// Exportar funciones para usar en los componentes
export const obtenerHistorial = () => historialService.obtenerTodos();
export const obtenerHistorialPorId = (id: string | number) => historialService.obtenerPorId(id);
export const insertarHistorial = (data: HistorialPayload) => historialService.crear(data);
export const actualizarHistorial = (id: string | number, data: HistorialPayload) => historialService.actualizar(id, data);
export const eliminarHistorial = (id: string | number) => historialService.eliminar(id);

import apiClient from '../config/axios';
export const obtenerMiHistorial = async () => {
  const res = await apiClient.get('/historial/mi-historial');
  return res.data;
};