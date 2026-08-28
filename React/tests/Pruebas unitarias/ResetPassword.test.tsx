import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPassword from '../../src/pages/ResetPassword/ResetPassword';
import { resetPassword } from '../../src/services/auth.services';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({}),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useParams: () => ({ token: 'abc123token' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../src/services/auth.services');

describe('ResetPassword Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (require('react-router-dom').useNavigate as Mock).mockReturnValue(mockNavigate);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el formulario correctamente', () => {
    render(<ResetPassword />);

    expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirmar contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar nueva contraseña/i })).toBeInTheDocument();
  });

  // 2. VALIDACIÓN: CAMPOS VACÍOS
  it('debería mostrar error si los campos están vacíos', async () => {
    render(<ResetPassword />);

    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Por favor, complete ambos campos.',
          icon: 'error',
        })
      );
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  // 3. VALIDACIÓN: CONTRASEÑA DÉBIL
  it('debería mostrar error si la contraseña no cumple requisitos', async () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Contraseña no cumple requisitos',
          text: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.',
          icon: 'warning',
        })
      );
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  // 4. VALIDACIÓN: CONTRASEÑAS NO COINCIDEN
  it('debería mostrar error si las contraseñas no coinciden', async () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'DifferentPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Las contraseñas no coinciden.',
          icon: 'error',
        })
      );
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  // 5. INDICADOR DE FORTALEZA - MUY DÉBIL
  it('debería mostrar "Muy débil" para contraseña corta sin requisitos', () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'a' } });

    expect(screen.getByText('Muy débil')).toBeInTheDocument();
    expect(screen.getByText('Muy débil')).toHaveStyle('color: #ff4444');
  });

  // 6. INDICADOR DE FORTALEZA - FUERTE
  it('debería mostrar "Fuerte" para contraseña que cumple todos los requisitos', () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'StrongPass123!' } });

    expect(screen.getByText('Fuerte')).toBeInTheDocument();
    expect(screen.getByText('Fuerte')).toHaveStyle('color: #88cc00');
  });

  // 7. ADVERTENCIA DE NO COINCIDENCIA EN TIEMPO REAL
  it('debería mostrar advertencia cuando las contraseñas no coinciden', () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'Pass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'Different123!' } });

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  // 8. ENVÍO EXITOSO
  it('debería enviar la nueva contraseña y navegar al login', async () => {
    (resetPassword as Mock).mockResolvedValue({ data: { success: true } });
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('abc123token', 'StrongPass123!');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '¡Contraseña Actualizada!',
          icon: 'success',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // 9. ERROR EN EL SERVICIO CON MENSAJE PERSONALIZADO
  it('debería mostrar mensaje de error personalizado del servidor', async () => {
    (resetPassword as Mock).mockRejectedValue({
      response: { data: { mensaje: 'Token expirado' } },
    });
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Token expirado',
          icon: 'error',
        })
      );
    });
  });

  // 10. ERROR GENÉRICO SIN MENSAJE DEL SERVIDOR
  it('debería mostrar mensaje genérico si no hay mensaje del servidor', async () => {
    (resetPassword as Mock).mockRejectedValue(new Error('Error desconocido'));
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Token inválido o expirado. Solicite un nuevo enlace.',
          icon: 'error',
        })
      );
    });
  });

  // 11. ESTADO DE CARGA
  it('debería deshabilitar el botón durante la carga', async () => {
    (resetPassword as Mock).mockImplementation(() => new Promise(() => {}));
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nueva contraseña/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardando\.\.\./i })).toBeDisabled();
    });
  });

  // 12. TOGGLE MOSTRAR/OCULTAR CONTRASEÑA
  it('debería alternar entre mostrar y ocultar la contraseña', () => {
    render(<ResetPassword />);

    const toggleBtn = screen.getAllByRole('button', { name: /bi-eye/i })[0];
    const passwordInput = screen.getByPlaceholderText('Nueva contraseña');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // 13. ENLACE A LOGIN
  it('debería tener un enlace funcional para volver al login', () => {
    render(<ResetPassword />);

    const link = screen.getByRole('link', { name: /volver a inicio de sesión/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});



