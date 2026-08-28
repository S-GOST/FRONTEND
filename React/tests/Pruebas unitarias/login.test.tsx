import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../../src/pages/Login';
import { loginService } from '../../src/services/auth.services';

// 1. MOCKS DE MÓDULOS EXTERNOS
Mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));

Mock('../../src/services/auth.services');

describe('Login Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (require('react-router-dom').useNavigate as Mock).mockReturnValue(mockNavigate);
    localStorage.clear();
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el formulario de login correctamente', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText('Ingresa tu usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ingresa tu contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar al panel/i })).toBeInTheDocument();
    expect(screen.getByText(/¿olvidó su contraseña\?/i)).toBeInTheDocument();
    expect(screen.getByText(/regresar al portal principal/i)).toBeInTheDocument();
  });

  // 2. VALIDACIÓN: CAMPOS VACÍOS
  it('debería mostrar error si los campos están vacíos', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(screen.getByText('Campo obligatorio')).toBeInTheDocument();
    });
    expect(loginService).not.toHaveBeenCalled();
  });

  // 3. LOGIN EXITOSO COMO ADMIN
  it('debería navegar a /admin/dashboard si el rol es admin', async () => {
    (loginService as Mock).mockResolvedValue({ rol: 'admin' });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(loginService).toHaveBeenCalledWith('admin', 'pass123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  // 4. LOGIN EXITOSO COMO TÉCNICO
  it('debería navegar a /tecnico/dashboard si el rol es tecnico', async () => {
    (loginService as Mock).mockResolvedValue({ rol: 'tecnico' });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'tec' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/tecnico/dashboard', { replace: true });
    });
  });

  // 5. LOGIN EXITOSO COMO CLIENTE
  it('debería navegar a /cliente/dashboard si el rol es cliente', async () => {
    (loginService as Mock).mockResolvedValue({ rol: 'cliente' });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'cli' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cliente/dashboard', { replace: true });
    });
  });

  // 6. ERROR 401 - CREDENCIALES INCORRECTAS
  it('debería mostrar error específico para status 401', async () => {
    const error401 = { response: { status: 401 } };
    (loginService as Mock).mockRejectedValue(error401);
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas. Verifica tu usuario y contraseña.')).toBeInTheDocument();
    });
  });

  // 7. ERROR 403 - CUENTA SIN ACCESO CON MENSAJE PERSONALIZADO
  it('debería mostrar mensaje personalizado del servidor para status 403', async () => {
    const error403 = { response: { status: 403, data: { mensaje: 'Cuenta suspendida' } } };
    (loginService as Mock).mockRejectedValue(error403);
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'suspended' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(screen.getByText('Cuenta suspendida')).toBeInTheDocument();
    });
  });

  // 8. ERROR 403 - MENSAJE GENÉRICO
  it('debería mostrar mensaje genérico si no hay mensaje del servidor para 403', async () => {
    const error403 = { response: { status: 403, data: {} } };
    (loginService as Mock).mockRejectedValue(error403);
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(screen.getByText('Tu cuenta no tiene acceso al sistema.')).toBeInTheDocument();
    });
  });

  // 9. ERROR DE CONEXIÓN (OTROS STATUS)
  it('debería mostrar error de conexión para otros status codes', async () => {
    const error500 = { response: { status: 500 } };
    (loginService as Mock).mockRejectedValue(error500);
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(screen.getByText('Error de conexión con el servidor KTM.')).toBeInTheDocument();
    });
  });

  // 10. ESTADO DE CARGA
  it('debería deshabilitar el botón durante la carga', async () => {
    (loginService as Mock).mockImplementation(() => new Promise(() => {}));
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu usuario'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al panel/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /conectando\.\.\./i })).toBeDisabled();
    });
  });

  // 11. TOGGLE MOSTRAR/OCULTAR CONTRASEÑA
  it('debería alternar entre mostrar y ocultar la contraseña', () => {
    render(<Login />);

    const toggleBtn = screen.getByRole('button', { name: /mostrar contraseña/i });
    const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleBtn).toHaveAttribute('aria-label', 'Ocultar contraseña');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleBtn).toHaveAttribute('aria-label', 'Mostrar contraseña');
  });

  // 12. ENLACE A FORGOT PASSWORD
  it('debería tener enlace funcional a recuperación de contraseña', () => {
    render(<Login />);

    const link = screen.getByRole('link', { name: /¿olvidó su contraseña\?/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  // 13. ENLACE AL PORTAL PRINCIPAL
  it('debería tener enlace funcional al portal principal', () => {
    render(<Login />);

    const link = screen.getByRole('link', { name: /regresar al portal principal/i });
    expect(link).toHaveAttribute('href', '/');
  });

  // 14. LIMPIEZA DE OVERFLOW AL DESMONTAR
  it('debería restaurar el overflow del body al desmontar', () => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    const { unmount } = render(<Login />);

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe(originalBodyOverflow);
    expect(document.documentElement.style.overflow).toBe(originalHtmlOverflow);
  });
});



