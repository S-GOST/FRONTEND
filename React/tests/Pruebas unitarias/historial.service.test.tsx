import { Mock } from 'vitest';
import {
  obtenerHistorial,
  eliminarHistorial,
  obtenerMiHistorial,
} from '../../src/services/historial.service';
import { BaseApiService } from '../../src/services/base.service';

Mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };
  return {
    __esModule: true,
    BaseApiService: vi.fn(() => instance),
  };
});

Mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const base = (BaseApiService as unknown as Mock).mock.results[0].value;

describe('historial.service', () => {
  let apiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const axiosModule = await import('../../src/config/axios');
    apiClient = axiosModule.default;
  });

  // 1. OBTENER HISTORIAL
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });
    await obtenerHistorial();
    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. ELIMINAR HISTORIAL
  it('debería delegar en eliminar con el ID', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });
    await eliminarHistorial(5);
    expect(base.eliminar).toHaveBeenCalledWith(5);
  });

  // 3. ELIMINAR CON ID STRING
  it('debería aceptar ID como string en eliminar', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });
    await eliminarHistorial('HIST-001');
    expect(base.eliminar).toHaveBeenCalledWith('HIST-001');
  });

  // 4. OBTENER MI HISTORIAL
  it('debería obtener el historial del usuario autenticado', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id_historial: 1, accion: 'LOGIN', tabla_afectada: 'usuarios' },
        { id_historial: 2, accion: 'UPDATE', tabla_afectada: 'ordenes' },
      ],
    });

    const result = await obtenerMiHistorial();

    expect(apiClient.get).toHaveBeenCalledWith('/historial/mi-historial');
    expect(result).toHaveLength(2);
    expect(result[0].accion).toBe('LOGIN');
  });

  // 5. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));
    await expect(obtenerHistorial()).rejects.toThrow('Error de red');
  });

  // 6. ERROR EN OBTENER MI HISTORIAL
  it('debería propagar errores desde apiClient', async () => {
    apiClient.get.mockRejectedValue(new Error('Sin autorización'));
    await expect(obtenerMiHistorial()).rejects.toThrow('Sin autorización');
  });
});



