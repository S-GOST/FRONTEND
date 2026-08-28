import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPassword from '../../src/pages/ForgotPassword/ForgotPassword';
import { requestPasswordReset } from '../../src/services/auth.services';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../src/services/auth.services');

describe('ForgotPassword Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el formulario de recuperación correctamente', () => {
    render(<ForgotPassword />);

    expect(screen.getByText('Recuperación de Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument();
    expect(screen.getByText(/¿recordaste tu contraseña\?/i)).toBeInTheDocument();
  });

  // 2. VALIDACIÓN: EMAIL VACÍO
  it('debería mostrar error si el correo está vacío', async () => {
    render(<ForgotPassword />);

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
    render(<ForgotPassword />);

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
    (requestPasswordReset as jest.Mock).mockResolvedValue({ data: { success: true } });
    render(<ForgotPassword />);

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
    (requestPasswordReset as jest.Mock).mockRejectedValue(new Error('Error de red'));
    render(<ForgotPassword />);

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
    (requestPasswordReset as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<ForgotPassword />);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviando\.\.\./i })).toBeDisabled();
    });
  });

  // 7. ENLACE A LOGIN
  it('debería tener un enlace funcional para volver al login', () => {
    render(<ForgotPassword />);

    const link = screen.getByRole('link', { name: /volver a inicio de sesión/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});