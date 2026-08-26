import { BaseApiService } from './base.service';

export interface AdministradorPayload {
  numero_documento: string | number;
  id_tipo_documento: string | number;
  nombre: string;
  correo: string;
  telefono: string;
  usuario: string;
  password?: string;

  // Retrocompatibilidad
  ID_ADMINISTRADOR?: string | number;
  Nombre?: string;
}

export interface AdministradorRecord extends AdministradorPayload {}
export type AdminRecord = AdministradorRecord;



const adminService = new BaseApiService<AdministradorPayload>({
  baseUrl: '/admins',
  routes: {
    deletePrimary: '/eliminar/:id',
    deleteFallback: ''
  }
});

const addCompatibility = (a: any): any => {
  if (!a) return a;
  return {
    ...a,
    ID_ADMINISTRADOR: a.numero_documento,
    Nombre: a.nombre,
  };
};

export const obtenerAdmins = async () => {
  const res = await adminService.obtenerTodos();
  if (res.data) {
    if (Array.isArray(res.data)) {
      res.data = res.data.map(addCompatibility);
    } else if (res.data.data && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(addCompatibility);
    } else if (res.data.admins && Array.isArray(res.data.admins)) {
      res.data.admins = res.data.admins.map(addCompatibility);
    }
  }
  return res;
};



export const insertarAdmin = (data: AdministradorPayload) => adminService.crear(data);
export const actualizarAdmin = (id: string | number, data: AdministradorPayload) => adminService.actualizar(id, data);
export const eliminarAdmin = (id: string | number) => adminService.eliminar(id);
export const habilitarAdmin = (id: string | number) => adminService['http'].put(`/admins/actualizar/${id}`, { estado: 'Activo' });