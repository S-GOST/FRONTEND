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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export const habilitarCliente = (id: string | number) => clienteService['http'].put(`/clientes/actualizar/${id}`, { estado: 'Activo' });
export const obtenerClientePorId = async (id: string | number) => {
  try {
    const res = await clienteService.obtenerPorId(id);
    if (res.data) {
      if (res.data.data) {
        res.data.data = addCompatibility(res.data.data);
      } else {
        res.data = addCompatibility(res.data);
      }
    }
    return res;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Si falla obtener por ID (404), intentamos obtener todos y filtrar
    if (error.response?.status === 404) {
      const allRes = await obtenerClientes();
      let clientes = [];
      if (Array.isArray(allRes.data)) clientes = allRes.data;
      else if (allRes.data?.data && Array.isArray(allRes.data.data)) clientes = allRes.data.data;
      else if (allRes.data?.clientes && Array.isArray(allRes.data.clientes)) clientes = allRes.data.clientes;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cliente = clientes.find((c: any) => String(c.ID_CLIENTES) === String(id) || String(c.numero_documento) === String(id) || String(c.id_usuario) === String(id));
      
      if (cliente) {
        return { ...allRes, data: { data: cliente } };
      }
    }
    throw error;
  }
};

// Nuevas funciones para Aprobación de Clientes (RF-007)
export const obtenerClientesPendientes = async () => {
  const res = await clienteService['http'].get('/clientes/pendientes');
  if (res.data && res.data.data && Array.isArray(res.data.data)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.data.data = res.data.data.map((c: any) => ({
      ...c,
      ID_CLIENTES: c.id_usuario || c.numero_documento,
      Nombre: c.nombre,
      Ubicacion: c.ciudad,
    }));
  }
  return res;
};

export const procesarAprobacionCliente = (id: string | number, accion: 'Aprobar' | 'Rechazar', justificacion?: string) => {
  return clienteService['http'].put(`/clientes/aprobacion/${id}`, { accion, justificacion });
};