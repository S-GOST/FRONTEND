import { Mock } from 'vitest';
import {
  obtenerOrdenes,
  insertarOrden,
  eliminarOrden,
  actualizarOrden,
  obtenerMisOrdenes,
  obtenerDetallesPorOrden,
} from '../../src/services/ordenServicioService';
import { BaseApiService } from '../../src/services/base.service';

// 1. MOCK DE BaseApiService (vi.fn DENTRO de la fábrica)
vi.mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    http: {
      get: vi.fn(),
    },
  };
  return {
    __esModule: true,
    BaseApiService: vi.fn(() => instance),
  };
});

// Instancia creada por ordenServicioService al cargarse el módulo
const base = (BaseApiService as unknown as Mock).mock.results[0].value;

// ==================== DATOS DE PRUEBA ====================
const mockPayload = {
  ClienteNombre: 'Juan Pérez',
  ID_CLIENTES: '100',
  ID_ADMINISTRADOR: '1',
  ID_TECNICOS: '5',
  ID_MOTOS: '10',
  Fecha_inicio: '2026-08-01',
  Fecha_estimada: '2026-08-05',
  Fecha_fin: null,
  Estado: 'Pendiente',
  total: 200000,
};

describe('ordenServicioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== CRUD BÁSICO ==========

  // 1. OBTENER ÓRDENES
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });

    await obtenerOrdenes();

    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. INSERTAR ORDEN
  it('debería delegar en crear con el payload completo', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });

    await insertarOrden(mockPayload);

    expect(base.crear).toHaveBeenCalledWith(mockPayload);
  });

  // 3. ACTUALIZAR ESTADO DE ORDEN
  it('debería delegar en actualizar con ID y datos parciales', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarOrden('ORD-001', {
      Estado: 'En proceso',
      ID_TECNICOS: '7',
    });

    expect(base.actualizar).toHaveBeenCalledWith(
      'ORD-001',
      expect.objectContaining({
        Estado: 'En proceso',
        ID_TECNICOS: '7',
      })
    );
  });

  // 4. ELIMINAR ORDEN
  it('debería delegar en eliminar con el ID string', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarOrden('ORD-002');

    expect(base.eliminar).toHaveBeenCalledWith('ORD-002');
  });

  // ========== FUNCIONES ESPECIALES ==========

  // 5. OBTENER MIS ÓRDENES (CLIENTE AUTENTICADO)
  it('debería obtener las órdenes del cliente autenticado', async () => {
    base.http.get.mockResolvedValue({
      data: [
        { ID_ORDEN_SERVICIO: '1', Estado: 'Pendiente', total: 150000 },
        { ID_ORDEN_SERVICIO: '2', Estado: 'Completado', total: 250000 },
      ],
    });

    const result = await obtenerMisOrdenes();

    expect(base.http.get).toHaveBeenCalledWith('/ordenes_servicio/mis-ordenes');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].Estado).toBe('Pendiente');
  });

  // 6. OBTENER DETALLES POR ORDEN CON ID STRING
  it('debería obtener los detalles de una orden específica', async () => {
    base.http.get.mockResolvedValue({
      data: [
        { ID_DETALLES_ORDEN_SERVICIO: 1, NombreServicio: 'Mantenimiento', cantidad: 1 },
        { ID_DETALLES_ORDEN_SERVICIO: 2, NombreProducto: 'Aceite', cantidad: 2 },
      ],
    });

    const result = await obtenerDetallesPorOrden('ORD-003');

    expect(base.http.get).toHaveBeenCalledWith('/detalles_orden_servicio/por_orden/ORD-003');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].NombreServicio).toBe('Mantenimiento');
  });

  // 7. OBTENER DETALLES POR ORDEN CON ID NUMÉRICO
  it('debería aceptar ID numérico en obtenerDetallesPorOrden', async () => {
    base.http.get.mockResolvedValue({ data: [] });

    await obtenerDetallesPorOrden(123);

    expect(base.http.get).toHaveBeenCalledWith('/detalles_orden_servicio/por_orden/123');
  });

  // 8. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerOrdenes()).rejects.toThrow('Error de red');
  });

  // 9. ERROR EN OBTENER MIS ÓRDENES
  it('debería propagar errores desde http.get', async () => {
    base.http.get.mockRejectedValue(new Error('Sin autorización'));

    await expect(obtenerMisOrdenes()).rejects.toThrow('Sin autorización');
  });
});



