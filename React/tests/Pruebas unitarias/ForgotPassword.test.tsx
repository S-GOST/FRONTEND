import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPassword from '../../src/pages/ForgotPassword/ForgotPassword';
import { requestPasswordReset } from '../../src/services/auth.services';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/auth.services', () => ({
  requestPasswordReset: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );

  it('should render form', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar enlace de recuperación/i })).toBeInTheDocument();
  });

  it('should show warning if email is invalid', () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const submitBtn = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitBtn);
    
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Formato Inválido'
    }));
  });

  it('should submit successfully', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const submitBtn = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle API error', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValueOnce(new Error('Network Error'));
    
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const submitBtn = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error'
      }));
    });
  });
});