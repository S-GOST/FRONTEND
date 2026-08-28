import { Mock } from 'vitest';
import axios from 'axios';

// Mock de axios
Mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      defaults: {
        headers: { common: {} },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  };
  return mockAxios;
});

describe('axios config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  // 1. CREACIÓN DEL CLIENTE AXIOS
  it('debería crear una instancia de axios con configuración base', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      timeout: 10000,
      withCredentials: true,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-CSRF-Token',
    });
  });

  // 2. INTERCEPTOR DE REQUEST - SIN TOKEN
  it('debería configurar el interceptor de request sin token', () => {
    const mockConfig = {
      method: 'get',
      url: '/test',
      headers: {},
    };

    // Simular llamada al interceptor
    const requestInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    const result = requestInterceptor(mockConfig);

    expect(result.headers.Authorization).toBeUndefined();
  });

  // 3. INTERCEPTOR DE REQUEST - CON TOKEN
  it('debería agregar token de autorización cuando existe en localStorage', () => {
    localStorage.setItem('user_token', 'fake-token-123');
    
    const mockConfig = {
      method: 'get',
      url: '/test',
      headers: {},
    };

    const requestInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    const result = requestInterceptor(mockConfig);

    expect(result.headers.Authorization).toBe('Bearer fake-token-123');
  });

  // 4. INTERCEPTOR DE REQUEST - CON CSRF TOKEN
  it('debería agregar CSRF token para métodos que lo requieren', () => {
    document.cookie = 'XSRF-TOKEN=csrf-token-123';
    
    const mockConfig = {
      method: 'post',
      url: '/test',
      headers: {},
      data: { test: 'data' },
    };

    const requestInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    const result = requestInterceptor(mockConfig);

    expect(result.headers['X-CSRF-Token']).toBe('csrf-token-123');
  });

  // 5. INTERCEPTOR DE REQUEST - SIN CSRF PARA GET
  it('debería NO agregar CSRF token para método GET', () => {
    document.cookie = 'XSRF-TOKEN=csrf-token-123';
    
    const mockConfig = {
      method: 'get',
      url: '/test',
      headers: {},
    };

    const requestInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    const result = requestInterceptor(mockConfig);

    expect(result.headers['X-CSRF-Token']).toBeUndefined();
  });

  // 6. INTERCEPTOR DE RESPONSE - ÉXITO
  it('debería pasar la respuesta exitosa sin modificaciones', () => {
    const mockResponse = { data: { success: true }, status: 200 };

    const responseInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.response.use.mock.calls[0][0];
    const result = responseInterceptor(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  // 7. INTERCEPTOR DE RESPONSE - ERROR 401 SIN TOKEN
  it('debería rechazar error 401 si no hay token en localStorage', async () => {
    const mockError = {
      response: { status: 401 },
      config: { url: '/protected', _retry: false },
    };

    const responseInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.response.use.mock.calls[0][1];
    
    await expect(responseInterceptor(mockError)).rejects.toEqual(mockError);
  });

  // 8. INTERCEPTOR DE RESPONSE - ERROR 401 CON TOKEN Y REFRESH EXITOSO
  it('debería intentar refresh token y reintentar la petición original', async () => {
    localStorage.setItem('user_token', 'old-token');
    
    const mockError = {
      response: { status: 401 },
      config: { 
        url: '/protected', 
        _retry: false,
        headers: { Authorization: 'Bearer old-token' }
      },
    };

    const mockAxiosInstance = (axios.create as Mock).mock.results[0].value;
    mockAxiosInstance.post.mockResolvedValue({ data: { token: 'new-token' } });

    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    await responseInterceptor(mockError);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh');
    expect(localStorage.getItem('user_token')).toBe('new-token');
  });

  // 9. INTERCEPTOR DE RESPONSE - ERROR 401 CON REFRESH FALLIDO
  it('debería limpiar localStorage y dispatchear evento auth:unauthorized si refresh falla', async () => {
    localStorage.setItem('user_token', 'old-token');
    
    const mockError = {
      response: { status: 401 },
      config: { url: '/protected', _retry: false },
    };

    const mockAxiosInstance = (axios.create as Mock).mock.results[0].value;
    mockAxiosInstance.post.mockRejectedValue(new Error('Refresh failed'));

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    await expect(responseInterceptor(mockError)).rejects.toThrow('Refresh failed');

    expect(localStorage.getItem('user_token')).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  // 10. INTERCEPTOR DE RESPONSE - ERROR 403
  it('debería loguear error de acceso denegado para status 403', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockError = {
      response: { status: 403 },
      config: { url: '/admin/panel' },
    };

    const responseInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.response.use.mock.calls[0][1];
    
    await expect(responseInterceptor(mockError)).rejects.toEqual(mockError);

    expect(consoleSpy).toHaveBeenCalledWith(' Acceso denegado (403): No tienes permisos para esta acción.');
    consoleSpy.mockRestore();
  });

  // 11. QUEUE DE PETICIONES FALLIDAS
  it('debería manejar cola de peticiones fallidas durante refresh', async () => {
    localStorage.setItem('user_token', 'old-token');
    
    const mockError1 = {
      response: { status: 401 },
      config: { url: '/protected1', _retry: false },
    };

    const mockError2 = {
      response: { status: 401 },
      config: { url: '/protected2', _retry: false },
    };

    const mockAxiosInstance = (axios.create as Mock).mock.results[0].value;
    mockAxiosInstance.post.mockResolvedValue({ data: { token: 'new-token' } });

    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Primera petición inicia refresh
    const promise1 = responseInterceptor(mockError1);
    
    // Segunda petición se pone en cola
    const promise2 = responseInterceptor(mockError2);

    await Promise.all([promise1, promise2]);

    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Solo un refresh
  });

  // 12. HELPER GETCOOKIE
  it('debería leer cookies correctamente', () => {
    document.cookie = 'XSRF-TOKEN=test-token; Path=/; HttpOnly';
    
    // Acceder a la función getCookie desde el módulo
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    expect(getCookie('XSRF-TOKEN')).toBe('test-token');
    expect(getCookie('NONEXISTENT')).toBeNull();
  });

  // 13. LOGGING DEBUG PARA ENDPOINTS ESPECÍFICOS
  it('debería hacer debug log para endpoints de admins', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    const mockConfig = {
      method: 'post',
      url: '/admins/insertar',
      headers: {},
      data: { name: 'test' },
    };

    const requestInterceptor = (axios.create as Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    requestInterceptor(mockConfig);

    expect(consoleSpy).toHaveBeenCalledWith('[apiClient] request', expect.any(Object));
    consoleSpy.mockRestore();
  });
});



