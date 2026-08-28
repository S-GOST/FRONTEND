import {
  obtenerServicios,
  insertarServicio,
  actualizarServicio,
  eliminarServicio,
  habilitarServicio,
} from '../../src/services/servicio.service';
import { BaseApiService } from '../../src/services/base.service';

// 1. MOCK DE BaseApiService (jest.fn DENTRO de la fábrica)
jest.mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  };
  return {
    __esModule: true,
    BaseApiService: jest.fn(() => instance),
  };
});

// 2. MOCK DEL CLIENTE AXIOS
jest.mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Instancia creada por servicioService al cargarse el módulo
const base = (BaseApiService as unknown as jest.Mock).mock.results[0].value;

// ==================== DATOS DE PRUEBA ====================
const mockPayload = {
  ID_SERVICIOS: '5',
  ID_CATEGORIA: '30',
  Nombre: 'Mantenimiento General',
  Precio: 150000,
  Estado: 'Disponible' as const,
};

describe('servicio.service', () => {
  let apiClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const axiosModule = await import('../../src/config/axios');
    apiClient = axiosModule.default;
  });

  // ========== CRUD BÁSICO ==========

  // 1. OBTENER SERVICIOS
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });

    await obtenerServicios();

    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. INSERTAR SERVICIO
  it('debería delegar en crear con el payload completo', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });

    await insertarServicio(mockPayload);

    expect(base.crear).toHaveBeenCalledWith(mockPayload);
  });

  // 3. ACTUALIZAR SERVICIO CON ID STRING
  it('debería delegar en actualizar con ID string y payload', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarServicio('SERV-001', { ...mockPayload, Precio: 200000 });

    expect(base.actualizar).toHaveBeenCalledWith(
      'SERV-001',
      expect.objectContaining({ Precio: 200000 })
    );
  });

  // 4. ACTUALIZAR SERVICIO CON ID NUMÉRICO
  it('debería aceptar ID numérico en actualizar', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarServicio(7, { ...mockPayload, Nombre: 'Nuevo nombre' });

    expect(base.actualizar).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ Nombre: 'Nuevo nombre' })
    );
  });

  // 5. ELIMINAR SERVICIO CON ID STRING
  it('debería delegar en eliminar con ID string', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarServicio('SERV-002');

    expect(base.eliminar).toHaveBeenCalledWith('SERV-002');
  });

  // 6. ELIMINAR SERVICIO CON ID NUMÉRICO
  it('debería aceptar ID numérico en eliminar', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarServicio(123);

    expect(base.eliminar).toHaveBeenCalledWith(123);
  });

  // ========== HABILITAR SERVICIO ==========

  // 7. HABILITAR SERVICIO
  it('debería hacer PUT a /servicios/habilitar/:id', async () => {
    apiClient.put.mockResolvedValue({ data: { success: true } });

    await habilitarServicio('SERV-003');

    expect(apiClient.put).toHaveBeenCalledWith('/servicios/habilitar/SERV-003');
  });

  // 8. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerServicios()).rejects.toThrow('Error de red');
  });

  // 9. ERROR EN HABILITAR
  it('debería propagar errores desde apiClient.put', async () => {
    apiClient.put.mockRejectedValue(new Error('Sin autorización'));

    await expect(habilitarServicio('SERV-004')).rejects.toThrow('Sin autorización');
  });
});