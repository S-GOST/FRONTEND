import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Panel from '../../src/componentes/TableAdmin/Panel';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';
import { clearSession } from '../../src/services/auth.services';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

vi.mock('../../src/services/auth.services', () => ({
  clearSession: vi.fn()
}));

describe('Panel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderPanel = () => {
    return render(
      <MemoryRouter>
        <Panel />
      </MemoryRouter>
    );
  };

  it('should render the panel with default user name', () => {
    renderPanel();
    expect(screen.getByText('ADMIN KTM')).toBeInTheDocument();
  });

  it('should render the panel with user name from localStorage', () => {
    localStorage.setItem('user_name', 'Super Admin');
    renderPanel();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });

  it('should call clearSession when logout is confirmed', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    renderPanel();
    
    const logoutBtn = screen.getByText(/Cerrar sesión/i);
    fireEvent.click(logoutBtn);
    
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: '¿Salir del sistema?'
    }));
    
    await waitFor(() => {
      expect(clearSession).toHaveBeenCalled();
    });
  });

  it('should not call clearSession when logout is cancelled', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    renderPanel();
    
    const logoutBtn = screen.getByText(/Cerrar sesión/i);
    fireEvent.click(logoutBtn);
    
    await waitFor(() => {
      expect(clearSession).not.toHaveBeenCalled();
    });
  });
});
