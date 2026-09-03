import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Registro from '../../src/pages/Registro';
import { insertarCliente } from '../../src/services/cliente.service';
import { obtenerTiposDocumento } from '../../src/services/tipoDocumento.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/cliente.service', () => ({
  insertarCliente: vi.fn()
}));
vi.mock('../../src/services/tipoDocumento.service', () => ({
  obtenerTiposDocumento: vi.fn()
}));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('Registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerTiposDocumento).mockResolvedValue({ data: { data: [{ id_tipo_documento: 1, nombre: 'CC' }, { id_tipo_documento: 2, nombre: 'CE' }] } } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <Registro />
    </MemoryRouter>
  );

  it('should render registration form and load document types', async () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Número de Documento')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('CC')).toBeInTheDocument();
      expect(screen.getByText('CE')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const buttons = screen.getAllByRole('button');
    const toggleBtnElement = buttons.find(btn => btn.querySelector('.bi-eye') || btn.querySelector('.bi-eye-slash'));
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    if (toggleBtnElement) fireEvent.click(toggleBtnElement);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    if (toggleBtnElement) fireEvent.click(toggleBtnElement);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should handle successful registration', async () => {
    vi.mocked(insertarCliente).mockResolvedValueOnce({ data: { success: true } } as any);
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('CC')).toBeInTheDocument());
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogota' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'Password123!' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Completar Registro/i }));
    
    await waitFor(() => {
      expect(insertarCliente).toHaveBeenCalledWith(expect.objectContaining({
        numero_documento: '12345678',
        nombre: 'Test User',
        usuario: 'testuser',
        password: 'Password123!'
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle server validation errors', async () => {
    vi.mocked(insertarCliente).mockRejectedValueOnce({
      response: { data: { message: 'Errores de validación', errores: [{ campo: 'correo', mensaje: 'Ya existe' }] } }
    });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('CC')).toBeInTheDocument());
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogota' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'Password123!' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Completar Registro/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Errores de validación')).toBeInTheDocument();
      expect(screen.getByText(/Ya existe/i)).toBeInTheDocument();
    });
  });
});
