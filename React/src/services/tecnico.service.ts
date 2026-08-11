import { BaseApiService } from './base.service';

export interface TecnicoPayload {
  numero_documento: string | number;
  id_tipo_documento: number | string;
  nombre: string;
  usuario: string;
  password?: string;
  correo: string;
  telefono: string;

  // Retrocompatibilidad
  ID_TECNICOS?: string | number;
  Nombre?: string;
}

export type TecnicoRecord = TecnicoPayload;

const tecnicoService = new BaseApiService<TecnicoPayload>({
  baseUrl: '/tecnicos',
});

const addCompatibility = (t: any): any => {
  if (!t) return t;
  return {
    ...t,
    ID_TECNICOS: t.id_usuario ? String(t.id_usuario) : String(t.numero_documento),
    Nombre: t.nombre,
  };
};

export const obtenerTecnicos = async () => {
  const res = await tecnicoService.obtenerTodos();
  if (res.data) {
    if (Array.isArray(res.data)) {
      res.data = res.data.map(addCompatibility);
    } else if (res.data.data && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(addCompatibility);
    } else if (res.data.tecnicos && Array.isArray(res.data.tecnicos)) {
      res.data.tecnicos = res.data.tecnicos.map(addCompatibility);
    }
  }
  return res;
};



export const insertarTecnico = (datos: TecnicoPayload) => tecnicoService.crear(datos);
export const actualizarTecnico = (id: string | number, datos: TecnicoPayload) => tecnicoService.actualizar(id, datos);
export const eliminarTecnico = (id: string | number) => tecnicoService.eliminar(id);