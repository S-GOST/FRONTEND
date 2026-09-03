import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from '../../src/pages/ResetPassword/ResetPassword';
import { resetPassword } from '../../src/services/auth.services';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/auth.services', () => ({
  resetPassword: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: 'mock-token' })
  };
});

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );

  it('should render form', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirmar contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar nueva contraseña/i })).toBeInTheDocument();
  });

  it('should toggle password visibility', () => {
    renderComponent();
    const newPassInput = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPassInput = screen.getByPlaceholderText('Confirmar contraseña');
    const buttons = screen.getAllByRole('button');
    
    expect(newPassInput).toHaveAttribute('type', 'password');
    expect(confirmPassInput).toHaveAttribute('type', 'password');
    
    // Toggle new pass
    fireEvent.click(buttons[0]);
    expect(newPassInput).toHaveAttribute('type', 'text');
    
    // Toggle confirm pass
    fireEvent.click(buttons[1]);
    expect(confirmPassInput).toHaveAttribute('type', 'text');
  });

  it('should show warning if passwords do not match', () => {
    renderComponent();
    const newPass = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPass = screen.getByPlaceholderText('Confirmar contraseña');
    
    fireEvent.change(newPass, { target: { value: 'Pass123!' } });
    fireEvent.change(confirmPass, { target: { value: 'Pass1234!' } });
    
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('should show error if passwords do not meet requirements', async () => {
    renderComponent();
    const newPass = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPass = screen.getByPlaceholderText('Confirmar contraseña');
    const submitBtn = screen.getByRole('button', { name: /Guardar nueva contraseña/i });
    
    fireEvent.change(newPass, { target: { value: 'pass' } });
    fireEvent.change(confirmPass, { target: { value: 'pass' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Contraseña no cumple requisitos'
      }));
    });
  });

  it('should submit successfully', async () => {
    vi.mocked(resetPassword).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    const newPass = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPass = screen.getByPlaceholderText('Confirmar contraseña');
    const submitBtn = screen.getByRole('button', { name: /Guardar nueva contraseña/i });
    
    fireEvent.change(newPass, { target: { value: 'ValidPass123!' } });
    fireEvent.change(confirmPass, { target: { value: 'ValidPass123!' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('mock-token', 'ValidPass123!');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle API error', async () => {
    vi.mocked(resetPassword).mockRejectedValueOnce({
      response: { data: { mensaje: 'Token inválido' } }
    });
    
    renderComponent();
    const newPass = screen.getByPlaceholderText('Nueva contraseña');
    const confirmPass = screen.getByPlaceholderText('Confirmar contraseña');
    const submitBtn = screen.getByRole('button', { name: /Guardar nueva contraseña/i });
    
    fireEvent.change(newPass, { target: { value: 'ValidPass123!' } });
    fireEvent.change(confirmPass, { target: { value: 'ValidPass123!' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        text: 'Token inválido'
      }));
    });
  });
});
