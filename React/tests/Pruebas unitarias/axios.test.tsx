import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock completo de axios con todas las propiedades necesarias
vi.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {
      headers: {
        common: {},
        post: {},
        put: {},
        delete: {}
      }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  };

  return {
    default: mockInstance,
    create: vi.fn(() => mockInstance),
  };
});

describe('apiClient Configuration', () => {
  let mockInstance: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = '';

    // Importar el módulo real para ejecutar la configuración
    await import('../../src/config/axios');

    // Obtener la instancia creada
    mockInstance = (axios.create as any).mock.results[0]?.value || (axios as any).default;

    if (!mockInstance) {
      throw new Error('No se pudo obtener la instancia de axios mockeada');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper functions para acceder a los interceptores de forma segura
  const getRequestInterceptor = () => {
    const calls = mockInstance.interceptors.request.use.mock.calls;
    if (calls.length === 0) {
      throw new Error('No se registró ningún interceptor de request');
    }
    return calls[0][0];
  };

  const getResponseInterceptors = () => {
    const calls = mockInstance.interceptors.response.use.mock.calls;
    if (calls.length === 0) {
      throw new Error('No se registró ningún interceptor de response');
    }
    return [calls[0][0], calls[0][1]];
  };

  // 1. CONFIGURACIÓN BASE
  it('debería crear una instancia con la configuración base correcta', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      timeout: 10000,
      withCredentials: true,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-CSRF-Token',
    });
  });

  // 2. INTERCEPTOR REQUEST: AGREGAR TOKEN
  it('debería inyectar el token de autorización si existe en localStorage', () => {
    localStorage.setItem('user_token', 'my-secret-token');

    const requestHandler = getRequestInterceptor();
    const config = { headers: {}, method: 'get', url: '/test' };

    const result = requestHandler(config);

    expect(result.headers.Authorization).toBe('Bearer my-secret-token');
  });

  // 3. INTERCEPTOR REQUEST: CSRF TOKEN
  it('debería agregar el header X-CSRF-Token para métodos POST', () => {
    document.cookie = 'XSRF-TOKEN=csrf-secure-token';

    const requestHandler = getRequestInterceptor();
    const config = {
      headers: {},
      method: 'post',
      url: '/api/data',
      data: { foo: 'bar' }
    };

    const result = requestHandler(config);

    expect(result.headers['X-CSRF-Token']).toBe('csrf-secure-token');
  });

  // 4. INTERCEPTOR REQUEST: NO CSRF EN GET
  it('no debería agregar CSRF Token para peticiones GET', () => {
    document.cookie = 'XSRF-TOKEN=csrf-secure-token';

    const requestHandler = getRequestInterceptor();
    const config = { headers: {}, method: 'get', url: '/api/data' };

    const result = requestHandler(config);

    expect(result.headers['X-CSRF-Token']).toBeUndefined();
  });

  // 5. INTERCEPTOR RESPONSE: ÉXITO
  it('debería pasar las respuestas exitosas sin cambios', () => {
    const [responseHandler] = getResponseInterceptors();
    const response = { data: { success: true }, status: 200 };

    expect(responseHandler(response)).toEqual(response);
  });

  // 6. INTERCEPTOR RESPONSE: MANEJO DE 401
  it('debería rechazar la promesa si hay error 401 y no hay token', async () => {
    const [, errorHandler] = getResponseInterceptors();
    const error = { response: { status: 401 }, config: {} };

    await expect(errorHandler(error)).rejects.toEqual(error);
  });

  // 7. INTERCEPTOR RESPONSE: REFRESH TOKEN EXITOSO
  it('debería intentar refrescar el token y reintentar la petición', async () => {
    localStorage.setItem('user_token', 'old-token');

    const error = {
      response: { status: 401 },
      config: { url: '/protected', _retry: false, headers: {} },
    };

    mockInstance.post.mockResolvedValueOnce({ data: { token: 'new-refreshed-token' } });

    const [, errorHandler] = getResponseInterceptors();

    await errorHandler(error);

    expect(mockInstance.post).toHaveBeenCalledWith('/auth/refresh');
    expect(localStorage.getItem('user_token')).toBe('new-refreshed-token');
  });

  // 8. INTERCEPTOR RESPONSE: REFRESH FALLIDO -> LOGOUT
  it('debería limpiar sesión si el refresh falla', async () => {
    localStorage.setItem('user_token', 'old-token');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const error = {
      response: { status: 401 },
      config: { url: '/protected', _retry: false },
    };

    mockInstance.post.mockRejectedValueOnce(new Error('Refresh failed'));

    const [, errorHandler] = getResponseInterceptors();

    await expect(errorHandler(error)).rejects.toThrow();

    expect(localStorage.getItem('user_token')).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:unauthorized' })
    );
  });

  // 9. INTERCEPTOR RESPONSE: ERROR 403
  it('debería loguear error de acceso denegado (403)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const error = { response: { status: 403 }, config: { url: '/admin' } };
    const [, errorHandler] = getResponseInterceptors();

    await expect(errorHandler(error)).rejects.toEqual(error);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Acceso denegado'));
    consoleSpy.mockRestore();
  });
});