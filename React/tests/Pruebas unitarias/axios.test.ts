import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../src/config/axios';

describe('axios config', () => {
  let reqInterceptor: any;
  let resInterceptor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Extraer los interceptores que el archivo axios.ts configuró
    // @ts-ignore
    reqInterceptor = apiClient.interceptors.request.handlers[0];
    // @ts-ignore
    resInterceptor = apiClient.interceptors.response.handlers[0];

    // Limpiar cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  });

  describe('Request Interceptor', () => {
    it('debería agregar el token Bearer si existe en localStorage', async () => {
      localStorage.setItem('user_token', 'test-token');
      const config = { headers: {} } as any;
      const result = await reqInterceptor.fulfilled(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('debería agregar X-CSRF-Token si la cookie existe y el método es POST', async () => {
      document.cookie = "XSRF-TOKEN=my-csrf-token";
      const config = { method: 'post', headers: {} } as any;
      const result = await reqInterceptor.fulfilled(config);
      expect(result.headers['X-CSRF-Token']).toBe('my-csrf-token');
    });

    it('no debería agregar CSRF para peticiones GET', async () => {
      document.cookie = "XSRF-TOKEN=my-csrf-token";
      const config = { method: 'get', headers: {} } as any;
      const result = await reqInterceptor.fulfilled(config);
      expect(result.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('debería loguear info de debug si la url es monitoreada', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const config = { method: 'post', url: '/admins/insertar', headers: {} } as any;
      await reqInterceptor.fulfilled(config);
      expect(consoleSpy).toHaveBeenCalledWith('[apiClient] request', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('Response Interceptor', () => {
    it('debería retornar la respuesta directamente en éxito', async () => {
      const response = { data: 'ok' };
      const result = await resInterceptor.fulfilled(response);
      expect(result).toEqual(response);
    });

    it('debería rechazar directamente si es 401 pero no hay token (visitante anónimo)', async () => {
      const error = { config: { url: '/test' }, response: { status: 401 } };
      await expect(resInterceptor.rejected(error)).rejects.toEqual(error);
    });

    it('debería procesar refresh token si es 401, tiene token y no es ruta de login/refresh', async () => {
      localStorage.setItem('user_token', 'old-token');
      
      const originalRequest = { url: '/api/data', headers: {} as Record<string, string> };
      const error = { config: originalRequest, response: { status: 401 } };
      
      // Simular que el post al refresh funciona
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { token: 'new-token' } });
      
      // Mockear request interno del axios
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({ data: 're-fetched' } as any);

      // Usar apply para pasar el 'this' falso (que es lo que el interceptor espera si llama a apiClient como funcion, pero en este caso llama a apiClient(originalRequest))
      // Esperamos que retorne la promesa de apiClient(originalRequest)
      Object.assign(
        vi.fn().mockResolvedValue({ data: 're-fetched' }), 
        apiClient
      );
      
      await resInterceptor.rejected(error);
      expect(localStorage.getItem('user_token')).toBe('new-token');
      expect(originalRequest.headers.Authorization).toBe('Bearer new-token');
    });

    it('debería encolar peticiones si ya se está refrescando el token', async () => {
      localStorage.setItem('user_token', 'old-token');
      const originalRequest1 = { url: '/api/data1', headers: {} as Record<string, string> };
      const error1 = { config: originalRequest1, response: { status: 401 } };
      const originalRequest2 = { url: '/api/data2', headers: {} as Record<string, string> };
      const error2 = { config: originalRequest2, response: { status: 401 } };

      let resolveRefresh: any;
      const refreshPromise = new Promise(resolve => { resolveRefresh = resolve; });
      
      vi.spyOn(apiClient, 'post').mockReturnValue(refreshPromise as any);
      vi.spyOn(apiClient, 'request').mockResolvedValue({ data: 'ok' } as any);

      // Disparamos el primero (inicia refresh)
      const promise1 = resInterceptor.rejected(error1);
      // Disparamos el segundo (se encola porque isRefreshing es true)
      const promise2 = resInterceptor.rejected(error2);

      // Resolvemos el refresh
      resolveRefresh({ data: { token: 'new-token' } });

      await Promise.all([promise1, promise2]);
      
      expect(originalRequest2.headers.Authorization).toBe('Bearer new-token');
    });

    it('debería manejar el error de refresh token y limpiar sesión', async () => {
      localStorage.setItem('user_token', 'old-token');
      const originalRequest = { url: '/api/data', headers: {} as Record<string, string> };
      const error = { config: originalRequest, response: { status: 401 } };
      
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Refresh Failed'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(resInterceptor.rejected(error)).rejects.toThrow('Refresh Failed');
      expect(localStorage.getItem('user_token')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Sesión completamente expirada'));
      consoleSpy.mockRestore();
    });

    it('debería rechazar si la ruta original es /login', async () => {
      localStorage.setItem('user_token', 'token');
      const error = { config: { url: '/auth/login' }, response: { status: 401 } };
      await expect(resInterceptor.rejected(error)).rejects.toEqual(error);
    });

    it('debería loguear 403 y rechazar', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = { config: { url: '/test' }, response: { status: 403 } };
      await expect(resInterceptor.rejected(error)).rejects.toEqual(error);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
