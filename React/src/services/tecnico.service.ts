import { BaseApiService } from './base.service';

export interface TecnicoPayload {
  ID_TECNICOS: string | number;
  Nombre: string;
  Correo: string;
  TipoDocumento: string;
  Telefono: string;
  usuario: string;
  contrasena?: string;
}
export interface TecnicoRecord extends TecnicoPayload {}

export const tecnicoService = new BaseApiService<TecnicoPayload>({ baseUrl: '/tecnicos' });

export const obtenerTecnicos = () => tecnicoService.obtenerTodos();
export const obtenerTecnicoPorId = (id: string | number) => tecnicoService.obtenerPorId(id);
export const crearTecnico = (data: TecnicoPayload) => tecnicoService.crear(data);
export const actualizarTecnico = (id: string | number, data: TecnicoPayload) => tecnicoService.actualizar(id, data);
export const eliminarTecnico = (id: string | number) => tecnicoService.eliminar(id);