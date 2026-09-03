import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../src/pages/Login';
import { loginService } from '../../src/services/auth.services';
import { MemoryRouter, useNavigate } from 'react-router-dom';

vi.mock('../../src/services/auth.services', () => ({
  loginService: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  it('should render login form', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Ingresa tu usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ingresa tu contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al panel/i })).toBeInTheDocument();
  });

  it('should toggle password visibility', () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');
    const toggleBtn = screen.getByRole('button', { name: /Mostrar contraseña/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should show error if fields are empty', async () => {
    renderComponent();
    const submitBtn = screen.getByRole('button', { name: /Ingresar al panel/i });
    
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      const errors = screen.getAllByText('Campo obligatorio');
      expect(errors).toHaveLength(2);
    });
  });

  it('should handle successful login as admin', async () => {
    vi.mocked(loginService).mockResolvedValueOnce({ rol: 'admin' } as any);
    
    renderComponent();
    const user = screen.getByPlaceholderText('Ingresa tu usuario');
    const pass = screen.getByPlaceholderText('Ingresa tu contraseña');
    const submitBtn = screen.getByRole('button', { name: /Ingresar al panel/i });
    
    fireEvent.change(user, { target: { value: 'admin' } });
    fireEvent.change(pass, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(loginService).toHaveBeenCalledWith('admin', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  it('should handle successful login as tecnico', async () => {
    vi.mocked(loginService).mockResolvedValueOnce({ rol: 'tecnico' } as any);
    
    renderComponent();
    const user = screen.getByPlaceholderText('Ingresa tu usuario');
    const pass = screen.getByPlaceholderText('Ingresa tu contraseña');
    const submitBtn = screen.getByRole('button', { name: /Ingresar al panel/i });
    
    fireEvent.change(user, { target: { value: 'tecnico' } });
    fireEvent.change(pass, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(loginService).toHaveBeenCalledWith('tecnico', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/tecnico/dashboard', { replace: true });
    });
  });

  it('should handle successful login as cliente', async () => {
    vi.mocked(loginService).mockResolvedValueOnce({ rol: 'cliente' } as any);
    
    renderComponent();
    const user = screen.getByPlaceholderText('Ingresa tu usuario');
    const pass = screen.getByPlaceholderText('Ingresa tu contraseña');
    const submitBtn = screen.getByRole('button', { name: /Ingresar al panel/i });
    
    fireEvent.change(user, { target: { value: 'cliente' } });
    fireEvent.change(pass, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(loginService).toHaveBeenCalledWith('cliente', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/cliente/dashboard', { replace: true });
    });
  });

  it('should handle login error (401)', async () => {
    vi.mocked(loginService).mockRejectedValueOnce({
      response: { status: 401 }
    });
    
    renderComponent();
    const user = screen.getByPlaceholderText('Ingresa tu usuario');
    const pass = screen.getByPlaceholderText('Ingresa tu contraseña');
    const submitBtn = screen.getByRole('button', { name: /Ingresar al panel/i });
    
    fireEvent.change(user, { target: { value: 'admin' } });
    fireEvent.change(pass, { target: { value: 'wrong' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas. Verifica tu usuario y contraseña.')).toBeInTheDocument();
    });
  });

  it('should handle login error (403)', async () => {
    vi.mocked(loginService).mockRejectedValueOnce({
      response: { status: 403, data: { mensaje: 'Cuenta inactiva' } }
    });
    
    renderComponent();
    const user = screen.getByPlaceholderText('Ingresa tu usuario');
    const pass = screen.getByPlaceholderText('Ingresa tu contraseña');
    const submitBtn = screen.getByRole('button', { name: /Ingresar al panel/i });
    
    fireEvent.change(user, { target: { value: 'admin' } });
    fireEvent.change(pass, { target: { value: 'wrong' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Cuenta inactiva')).toBeInTheDocument();
    });
  });
});
