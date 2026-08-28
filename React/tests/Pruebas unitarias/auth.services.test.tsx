import {
  loginService,
  clearSession,
  requestPasswordReset,
  resetPassword,
} from '../../src/services/auth.services';
import apiClient from '../../src/config/axios';

// 1. MOCK DEL CLIENTE AXIOS (get/post como jest.fn dentro de la fábrica)
jest.mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Referencias tipadas a los mocks
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

// 2. MOCK DE window.location.replace
const mockReplace = jest.fn();
Object.defineProperty(window, 'location', {
  writable: true,
  value: { ...window.location, replace: mockReplace },
});

// Helper: crea un JWT falso con el payload que queramos
const makeToken = (payload: object) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.firma`;
};

describe('auth.services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGet.mockResolvedValue({ data: {} });
  });

  // ========== loginService ==========

  // 1. LOGIN EXITOSO COMO ADMIN
  it('debería loguear como admin y guardar la sesión completa', async () => {
    mockPost.mockResolvedValue({
      data: { token: 'abc.def.ghi', nombre: 'Admin KTM', rol: 1, id_usuario: 5 },
    });

    const result = await loginService(' admin ', ' pass123 ');

    // Credenciales recortadas (trim)
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { usuario: 'admin', password: 'pass123' });

    // Sesión guardada
    expect(localStorage.getItem('user_token')).toBe('abc.def.ghi');
    expect(localStorage.getItem('user_name')).toBe('Admin KTM');
    expect(localStorage.getItem('user_role')).toBe('admin');
    expect(localStorage.getItem('user_id')).toBe('5');

    // Rol mapeado en la respuesta
    expect(result.rol).toBe('admin');
  });

  // 2. MAPEO DE ROL TÉCNICO
  it('debería mapear rol 2 a tecnico', async () => {
    mockPost.mockResolvedValue({ data: { token: 't.o.k', nombre: 'Tec', rol: 2, id_usuario: 7 } });

    const result = await loginService('tec', '123');

    expect(localStorage.getItem('user_role')).toBe('tecnico');
    expect(result.rol).toBe('tecnico');
  });

  // 3. MAPEO DE ROL POR DEFECTO (CLIENTE)
  it('debería mapear a cliente cuando el rol no es 1 ni 2', async () => {
    mockPost.mockResolvedValue({ data: { token: 't.o.k', nombre: 'Cli', rol: 3, id_usuario: 9 } });

    const result = await loginService('cli', '123');

    expect(localStorage.getItem('user_role')).toBe('cliente');
    expect(result.rol).toBe('cliente');
  });

  // 4. TOKEN CSRF SE SOLICITA ANTES DEL LOGIN
  it('debería intentar obtener el token CSRF antes del login', async () => {
    mockPost.mockResolvedValue({ data: { token: 't.o.k', rol: 1, id_usuario: 1 } });

    await loginService('u', 'p');

    expect(mockGet).toHaveBeenCalledWith('/auth/csrf-token');
  });

  // 5. LOGIN CONTINÚA AUNQUE CSRF FALLE
  it('debería continuar con el login aunque el CSRF falle', async () => {
    mockGet.mockRejectedValue(new Error('CSRF no disponible'));
    mockPost.mockResolvedValue({ data: { token: 't.o.k', rol: 1, id_usuario: 1 } });

    const result = await loginService('u', 'p');

    expect(mockPost).toHaveBeenCalled();
    expect(result.rol).toBe('admin');
  });

  // 6. PRIORIDAD DE IDs: id_usuario PRIMERO
  it('debería usar id_usuario con máxima prioridad como user_id', async () => {
    mockPost.mockResolvedValue({
      data: { token: 't.o.k', rol: 1, id_usuario: 5, numero_documento: '1001', usuario: 'admin' },
    });

    await loginService('u', 'p');

    expect(localStorage.getItem('user_id')).toBe('5');
  });

  // 7. FALLBACK: ID DESDE EL JWT
  it('debería extraer el user_id del JWT si el backend no lo envía', async () => {
    const token = makeToken({ sub: '99' });
    mockPost.mockResolvedValue({ data: { token, nombre: 'Sin ID', rol: 1 } });

    await loginService('u', 'p');

    expect(localStorage.getItem('user_id')).toBe('99');
  });

  // 8. SIN TOKEN NO GUARDA SESIÓN
  it('no debería guardar sesión si la respuesta no tiene token', async () => {
    mockPost.mockResolvedValue({ data: { nombre: 'SinToken', rol: 1 } });

    const result = await loginService('u', 'p');

    expect(localStorage.getItem('user_token')).toBeNull();
    expect(localStorage.getItem('user_role')).toBeNull();
    expect(result.rol).toBe('admin');
  });

  // ========== clearSession ==========

  // 9. CIERRE DE SESIÓN COMPLETO
  it('debería invalidar sesión en servidor, limpiar storage y redirigir', async () => {
    mockPost.mockResolvedValue({ data: {} });
    localStorage.setItem('user_token', 'abc');
    localStorage.setItem('user_name', 'Admin');

    await clearSession();

    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    expect(localStorage.getItem('user_token')).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  // 10. CIERRE LOCAL AUNQUE EL SERVIDOR FALLE
  it('debería limpiar y redirigir aunque el logout del servidor falle', async () => {
    mockPost.mockRejectedValue(new Error('Servidor caído'));
    localStorage.setItem('user_token', 'abc');

    await clearSession();

    expect(localStorage.getItem('user_token')).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  // 11. SIN REDIRECCIÓN CUANDO redirectToLogin ES FALSE
  it('no debería redirigir si redirectToLogin es false', async () => {
    mockPost.mockResolvedValue({ data: {} });

    await clearSession(false);

    expect(localStorage.getItem('user_token')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // ========== Recuperación de contraseña ==========

  // 12. SOLICITUD DE RESET
  it('debería enviar el correo para recuperación', async () => {
    mockPost.mockResolvedValue({ data: {} });

    await requestPasswordReset('user@test.com');

    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { correo: 'user@test.com' });
  });

  // 13. RESET DE CONTRASEÑA
  it('debería enviar token y nueva contraseña', async () => {
    mockPost.mockResolvedValue({ data: {} });

    await resetPassword('token123', 'nuevaPass');

    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'token123', password: 'nuevaPass' });
  });
});