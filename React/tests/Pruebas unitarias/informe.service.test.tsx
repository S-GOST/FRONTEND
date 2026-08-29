import {
  obtenerInformes,
  crearInforme,
  actualizarInforme,
  eliminarInforme,
  obtenerMisInformes,
  generarReporte,
  obtenerReporteProductividad,
  obtenerReporteInventario,
} from '../../src/services/informe.service';

// 1. MOCK DEL CLIENTE AXIOS
vi.mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('informe.service', () => {
  let apiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const axiosModule = await import('../../src/config/axios');
    apiClient = axiosModule.default;
  });

  // ========== CRUD BÁSICO ==========

  // 1. OBTENER INFORMES
  it('debería obtener todos los informes', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id_informe: 1, id_orden: 10, diagnostico: 'Motor fallando' },
        { id_informe: 2, id_orden: 15, trabajo_realizado: 'Cambio de aceite' },
      ],
    });

    const result = await obtenerInformes();

    expect(apiClient.get).toHaveBeenCalledWith('/informes/obtener');
    expect(result).toHaveLength(2);
    expect((result as any).data[0].diagnostico).toBe('Motor fallando');
  });

  // 2. CREAR INFORME
  it('debería crear un informe con el payload completo', async () => {
    apiClient.post.mockResolvedValue({ data: { id_informe: 3, success: true } });
    const payload = {
      id_orden: 20,
      id_tecnico: 5,
      diagnostico: 'Frenos desgastados',
      trabajo_realizado: 'Cambio de pastillas',
      recomendaciones: 'Revisar en 5000 km',
    };

    const result = await crearInforme(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/informes/insertar', payload);
    expect((result as any).data.id_informe).toBe(3);
  });

  // 3. ACTUALIZAR INFORME
  it('debería actualizar un informe con ID y datos parciales', async () => {
    apiClient.put.mockResolvedValue({ data: { success: true } });

    await actualizarInforme(5, {
      diagnostico: 'Nuevo diagnóstico',
      recomendaciones: 'Nuevas recomendaciones',
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/informes/actualizar/5',
      {
        diagnostico: 'Nuevo diagnóstico',
        recomendaciones: 'Nuevas recomendaciones',
      }
    );
  });

  // 4. ELIMINAR INFORME
  it('debería eliminar un informe por ID', async () => {
    apiClient.delete.mockResolvedValue({ data: { success: true } });

    await eliminarInforme(7);

    expect(apiClient.delete).toHaveBeenCalledWith('/informes/eliminar/7');
  });

  // ========== INFORMES DEL TÉCNICO ==========

  // 5. OBTENER MIS INFORMES (HU-004.1)
  it('debería obtener los informes del técnico autenticado', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id_informe: 10, id_orden: 25, fecha: '2026-08-20T10:00:00' },
        { id_informe: 11, id_orden: 30, fecha: '2026-08-21T14:30:00' },
      ],
    });

    const result = await obtenerMisInformes();

    expect(apiClient.get).toHaveBeenCalledWith('/informes/mis-informes');
    expect(result).toHaveLength(2);
    expect((result as any).data[0].fecha).toBe('2026-08-20T10:00:00');
  });

  // ========== REPORTES ==========

  // 6. GENERAR REPORTE POR FECHAS (HU-004.1)
  it('debería generar un reporte con rango de fechas', async () => {
    apiClient.post.mockResolvedValue({
      data: [
        { id_informe: 1, fecha: '2026-08-01' },
        { id_informe: 2, fecha: '2026-08-15' },
      ],
    });

    const result = await generarReporte('2026-08-01', '2026-08-31');

    expect(apiClient.post).toHaveBeenCalledWith('/informes/generar-reporte', {
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-08-31',
    });
    expect(result).toHaveLength(2);
  });

  // 7. REPORTE DE PRODUCTIVIDAD (RF-0036)
  it('debería obtener el reporte de productividad con query params', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        total_ordenes: 50,
        ordenes_completadas: 45,
        tiempo_promedio: 120,
      },
    });

    const result = await obtenerReporteProductividad('2026-08-01', '2026-08-31');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/informes/productividad?fecha_inicio=2026-08-01&fecha_fin=2026-08-31'
    );
    expect((result as any).data.total_ordenes).toBe(50);
  });

  // 8. REPORTE DE INVENTARIO CON FILTROS (RF-0035)
  it('debería obtener el reporte de inventario con todos los filtros', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { producto: 'Aceite', stock: 100, categoria: 'Repuestos' },
        { producto: 'Bujías', stock: 50, categoria: 'Repuestos' },
      ],
    });

    const result = await obtenerReporteInventario('2026-08-01', '2026-08-31', 'Repuestos');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/informes/inventario?fecha_inicio=2026-08-01&fecha_fin=2026-08-31&categoria=Repuestos'
    );
    expect(result).toHaveLength(2);
    expect((result as any).data[0].categoria).toBe('Repuestos');
  });

  // 9. REPORTE DE INVENTARIO SIN FILTROS OPCIONALES
  it('debería obtener el reporte de inventario sin filtros opcionales', async () => {
    apiClient.get.mockResolvedValue({ data: [] });

    await obtenerReporteInventario();

    expect(apiClient.get).toHaveBeenCalledWith('/informes/inventario?');
  });

  // 10. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde apiClient', async () => {
    apiClient.get.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerInformes()).rejects.toThrow('Error de red');
  });
});



