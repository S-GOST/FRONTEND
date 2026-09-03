import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  loginService, 
  clearSession, 
  registrarAuditoria, 
  requestPasswordReset, 
  resetPassword 
} from '../../src/services/auth.services';
import apiClient from '../../src/config/axios';

vi.mock('../../src/config/axios', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
    }
  };
});

describe('auth.services', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock de window.location.replace
    delete (window as any).location;
    window.location = { ...originalLocation, replace: vi.fn() } as any;
  });

  afterEach(() => {
    window.location = originalLocation as any;
  });

  describe('loginService', () => {
    it('debería realizar login, obtener csrf y guardar la sesión correctamente', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({}); // csrf-token
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          token: 'fake-token',
          nombre: 'Juan',
          rol: 1,
          id_usuario: 99
        }
      }); // login
      vi.mocked(apiClient.post).mockResolvedValueOnce({}); // auditoria

      const result = await loginService('admin', '1234');

      expect(apiClient.get).toHaveBeenCalledWith('/auth/csrf-token');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { usuario: 'admin', password: '1234' });
      
      expect(localStorage.getItem('user_token')).toBe('fake-token');
      expect(localStorage.getItem('user_name')).toBe('Juan');
      expect(localStorage.getItem('user_role')).toBe('admin');
      expect(localStorage.getItem('user_id')).toBe('99');
      
      expect(result.rol).toBe('admin');
      
      // Verificar auditoría
      expect(apiClient.post).toHaveBeenCalledWith('/historial/insertar', expect.any(Object));
    });

    it('debería continuar si falla el fetch del csrf-token', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network Error'));
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: 'fake-token', id_usuario: 1, rol: 2 }
      });

      const result = await loginService('tec', 'pass');
      expect(result.rol).toBe('tecnico');
      expect(localStorage.getItem('user_role')).toBe('tecnico');
    });

    it('debería asignar rol cliente si rol es 3', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({});
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: 'fake-token', id_usuario: 1, rol: 3 }
      });

      const result = await loginService('cli', 'pass');
      expect(result.rol).toBe('cliente');
    });

    it('debería retornar los datos directamente si no hay token en la respuesta', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { error: 'Credenciales inválidas' }
      });
      const result = await loginService('user', 'pass');
      expect(result.error).toBe('Credenciales inválidas');
      expect(localStorage.getItem('user_token')).toBeNull();
    });

    it('debería extraer userId del JWT si no viene en los ids de fallback', async () => {
      // payload con sub: 55
      const base64Payload = btoa(JSON.stringify({ sub: 55 }));
      const fakeJwt = `header.${base64Payload}.signature`;

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: fakeJwt, rol: 2 }
      });

      await loginService('tec', 'pass');
      expect(localStorage.getItem('user_id')).toBe('55');
    });

    it('debería manejar JWT inválido', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: 'invalid.jwt', rol: 2 }
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await loginService('tec', 'pass');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('El backend no envió ID'), expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('registrarAuditoria', () => {
    it('debería llamar a /historial/insertar', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({});
      await registrarAuditoria(1, 'TEST_ACTION', 'Test desc');
      expect(apiClient.post).toHaveBeenCalledWith('/historial/insertar', {
        id_usuario: 1,
        tabla_afectada: 'usuarios',
        id_registro: 1,
        accion: 'TEST_ACTION',
        descripcion: 'Test desc'
      });
    });

    it('debería manejar el error silenciosamente', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('API Down'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await registrarAuditoria(1, 'TEST_ACTION', 'Test desc');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No se pudo registrar'), expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('clearSession', () => {
    it('debería limpiar localStorage, auditar logout y redirigir', async () => {
      localStorage.setItem('user_id', '99');
      localStorage.setItem('user_name', 'Juan');
      localStorage.setItem('user_token', 'token');

      vi.mocked(apiClient.post).mockResolvedValue({});

      await clearSession();

      // Auditoría
      expect(apiClient.post).toHaveBeenCalledWith('/historial/insertar', expect.any(Object));
      // Invalida servidor
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      
      expect(localStorage.getItem('user_token')).toBeNull();
      expect(window.location.replace).toHaveBeenCalledWith('/login');
    });

    it('no debería redirigir si redirectToLogin es false', async () => {
      await clearSession(false);
      expect(window.location.replace).not.toHaveBeenCalled();
    });

    it('debería limpiar localmente incluso si /auth/logout falla', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Error'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      localStorage.setItem('user_token', 'token');
      await clearSession(false);
      
      expect(localStorage.getItem('user_token')).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('password reset', () => {
    it('requestPasswordReset debería llamar al endpoint correcto', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: 'ok' });
      await requestPasswordReset('test@test.com');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { correo: 'test@test.com' });
    });

    it('resetPassword debería llamar al endpoint correcto', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: 'ok' });
      await resetPassword('token123', 'newpass');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'token123', password: 'newpass' });
    });
  });
});
