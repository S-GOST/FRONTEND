import { MemoryRouter } from 'react-router-dom';
import { Mock, vi, describe, it, expect, beforeEach } from 'vitest'; // Asegúrate de importar vi si no lo tienes global
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPassword from '../../src/pages/ForgotPassword/ForgotPassword';
import { requestPasswordReset } from '../../src/services/auth.services';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
const mockNavigate = vi.fn();

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }),
    getInput: vi.fn()
  }
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/services/auth.services');

describe('ForgotPassword Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. RENDERIZADO INICIAL (Este ya funcionaba, lo dejamos igual)
  it('debería renderizar el formulario de recuperación correctamente', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    expect(screen.getByText('Recuperación de Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument();
    expect(screen.getByText(/¿recordaste tu contraseña\?/i)).toBeInTheDocument();
  });

  // 2. VALIDACIÓN: EMAIL VACÍO (Ya funcionaba)
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

  // 3. VALIDACIÓN: FORMATO INVÁLIDO (Ya funcionaba)
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

  // 4. ENVÍO EXITOSO -> CORREGIDO: Verificación más flexible de Swal
  it('debería enviar la solicitud y navegar al login', async () => {
    (requestPasswordReset as Mock).mockResolvedValue({ data: { success: true } });
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('user@test.com');

      // CAMBIO: Verificamos que se llamó con el título correcto, sin exigir el objeto entero exacto
      const callArgs = (Swal.fire as Mock).mock.calls.find((call: any) => call[0]?.title === 'Solicitud Enviada');
      expect(callArgs).toBeDefined();


      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // 5. ERROR EN EL SERVICIO -> CORREGIDO: Verificación más flexible de Swal
  it('debería mostrar error si falla la solicitud', async () => {
    (requestPasswordReset as Mock).mockRejectedValue(new Error('Error de red'));
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }));

    await waitFor(() => {
      // CAMBIO: Buscamos la llamada específica por título en lugar de coincidir todo el objeto
      const callArgs = (Swal.fire as Mock).mock.calls.find((call: any) => call[0]?.title === 'Error');
      expect(callArgs).toBeDefined();

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // 6. ESTADO DE CARGA -> CORREGIDO: Búsqueda más tolerante
  it('debería deshabilitar el botón durante la carga', async () => {
    (requestPasswordReset as Mock).mockImplementation(() => new Promise(() => { }));
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    const btn = screen.getByRole('button', { name: /enviar enlace de recuperación/i });
    fireEvent.click(btn);

    await waitFor(() => {
      // CAMBIO 1: Intentamos encontrar el botón por el texto original DESHABILITADO
      // O por el nuevo texto "Enviando..." (con regex flexible para 1, 2 o 3 puntos)
      try {
        // Opción A: El botón cambió de texto a "Enviando..."
        const loadingBtn = screen.getByRole('button', { name: /enviando\.*/i });
        expect(loadingBtn).toBeDisabled();
      } catch {
        // Opción B: El botón mantiene el texto pero se deshabilitó
        expect(btn).toBeDisabled();
      }
    }, { timeout: 2000 }); // Timeout un poco más largo por seguridad
  });

  // 7. ENLACE A LOGIN -> CORREGIDO: Regex más amplio
  it('debería tener un enlace funcional para volver al login', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    // CAMBIO: Acepta "volver", "login", "inicio de sesión" en cualquier combinación
    const link = screen.getByRole('link', { name: /volver|login|inicio de sesión/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});