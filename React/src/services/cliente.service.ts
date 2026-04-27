import { BaseApiService } from './base.service';

export interface ClientePayload {
  ID_CLIENTES: string | number;
  Ubicacion: string;
  Nombre: string;
  usuario: string;
  contrasena?: string;
  TipoDocumento: string;
  Correo: string;
  Telefono: string;
}
export interface ClienteRecord extends ClientePayload {}

export const clienteService = new BaseApiService<ClientePayload>({ baseUrl: '/clientes' });

export const obtenerClientes = () => clienteService.obtenerTodos();
export const obtenerClientePorId = (id: string | number) => clienteService.obtenerPorId(id);
export const crearCliente = (data: ClientePayload) => clienteService.crear(data);
export const actualizarCliente = (id: string | number, data: ClientePayload) => clienteService.actualizar(id, data);
export const eliminarCliente = (id: string | number) => clienteService.eliminar(id);