import { BaseApiService } from './base.service';

export interface MotoPayload {
  ID_MOTOS?: string | number;
  id_moto?: string | number;
  ID_CLIENTES?: string | number;
  id_cliente?: string | number;
  Placa?: string;
  placa?: string;
  Modelo?: string;
  modelo?: string;
  Marca?: string;
  marca?: string;
  Cilindraje?: string | number;
  cilindraje?: string | number;
  Kilometraje?: string | number;
  kilometraje?: string | number;
  Recorrido?: number;
}

export interface MotoRecord extends MotoPayload {}

const motoService = new BaseApiService<MotoPayload>({
  baseUrl: '/motos',
  routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' }
});

export const obtenerMotos = () => motoService.obtenerTodos();
export const obtenerMotoPorId = (id: string | number) => motoService.obtenerPorId(id);
export const insertarMoto = (data: MotoPayload) => motoService.crear(data);
export const actualizarMoto = (id: string | number, data: MotoPayload) => motoService.actualizar(id, data);
export const eliminarMoto = (id: string | number) => motoService.eliminar(id);