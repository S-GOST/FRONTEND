import { Mock } from 'vitest';
import {
  obtenerDetallesOrdenes,
  eliminarDetalleOrden,
  insertarDetalleOrden,
  actualizarDetalleOrden,
} from '../../src/services/detalleOrdenServicioService';
import { BaseApiService } from '../../src/services/base.service';

// ==================== DATOS DE PRUEBA (fuera del describe) ====================
const mockPayload = {
  ID_ORDEN_SERVICIO: 10,
  ID_SERVICIOS: 5,
  ID_PRODUCTOS: undefined,
  Garantia: 30,
  Estado: 'Activo',
  Precio: 150000,
};

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
    BaseApiService: vi.fn().mockImplementation(function() { return instance; }),
  };
});

// Instancia creada por detalleOrdenServicioService al cargarse el módulo
const base = (BaseApiService as unknown as Mock).mock.results[0].value;

describe('detalleOrdenServicioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. OBTENER DETALLES ORDENES
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });

    await obtenerDetallesOrdenes();

    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. INSERTAR DETALLE ORDEN
  it('debería delegar en crear con el payload completo', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });
    await insertarDetalleOrden(mockPayload);
    expect(base.crear).toHaveBeenCalledWith(mockPayload);
  });

  // 3. ACTUALIZAR DETALLE ORDEN
  it('debería delegar en actualizar con el ID numérico y el payload', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });
    await actualizarDetalleOrden(1, { ...mockPayload, Garantia: 60 });
    expect(base.actualizar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ Garantia: 60 })
    );
  });

  // 4. ELIMINAR DETALLE ORDEN
  it('debería delegar en eliminar con el ID numérico', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarDetalleOrden(5);

    expect(base.eliminar).toHaveBeenCalledWith(5);
  });

  // 5. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerDetallesOrdenes()).rejects.toThrow('Error de red');
  });
});



