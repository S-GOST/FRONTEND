import { BaseApiService } from './base.service';

export type InformeId = string;

export interface InformePayload {
  ID_INFORME: InformeId;
  ID_DETALLES_ORDEN_SERVICIO: string;
  ID_ADMINISTRADOR: string;
  ID_TECNICOS?: string | null;
  Descripcion: string;
  Fecha: string; // formato YYYY-MM-DD
  Estado: string;
}

export interface InformeRecord extends InformePayload {}

// 👉 Instancia centralizada que usa las rutas por defecto: /obtener, /insertar, /actualizar/:id, etc.
export const informeService = new BaseApiService<InformePayload>({
  baseUrl: '/informes',
});

// 👉 Exportaciones idénticas para compatibilidad con tus componentes
export const obtenerInformes = () => informeService.obtenerTodos();
export const obtenerInformePorId = (id: string) => informeService.obtenerPorId(id);
export const crearInforme = (datos: InformePayload) => informeService.crear(datos);
export const actualizarInforme = (id: string, datos: InformePayload) => informeService.actualizar(id, datos);
export const eliminarInforme = (id: string) => informeService.eliminar(id);