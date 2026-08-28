import { Mock } from 'vitest';
import { obtenerTiposDocumento } from '../../src/services/tipoDocumento.service';
import { BaseApiService } from '../../src/services/base.service';

// 1. MOCK DE BaseApiService (vi.fn DENTRO de la fábrica)
vi.mock('../../src/services/base.service', () => {
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

// Instancia creada por tipoDocumentoService al cargarse el módulo
const base = (BaseApiService as unknown as Mock).mock.results[0].value;

describe('tipoDocumento.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. OBTENER TIPOS DOCUMENTO
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });

    await obtenerTiposDocumento();

    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. RESPUESTA CON DATOS
  it('debería retornar los tipos de documento correctamente', async () => {
    const mockData = [
      { id_tipo_documento: 1, nombre: 'Cédula' },
      { id_tipo_documento: 2, nombre: 'Pasaporte' },
      { id_tipo_documento: 3, nombre: 'Licencia' },
    ];
    base.obtenerTodos.mockResolvedValue({ data: mockData });

    const result = await obtenerTiposDocumento();

    expect(result.data).toEqual(mockData);
    expect(result.data).toHaveLength(3);
    expect(result.data[0].nombre).toBe('Cédula');
  });

  // 3. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerTiposDocumento()).rejects.toThrow('Error de red');
  });
});



