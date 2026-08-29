import { MemoryRouter } from 'react-router-dom';
import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPassword from '../../src/pages/ForgotPassword/ForgotPassword';
import { requestPasswordReset } from '../../src/services/auth.services';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
const mockNavigate = vi.fn();

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }), getInput: vi.fn() } }));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/services/auth.services');

describe('ForgotPassword Component', () => {
  

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el formulario de recuperación correctamente', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    expect(screen.getByText('Recuperación de Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument();
    expect(screen.getByText(/¿recordaste tu contraseña\?/i)).toBeInTheDocument();
  });

  // 2. VALIDACIÓN: EMAIL VACÍO
  it('debería mostrar error si el correo está vacío', async () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Por favor, ingrese su correo electrónico.',
          icon: 'error',
        })
      );
    });
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  // 3. VALIDACIÓN: FORMATO INVÁLIDO
  it('debería mostrar error si el formato del email es inválido', async () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'invalido' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Formato Inválido',
          text: 'Ingrese un formato de correo válido (ej: usuario@correo.com)',
          icon: 'warning',
        })
      );
    });
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  // 4. ENVÍO EXITOSO
  it('debería enviar la solicitud y navegar al login', async () => {
    (requestPasswordReset as Mock).mockResolvedValue({ data: { success: true } });
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('user@test.com');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Solicitud Enviada',
          text: 'Si el correo está registrado, recibirá un enlace de recuperación.',
          icon: 'success',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // 5. ERROR EN EL SERVICIO
  it('debería mostrar error si falla la solicitud', async () => {
    (requestPasswordReset as Mock).mockRejectedValue(new Error('Error de red'));
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Ocurrió un error al procesar la solicitud.',
          icon: 'error',
        })
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // 6. ESTADO DE CARGA
  it('debería deshabilitar el botón durante la carga', async () => {
    (requestPasswordReset as Mock).mockImplementation(() => new Promise(() => {}));
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviando\.\.\./i })).toBeDisabled();
    });
  });

  // 7. ENLACE A LOGIN
  it('debería tener un enlace funcional para volver al login', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    const link = screen.getByRole('link', { name: /volver a inicio de sesión/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});



