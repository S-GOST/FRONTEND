import { BaseApiService } from './base.service';

export interface HistorialPayload {
  ID_HISTORIAL: string | number;
  ID_ORDEN_SERVICIO?: string | null;
  ID_COMPROBANTE?: string | null;
  ID_INFORME?: string | null;
  ID_TECNICOS?: string | null;
  ID_CLIENTES?: string | null;
  Descripcion: string;
  Fecha_registro?: string;
}

// 👇 ASEGÚRATE DE EXPORTAR ESTA INTERFAZ TAMBIÉN PARA QUE EL COMPONENTE LA ENCUENTRE
export interface HistorialRecord extends Required<HistorialPayload> {}

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
    deletePrimary: '/:id',
    deleteFallback: '/eliminar/:id'
  }
});

// Exportar funciones para usar en los componentes
export const obtenerHistorial = () => historialService.obtenerTodos();
export const obtenerHistorialPorId = (id: string | number) => historialService.obtenerPorId(id);
export const crearHistorial = (data: HistorialPayload) => historialService.crear(data);
export const actualizarHistorial = (id: string | number, data: HistorialPayload) => historialService.actualizar(id, data);
export const eliminarHistorial = (id: string | number) => historialService.eliminar(id);