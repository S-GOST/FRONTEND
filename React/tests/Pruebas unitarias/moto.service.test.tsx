import { Mock } from 'vitest';
import {
  obtenerMotos,
  obtenerMotoPorId,
  insertarMoto,
  actualizarMoto,
  eliminarMoto,
} from '../../src/services/moto.service';
import { BaseApiService } from '../../src/services/base.service';

// 1. MOCK DE BaseApiService (vi.fn DENTRO de la fábrica)
vi.mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: vi.fn(),
    obtenerPorId: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };
  return {
    __esModule: true,
    BaseApiService: vi.fn(function(this: any) { Object.assign(this, instance); return this; }),
  };
});

// Instancia creada por motoService al cargarse el módulo
const base = (BaseApiService as unknown as Mock).mock.results[0].value;

// ==================== DATOS DE PRUEBA ====================
const mockMotoPayload = {
  ID_CLIENTES: '100',
  Placa: 'ABC12D',
  Modelo: 'Duke 390',
  Marca: 'KTM',
  Cilindraje: 390,
  Kilometraje: 15000,
  Recorrido: 15000,
};

describe('moto.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. OBTENER MOTOS
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });

    await obtenerMotos();

    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. OBTENER MOTO POR ID
  it('debería delegar en obtenerPorId con el ID', async () => {
    base.obtenerPorId.mockResolvedValue({ data: mockMotoPayload });

    await obtenerMotoPorId(5);

    expect(base.obtenerPorId).toHaveBeenCalledWith(5);
  });

  // 3. OBTENER MOTO POR ID STRING
  it('debería aceptar ID como string en obtenerMotoPorId', async () => {
    base.obtenerPorId.mockResolvedValue({ data: mockMotoPayload });

    await obtenerMotoPorId('MOTO-001');

    expect(base.obtenerPorId).toHaveBeenCalledWith('MOTO-001');
  });

  // 4. INSERTAR MOTO
  it('debería delegar en crear con el payload completo', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });

    await insertarMoto(mockMotoPayload);

    expect(base.crear).toHaveBeenCalledWith(mockMotoPayload);
  });

  // 5. ACTUALIZAR MOTO
  it('debería delegar en actualizar con el ID y el payload', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarMoto('100', { ...mockMotoPayload, Marca: 'Yamaha' });

    expect(base.actualizar).toHaveBeenCalledWith(
      '100',
      expect.objectContaining({ Marca: 'Yamaha' })
    );
  });

  // 6. ELIMINAR MOTO
  it('debería delegar en eliminar con el ID', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarMoto(7);

    expect(base.eliminar).toHaveBeenCalledWith(7);
  });

  // 7. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerMotos()).rejects.toThrow('Error de red');
  });
});



