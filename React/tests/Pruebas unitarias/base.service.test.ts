import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseApiService } from '../../src/services/base.service';

const mockHttp = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
} as any;

describe('BaseApiService', () => {
  let service: BaseApiService<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BaseApiService({
      baseUrl: '/test',
      routes: {
        listPrimary: '/custom-list',
      }
    }, mockHttp);
  });

  describe('constructor', () => {
    it('debería inicializar correctamente con rutas por defecto y sobreescritas', () => {
      // @ts-ignore
      expect(service.routes.listPrimary).toBe('/custom-list');
      // @ts-ignore
      expect(service.routes.getByIdPrimary).toBe('/buscar/:id');
    });
  });

  describe('obtenerTodos', () => {
    it('debería usar listPrimary', async () => {
      mockHttp.get.mockResolvedValue({ data: [] });
      await service.obtenerTodos();
      expect(mockHttp.get).toHaveBeenCalledWith('/test/custom-list');
    });

    it('debería usar fallback si primary falla con 404', async () => {
      const error404 = { isAxiosError: true, response: { status: 404 } };
      mockHttp.get.mockRejectedValueOnce(error404);
      mockHttp.get.mockResolvedValueOnce({ data: 'fallback' });
      
      const res = await service.obtenerTodos();
      expect(res.data).toBe('fallback');
      expect(mockHttp.get).toHaveBeenCalledTimes(2);
      expect(mockHttp.get).toHaveBeenNthCalledWith(2, '/test'); // listFallback por defecto es ''
    });

    it('debería propagar el error si primary falla con otro código', async () => {
      const error500 = { isAxiosError: true, response: { status: 500 } };
      mockHttp.get.mockRejectedValueOnce(error500);
      
      await expect(service.obtenerTodos()).rejects.toEqual(error500);
    });

    it('debería propagar error si no es de Axios', async () => {
      const genericError = new Error('Network error');
      mockHttp.get.mockRejectedValueOnce(genericError);
      
      await expect(service.obtenerTodos()).rejects.toThrow('Network error');
    });
  });

  describe('obtenerPorId', () => {
    it('debería resolver el path correctamente', async () => {
      mockHttp.get.mockResolvedValue({ data: { id: 1 } });
      await service.obtenerPorId(123);
      expect(mockHttp.get).toHaveBeenCalledWith('/test/buscar/123');
    });
  });

  describe('crear', () => {
    it('debería sanitizar el payload (remover especialidad)', async () => {
      mockHttp.post.mockResolvedValue({ data: { success: true } });
      
      const payload = {
        name: 'test',
        especialidad: 'Mecánico',
        nested: { especialidad: 'Eléctrico', value: 1 },
        arr: [{ especialidad: 'X', id: 1 }]
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.crear(payload);

      expect(mockHttp.post).toHaveBeenCalledWith('/test/insertar', {
        name: 'test',
        nested: { value: 1 },
        arr: [{ id: 1 }]
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('debería manejar payloads null', async () => {
      mockHttp.post.mockResolvedValue({ data: { success: true } });
      await service.crear(null);
      expect(mockHttp.post).toHaveBeenCalledWith('/test/insertar', null);
    });

    it('debería usar fallback si crear falla con 404', async () => {
      const error404 = { isAxiosError: true, response: { status: 404 } };
      mockHttp.post.mockRejectedValueOnce(error404);
      mockHttp.post.mockResolvedValueOnce({ data: 'fallback_crear' });
      const res = await service.crear({ id: 1 });
      expect(res.data).toBe('fallback_crear');
    });
  });

  describe('actualizar', () => {
    it('debería usar /actualizar si el id es vacío', async () => {
      mockHttp.put.mockResolvedValue({ data: { success: true } });
      await service.actualizar('', { name: 'test' });
      expect(mockHttp.put).toHaveBeenCalledWith('/test/actualizar', { name: 'test' });
    });

    it('debería resolver el path de primary cuando el id es proporcionado', async () => {
      mockHttp.put.mockResolvedValue({ data: { success: true } });
      await service.actualizar(123, { name: 'test' });
      expect(mockHttp.put).toHaveBeenCalledWith('/test/actualizar/123', { name: 'test' });
    });

    it('debería usar fallback si actualizar falla con 404', async () => {
      const error404 = { isAxiosError: true, response: { status: 404 } };
      mockHttp.put.mockRejectedValueOnce(error404);
      mockHttp.put.mockResolvedValueOnce({ data: 'fallback_update' });
      const res = await service.actualizar(123, { name: 'test' });
      expect(res.data).toBe('fallback_update');
    });
  });

  describe('eliminar', () => {
    it('debería resolver el path de primary para delete', async () => {
      mockHttp.delete.mockResolvedValue({ data: { success: true } });
      await service.eliminar(123);
      expect(mockHttp.delete).toHaveBeenCalledWith('/test/eliminar/123');
    });

    it('debería usar fallback si eliminar falla con 404', async () => {
      const error404 = { isAxiosError: true, response: { status: 404 } };
      mockHttp.delete.mockRejectedValueOnce(error404);
      mockHttp.delete.mockResolvedValueOnce({ data: 'fallback_delete' });
      const res = await service.eliminar(123);
      expect(res.data).toBe('fallback_delete');
    });
  });
});
