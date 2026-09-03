import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseApiService } from '../../src/services/base.service';

const makeHttp = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

const axios404 = { isAxiosError: true, response: { status: 404 } };
const axios500 = { isAxiosError: true, response: { status: 500 } };

const createService = (http: any, routes?: any) =>
  new BaseApiService<any>({ baseUrl: '/test', routes }, http);

describe('BaseApiService', () => {
  let http: ReturnType<typeof makeHttp>;

  beforeEach(() => {
    http = makeHttp();
    vi.clearAllMocks();
  });

  it('debería listar con la ruta primaria /obtener', async () => {
    http.get.mockResolvedValue({ data: [] });
    const service = createService(http);
    await service.obtenerTodos();
    expect(http.get).toHaveBeenCalledWith('/test/obtener');
  });

  it('debería buscar por ID reemplazando :id en la ruta', async () => {
    http.get.mockResolvedValue({ data: {} });
    const service = createService(http);
    await service.obtenerPorId(5);
    expect(http.get).toHaveBeenCalledWith('/test/buscar/5');
  });

  it('debería usar la ruta fallback si la primaria responde 404', async () => {
    http.get.mockRejectedValueOnce(axios404).mockResolvedValueOnce({ data: [] });
    const service = createService(http, { listFallback: '/listar' });
    await service.obtenerTodos();
    expect(http.get).toHaveBeenNthCalledWith(1, '/test/obtener');
    expect(http.get).toHaveBeenNthCalledWith(2, '/test/listar');
  });

  it('debería propagar el error si NO es 404', async () => {
    http.get.mockRejectedValue(axios500);
    const service = createService(http, { listFallback: '/listar' });
    await expect(service.obtenerTodos()).rejects.toEqual(axios500);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('debería aplicar fallback en eliminar con rutas custom', async () => {
    http.delete.mockRejectedValueOnce(axios404).mockResolvedValueOnce({ data: {} });
    const service = createService(http, { deleteFallback: '/borrar/:id' });
    await service.eliminar(7);
    expect(http.delete).toHaveBeenNthCalledWith(1, '/test/eliminar/7');
    expect(http.delete).toHaveBeenNthCalledWith(2, '/test/borrar/7');
  });

  it('debería crear con la ruta /insertar', async () => {
    http.post.mockResolvedValue({ data: {} });
    const service = createService(http);
    await service.crear({ nombre: 'Item', precio: 100 });
    expect(http.post).toHaveBeenCalledWith('/test/insertar', expect.objectContaining({ nombre: 'Item', precio: 100 }));
  });

  it('debería eliminar la clave especialidad en objetos, anidados y arrays', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    expect(payloadEnviado.lista[0]).not.toHaveProperty('especialidad');
    warnSpy.mockRestore();
  });

  it('debería actualizar con PUT en /actualizar/:id', async () => {
    http.put.mockResolvedValue({ data: {} });
    const service = createService(http);
    await service.actualizar(3, { nombre: 'Editado' });
    expect(http.put).toHaveBeenCalledWith('/test/actualizar/3', expect.objectContaining({ nombre: 'Editado' }));
  });

  it('debería usar /actualizar sin fallback cuando el ID está vacío', async () => {
    http.put.mockRejectedValue(axios404);
    const service = createService(http);
    await expect(service.actualizar('', { nombre: 'X' })).rejects.toEqual(axios404);
    expect(http.put).toHaveBeenCalledTimes(1);
    expect(http.put).toHaveBeenCalledWith('/test/actualizar', expect.any(Object));
  });

  it('debería usar el fallback /:id en actualizar con 404', async () => {
    http.put.mockRejectedValueOnce(axios404).mockResolvedValueOnce({ data: {} });
    const service = createService(http);
    await service.actualizar(9, { nombre: 'X' });
    // Ajuste: El fallback suele incluir el payload también
    expect(http.put).toHaveBeenNthCalledWith(2, '/test/9', expect.any(Object));
  });

  it('debería respetar las rutas custom del config', async () => {
    http.delete.mockRejectedValueOnce(axios404).mockResolvedValueOnce({ data: {} });
    const service = new BaseApiService<any>(
      { baseUrl: '/admins', routes: { deletePrimary: '/eliminar/:id', deleteFallback: '' } },
    );
    await service.eliminar(1);
    expect(http.delete).toHaveBeenNthCalledWith(1, '/admins/eliminar/1', expect.any(Object));
    expect(http.delete).toHaveBeenNthCalledWith(2, '/admins', expect.any(Object));
  });
});