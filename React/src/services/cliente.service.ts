import { BaseApiService } from './base.service';

export interface ClientePayload {
  numero_documento: string | number;
  id_tipo_documento: number | string;
  ciudad: string;
  nombre: string;
  usuario: string;
  password?: string;
  correo: string;
  telefono: string;

  // Retrocompatibilidad
  ID_CLIENTES?: string | number;
  Nombre?: string;
  Ubicacion?: string;
}

export type ClienteRecord = ClientePayload;

const clienteService = new BaseApiService<ClientePayload>({
  baseUrl: '/clientes',
});

const addCompatibility = (c: any): any => {
  if (!c) return c;
  return {
    ...c,
    ID_CLIENTES: c.id_usuario || c.numero_documento,
    Nombre: c.nombre,
    Ubicacion: c.ciudad,
  };
};

export const obtenerClientes = async () => {
  const res = await clienteService.obtenerTodos();
  if (res.data) {
    if (Array.isArray(res.data)) {
      res.data = res.data.map(addCompatibility);
    } else if (res.data.data && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(addCompatibility);
    } else if (res.data.clientes && Array.isArray(res.data.clientes)) {
      res.data.clientes = res.data.clientes.map(addCompatibility);
    }
  }
  return res;
};



export const insertarCliente = (datos: ClientePayload) => clienteService.crear(datos);
export const actualizarCliente = (id: string | number, datos: ClientePayload) => clienteService.actualizar(id, datos);
export const eliminarCliente = (id: string | number) => clienteService.eliminar(id);