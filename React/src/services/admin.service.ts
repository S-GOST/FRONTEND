import { BaseApiService } from './base.service';

export interface AdminPayload {
  ID_ADMINISTRADOR: string | number;
  Nombre: string;
  Correo: string;
  TipoDocumento: string;
  Telefono: string;
  usuario: string;
  contrasena?: string;
}
export interface AdminRecord extends AdminPayload {}

export const adminService = new BaseApiService<AdminPayload>({ baseUrl: '/admins' });

export const obtenerAdmins = () => adminService.obtenerTodos();
export const obtenerAdminPorId = (id: string | number) => adminService.obtenerPorId(id);
export const crearAdmin = (data: AdminPayload) => adminService.crear(data);
export const actualizarAdmin = (id: string | number, data: AdminPayload) => adminService.actualizar(id, data);
export const eliminarAdmin = (id: string | number) => adminService.eliminar(id);