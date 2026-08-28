import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Registro from '../../src/pages/Registro';
import { insertarCliente,} from '../../src/services/cliente.service';
import { insertarMoto,} from '../../src/services/moto.service';
import { obtenerTiposDocumento,} from '../../src/services/tipoDocumento.service';
import { loginService } from '../../src/services/auth.services';

// 1. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({}),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/moto.service');
vi.mock('../../src/services/tipoDocumento.service');
vi.mock('../../src/services/auth.services');

describe('Registro Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (require('react-router-dom').useNavigate as Mock).mockReturnValue(mockNavigate);
    
    // Mock por defecto para tipos de documento
    (obtenerTiposDocumento as Mock).mockResolvedValue({
      data: [
        { id_tipo_documento: 1, nombre: 'Cédula' },
        { id_tipo_documento: 2, nombre: 'Pasaporte' },
      ],
    });
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el formulario de registro correctamente', async () => {
    render(<Registro />);

    await waitFor(() => {
      expect(screen.getByText('Únete a KTM')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Número de Documento')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nombre Completo')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Placa')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /completar registro/i })).toBeInTheDocument();
    });
  });

  // 2. CARGA DE TIPOS DE DOCUMENTO
  it('debería cargar los tipos de documento al montar', async () => {
    render(<Registro />);

    await waitFor(() => {
      expect(obtenerTiposDocumento).toHaveBeenCalled();
      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Cédula');
      expect(select).toHaveTextContent('Pasaporte');
    });
  });

  // 3. VALIDACIÓN: CAMPOS REQUERIDOS VACÍOS
  it('debería mostrar errores si los campos requeridos están vacíos', async () => {
    render(<Registro />);

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/requerido/i)).toHaveLength(10); // Todos los campos required
    });
    expect(insertarCliente).not.toHaveBeenCalled();
  });

  // 4. REGISTRO EXITOSO
  it('debería registrar cliente y moto exitosamente', async () => {
    (insertarCliente as Mock).mockResolvedValue({ data: { data: { id_usuario: '123' } } });
    (insertarMoto as Mock).mockResolvedValue({ data: { success: true } });
    (loginService as Mock).mockResolvedValue({ token: 'fake-token' });

    render(<Registro />);

    // Llenar formulario
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });
    
    fireEvent.change(screen.getByPlaceholderText('Placa'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Marca (Ej: KTM)'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Modelo (Año)'), { target: { value: '2023' } });
    fireEvent.change(screen.getByPlaceholderText('Cilindraje'), { target: { value: '390' } });
    fireEvent.change(screen.getByPlaceholderText('Kilometraje'), { target: { value: '15000' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(insertarCliente).toHaveBeenCalledWith(expect.objectContaining({
        numero_documento: '1234567890',
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
      }));
      
      expect(loginService).toHaveBeenCalledWith('juanp', 'StrongPass123!');
      
      expect(insertarMoto).toHaveBeenCalledWith(expect.objectContaining({
        Placa: 'ABC123',
        Marca: 'KTM',
      }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // 5. ERROR EN REGISTRO DE CLIENTE
  it('debería mostrar error si falla el registro del cliente', async () => {
    (insertarCliente as Mock).mockRejectedValue({
      response: { data: { message: 'El usuario ya existe' } }
    });

    render(<Registro />);

    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Placa'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Marca (Ej: KTM)'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Modelo (Año)'), { target: { value: '2023' } });
    fireEvent.change(screen.getByPlaceholderText('Cilindraje'), { target: { value: '390' } });
    fireEvent.change(screen.getByPlaceholderText('Kilometraje'), { target: { value: '15000' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(screen.getByText('El usuario ya existe')).toBeInTheDocument();
    });
  });

  // 6. ERROR CON MÚLTIPLES ERRORES DE VALIDACIÓN
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

    render(<Registro />);

    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'invalido' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Placa'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Marca (Ej: KTM)'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Modelo (Año)'), { target: { value: '2023' } });
    fireEvent.change(screen.getByPlaceholderText('Cilindraje'), { target: { value: '390' } });
    fireEvent.change(screen.getByPlaceholderText('Kilometraje'), { target: { value: '15000' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(screen.getByText('Errores de validación')).toBeInTheDocument();
      expect(screen.getByText('correo: Formato inválido')).toBeInTheDocument();
      expect(screen.getByText('telefono: Debe tener 10 dígitos')).toBeInTheDocument();
    });
  });

  // 7. VALIDACIÓN DE CONTRASEÑA DÉBIL
  it('debería mostrar error si la contraseña no cumple requisitos', async () => {
    render(<Registro />);

    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'weak' } });
    fireEvent.blur(screen.getByPlaceholderText('Contraseña'));

    await waitFor(() => {
      expect(screen.getByText('Debe incluir mayúsculas, minúsculas, números y símbolos')).toBeInTheDocument();
    });
  });

  // 8. VALIDACIÓN DE MODELO INVÁLIDO
  it('debería mostrar error si el modelo no es un año válido', async () => {
    render(<Registro />);

    fireEvent.change(screen.getByPlaceholderText('Modelo (Año)'), { target: { value: 'abcd' } });
    fireEvent.blur(screen.getByPlaceholderText('Modelo (Año)'));

    await waitFor(() => {
      expect(screen.getByText('Debe ser un año de 4 dígitos')).toBeInTheDocument();
    });
  });

  // 9. TOGGLE MOSTRAR/OCULTAR CONTRASEÑA
  it('debería alternar entre mostrar y ocultar la contraseña', async () => {
    render(<Registro />);

    const toggleBtn = screen.getByRole('button', { name: /bi-eye/i });
    const passwordInput = screen.getByPlaceholderText('Contraseña');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // 10. ESTADO DE CARGA
  it('debería deshabilitar el botón durante la carga', async () => {
    (insertarCliente as Mock).mockImplementation(() => new Promise(() => {}));
    render(<Registro />);

    fireEvent.change(screen.getByPlaceholderText('Número de Documento'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre Completo'), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('Correo Electrónico'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Ciudad / Ubicación'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Usuario para Login'), { target: { value: 'juanp' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Placa'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Marca (Ej: KTM)'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Modelo (Año)'), { target: { value: '2023' } });
    fireEvent.change(screen.getByPlaceholderText('Cilindraje'), { target: { value: '390' } });
    fireEvent.change(screen.getByPlaceholderText('Kilometraje'), { target: { value: '15000' } });

    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /registrando\.\.\./i })).toBeDisabled();
    });
  });

  // 11. ENLACE A LOGIN
  it('debería tener enlace funcional para iniciar sesión', async () => {
    render(<Registro />);

    const link = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  // 12. FALLBACK CUANDO NO HAY TIPOS DE DOCUMENTO
  it('debería mostrar opciones por defecto si no hay tipos de documento', async () => {
    (obtenerTiposDocumento as Mock).mockResolvedValue({ data: [] });
    render(<Registro />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Cédula de Ciudadanía (CC)');
      expect(select).toHaveTextContent('Cédula de Extranjería (CE)');
      expect(select).toHaveTextContent('Tarjeta de Identidad (TI)');
    });
  });
});



