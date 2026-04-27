import { BaseApiService } from './base.service';

export interface MotoPayload {
  ID_MOTOS: string | number;
  ID_CLIENTES: string | number;
  Placa: string;
  Modelo: string;
  Marca: string;
  Recorrido: number;
}

export interface MotoRecord extends MotoPayload {}

export const motoService = new BaseApiService<MotoPayload>({
  baseUrl: '/motos',
});

export const obtenerMotos = () => motoService.obtenerTodos();
export const obtenerMotoPorId = (id: string | number) => motoService.obtenerPorId(id);
export const crearMoto = (data: MotoPayload) => motoService.crear(data);
export const actualizarMoto = (id: string | number, data: MotoPayload) => motoService.actualizar(id, data);
export const eliminarMoto = (id: string | number) => motoService.eliminar(id);