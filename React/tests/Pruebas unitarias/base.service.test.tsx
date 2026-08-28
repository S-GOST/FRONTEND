import { describe, it, expect, beforeEach, vi } from 'vitest'; // Agregar vi aquí
import { BaseApiService } from '../../src/services/base.service';

// ==================== HELPERS ====================

// Cliente HTTP falso para inyectar al constructor
const makeHttp = () => ({
  get: vi.fn(),    // Correcto ahora que vi está importado
  post: vi.fn(),   // Correcto
  put: vi.fn(),    // Correcto
  delete: vi.fn(), // Correcto
});

// Error 404 que axios.isAxiosError reconoce
const axios404 = { isAxiosError: true, response: { status: 404 } };
const axios500 = { isAxiosError: true, response: { status: 500 } };

const createService = (http: any, routes?: any) =>
  new BaseApiService<any>({ baseUrl: '/test', routes }, http);

describe('BaseApiService', () => {
  let http: ReturnType<typeof makeHttp>;

  beforeEach(() => {
    http = makeHttp();
    vi.clearAllMocks(); // Cambio: jest -> vi
  });

  // ========== RUTAS POR DEFECTO ==========

  // 1. LISTAR CON RUTA PRIMARIA
  it('debería listar con la ruta primaria /obtener', async () => {
    http.get.mockResolvedValue({ data: [] });
    const service = createService(http);

    await service.obtenerTodos();

    expect(http.get).toHaveBeenCalledWith('/test/obtener');
  });

  // 2. OBTENER POR ID CON RUTA PRIMARIA
  it('debería buscar por ID reemplazando :id en la ruta', async () => {
    http.get.mockResolvedValue({ data: {} });
    const service = createService(http);

    await service.obtenerPorId(5);

    expect(http.get).toHaveBeenCalledWith('/test/buscar/5');
  });

  // ========== LÓGICA DE FALLBACK ==========

  // 3. FALLBACK EN LISTAR CON 404
  it('debería usar la ruta fallback si la primaria responde 404', async () => {
    http.get
      .mockRejectedValueOnce(axios404)
      .mockResolvedValueOnce({ data: [] });
    const service = createService(http, { listFallback: '/listar' });

    await service.obtenerTodos();

    expect(http.get).toHaveBeenNthCalledWith(1, '/test/obtener');
    expect(http.get).toHaveBeenNthCalledWith(2, '/test/listar');
  });

  // 4. NO HAY FALLBACK CON OTROS ERRORES
  it('debería propagar el error si NO es 404', async () => {
    http.get.mockRejectedValue(axios500);
    const service = createService(http, { listFallback: '/listar' });

    await expect(service.obtenerTodos()).rejects.toEqual(axios500);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  // 5. FALLBACK EN ELIMINAR CON RUTA PERSONALIZADA
  it('debería aplicar fallback en eliminar con rutas custom', async () => {
    http.delete
      .mockRejectedValueOnce(axios404)
      .mockResolvedValueOnce({ data: {} });
    const service = createService(http, { deleteFallback: '/borrar/:id' });

    await service.eliminar(7);

    expect(http.delete).toHaveBeenNthCalledWith(1, '/test/eliminar/7');
    expect(http.delete).toHaveBeenNthCalledWith(2, '/test/borrar/7');
  });

  // ========== CREAR ==========

  // 6. CREAR CON PAYLOAD LIMPIO
  it('debería crear con la ruta /insertar', async () => {
    http.post.mockResolvedValue({ data: {} });
    const service = createService(http);

    await service.crear({ nombre: 'Item', precio: 100 });

    expect(http.post).toHaveBeenCalledWith(
      '/test/insertar',
      expect.objectContaining({ nombre: 'Item', precio: 100 })
    );
  });

  // 7. SANEAMIENTO: ELIMINA "especialidad" RECURSIVAMENTE
  it('debería eliminar la clave especialidad en objetos, anidados y arrays', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // ✅ Cambio: jest -> vi
    http.post.mockResolvedValue({ data: {} });
    const service = createService(http);

    await service.crear({
      nombre: 'Tecnico',
      especialidad: 'Motos',
      anidado: { especialidad: 'X', otro: 1 },
      lista: [{ especialidad: 'Y', dato: 2 }],
    } as any);

    const payloadEnviado = http.post.mock.calls[0][1];

    expect(payloadEnviado).not.toHaveProperty('especialidad');
    expect(payloadEnviado.anidado).not.toHaveProperty('especialidad');
    expect(payloadEnviado.anidado.otro).toBe(1);
    expect(payloadEnviado.lista[0]).not.toHaveProperty('especialidad');
    expect(payloadEnviado.lista[0].dato).toBe(2);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  // ========== ACTUALIZAR ==========

  // 8. ACTUALIZAR CON ID
  it('debería actualizar con PUT en /actualizar/:id', async () => {
    http.put.mockResolvedValue({ data: {} });
    const service = createService(http);

    await service.actualizar(3, { nombre: 'Editado' });

    expect(http.put).toHaveBeenCalledWith(
      '/test/actualizar/3',
      expect.objectContaining({ nombre: 'Editado' })
    );
  });

  // 9. ACTUALIZAR SIN ID → RUTA SIN :id Y SIN FALLBACK
  it('debería usar /actualizar sin fallback cuando el ID está vacío', async () => {
    http.put.mockRejectedValue(axios404);
    const service = createService(http);

    await expect(service.actualizar('', { nombre: 'X' })).rejects.toEqual(axios404);

    // Solo 1 llamada: no intenta fallback
    expect(http.put).toHaveBeenCalledTimes(1);
    expect(http.put).toHaveBeenCalledWith('/test/actualizar', expect.any(Object));
  });

  // 10. FALLBACK EN ACTUALIZAR
  it('debería usar el fallback /:id en actualizar con 404', async () => {
    http.put
      .mockRejectedValueOnce(axios404)
      .mockResolvedValueOnce({ data: {} });
    const service = createService(http);

    await service.actualizar(9, { nombre: 'X' });

    expect(http.put).toHaveBeenNthCalledWith(2, '/test/9');
  });

  // ========== RUTAS CUSTOM (CASO admin.service) ==========

  // 11. RUTAS CUSTOM SOBRESCRIBEN LAS POR DEFECTO
  it('debería respetar las rutas custom del config', async () => {
    http.delete
      .mockRejectedValueOnce(axios404)
      .mockResolvedValueOnce({ data: {} });

    // Misma configuración que usa admin.service
    const service = new BaseApiService<any>(
      { baseUrl: '/admins', routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' } },
    );

    // Nota: El constructor original de tu servicio podría no aceptar http como segundo argumento.
    // Si tu servicio crea su propia instancia de axios internamente, este test necesitará mockear ese módulo.
    // Asumiendo que el constructor acepta el cliente http para pruebas:
    
    await service.eliminar(1);

    expect(http.delete).toHaveBeenNthCalledWith(1, '/admins/eliminar/1');
    // Si deleteFallback es vacío, la lógica debería caer en la ruta base o manejarlo según tu implementación
    expect(http.delete).toHaveBeenNthCalledWith(2, '/admins'); 
  });
});