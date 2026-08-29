import { MemoryRouter } from 'react-router-dom';
import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Registro from '../../src/pages/Registro';
import { insertarCliente } from '../../src/services/cliente.service';
import { obtenerTiposDocumento } from '../../src/services/tipoDocumento.service';
import { loginService } from '../../src/services/auth.services';

// 1. MOCKS DE MÓDULOS EXTERNOS
const mockNavigate = vi.fn();

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }), getInput: vi.fn() } }));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/tipoDocumento.service');
vi.mock('../../src/services/auth.services');

describe('Registro Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    (obtenerTiposDocumento as Mock).mockResolvedValue({
      data: [
        { id_tipo_documento: 1, nombre: 'Cédula' },
        { id_tipo_documento: 2, nombre: 'Pasaporte' },
      ],
    });
  });

  it('debería renderizar el formulario de registro correctamente', async () => {
    render(<MemoryRouter><Registro /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Únete a KTM')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Número de Documento')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /completar registro/i })).toBeInTheDocument();
    });
  });

  it('debería cargar los tipos de documento al montar', async () => {
    render(<MemoryRouter><Registro /></MemoryRouter>);

    await waitFor(() => {
      expect(obtenerTiposDocumento).toHaveBeenCalled();
      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Cédula');
      expect(select).toHaveTextContent('Pasaporte');
    });
  });

  it('debería registrar cliente exitosamente', async () => {
    (insertarCliente as Mock).mockResolvedValue({ data: { data: { id_usuario: '123' } } });
    (loginService as Mock).mockResolvedValue({ token: 'fake-token' });

    render(<MemoryRouter><Registro /></MemoryRouter>);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(insertarCliente).toHaveBeenCalledWith(expect.objectContaining({
        numero_documento: '1234567890',
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
      }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('debería mostrar error si falla el registro del cliente', async () => {
    (insertarCliente as Mock).mockRejectedValue({
      response: { data: { message: 'El usuario ya existe' } }
    });

    render(<MemoryRouter><Registro /></MemoryRouter>);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(screen.getByText('El usuario ya existe')).toBeInTheDocument();
    });
  });

  it('debería mostrar múltiples errores de validación del servidor', async () => {
    (insertarCliente as Mock).mockRejectedValue({
      response: { 
        data: { 
          message: 'Errores de validación',
          errores: [
            { campo: 'correo', mensaje: 'Formato inválido' },
            { campo: 'telefono', mensaje: 'Debe tener 10 dígitos' }
          ]
        }
      }
    });

    render(<MemoryRouter><Registro /></MemoryRouter>);
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'invalido@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(screen.getByText('Errores de validación')).toBeInTheDocument();
      expect(screen.getByText(/Formato inválido/i)).toBeInTheDocument();
      expect(screen.getByText(/Debe tener 10 dígitos/i)).toBeInTheDocument();
    });
  });

  it('debería alternar entre mostrar y ocultar la contraseña', async () => {
    render(<MemoryRouter><Registro /></MemoryRouter>);

    const passwordInput = screen.getByPlaceholderText('Contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' }); 

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('debería tener enlace funcional para iniciar sesión', async () => {
    render(<MemoryRouter><Registro /></MemoryRouter>);

    const link = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('debería mostrar opciones por defecto si no hay tipos de documento', async () => {
    (obtenerTiposDocumento as Mock).mockResolvedValue({ data: [] });
    render(<MemoryRouter><Registro /></MemoryRouter>);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Cédula de Ciudadanía (CC)');
      expect(select).toHaveTextContent('Cédula de Extranjería (CE)');
      expect(select).toHaveTextContent('Tarjeta de Identidad (TI)');
    });
  });
});
