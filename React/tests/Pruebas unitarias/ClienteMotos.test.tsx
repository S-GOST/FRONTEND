import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClienteMotos from '../../src/componentes/TableCliente/ClienteMotos';
import * as motoService from '../../src/services/moto.service';
import Swal from 'sweetalert2';

// 1. VARIABLES DE MOCK
const mockNavigate = jest.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// 3. MOCKS DE SERVICIOS (mismas rutas que los imports)
jest.mock('../../src/services/moto.service');

// ==================== DATOS DE PRUEBA ====================
const mockMotos = [
  { ID_MOTOS: 1, ID_CLIENTES: '100', placa: 'ABC12D', marca: 'KTM', modelo: 'Duke 390', cilindraje: 390, kilometraje: 15000 },
  { ID_MOTOS: 2, ID_CLIENTES: '100', Placa: 'XYZ34E', Marca: 'Yamaha', Modelo: 'FZ 2.0' },
  { ID_MOTOS: 3, ID_CLIENTES: '200', placa: 'OTR99F', marca: 'AKT', modelo: 'NK 125' }, // De otro cliente
];

describe('ClienteMotos Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('user_id', '100');
    jest.mocked(motoService.obtenerMotos).mockResolvedValue({ data: mockMotos } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el encabezado con título y botón agregar', () => {
    render(<ClienteMotos />);

    expect(screen.getByText('Mis Motocicletas')).toBeInTheDocument();
    expect(screen.getByText('Administra las motos asociadas a tu cuenta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar moto/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando tus motocicletas..." mientras consulta la API', () => {
    jest.mocked(motoService.obtenerMotos).mockImplementation(() => new Promise(() => {}));
    render(<ClienteMotos />);

    expect(screen.getByText(/cargando tus motocicletas/i)).toBeInTheDocument();
  });

  // 3. FILTRADO DE MOTOS POR CLIENTE
  it('debería mostrar solo las motos del cliente actual', async () => {
    render(<ClienteMotos />);

    await waitFor(() => {
      expect(screen.getByText('ABC12D')).toBeInTheDocument();
      expect(screen.getByText('XYZ34E')).toBeInTheDocument();
    });

    // La moto del cliente 200 no aparece
    expect(screen.queryByText('OTR99F')).not.toBeInTheDocument();
  });

  // 4. CONTENIDO DE TARJETAS DE MOTO
  it('debería mostrar placa, marca, modelo y especificaciones en las tarjetas', async () => {
    render(<ClienteMotos />);

    await waitFor(() => {
      expect(screen.getByText('ABC12D')).toBeInTheDocument();
    });

    // Marca y modelo
    expect(screen.getByText('KTM')).toBeInTheDocument();
    expect(screen.getByText('Duke 390')).toBeInTheDocument();

    // Especificaciones formateadas
    expect(screen.getByText('390cc')).toBeInTheDocument();
    expect(screen.getByText(`${(15000).toLocaleString('es-CO')} km`)).toBeInTheDocument();
  });

  // 5. ESTADO VACÍO
  it('debería mostrar mensaje y botón de primera moto cuando no hay motos', async () => {
    jest.mocked(motoService.obtenerMotos).mockResolvedValue({ data: [] } as any);
    render(<ClienteMotos />);

    await waitFor(() => {
      expect(screen.getByText('No tienes motos registradas')).toBeInTheDocument();
    });

    // El botón del estado vacío abre el formulario
    fireEvent.click(screen.getByRole('button', { name: /agregar mi primera moto/i }));
    expect(screen.getByText('Nueva Motocicleta')).toBeInTheDocument();
  });

  // 6. MOSTRAR Y OCULTAR FORMULARIO
  it('debería alternar el formulario con el botón Agregar/Cancelar', async () => {
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando tus motocicletas/i)).not.toBeInTheDocument());

    // Abrir
    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));
    expect(screen.getByText('Nueva Motocicleta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();

    // Cerrar
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByText('Nueva Motocicleta')).not.toBeInTheDocument();
  });

  // 7. BOTÓN VOLVER
  it('debería navegar a /cliente con el botón de volver', async () => {
    render(<ClienteMotos />);

    fireEvent.click(document.querySelector('.cm-back-btn') as HTMLElement);
    expect(mockNavigate).toHaveBeenCalledWith('/cliente');
  });

  // 8. PLACA EN MAYÚSCULAS AUTOMÁTICAS
  it('debería convertir la placa a mayúsculas al escribir', async () => {
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));

    const placaInput = screen.getByPlaceholderText('Ej: ABC123');
    fireEvent.change(placaInput, { target: { value: 'abc123' } });

    expect(placaInput).toHaveValue('ABC123');
  });

  // 9. VALIDACIÓN DE CAMPOS OBLIGATORIOS
  it('debería mostrar alerta si faltan placa, marca o modelo', async () => {
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));
    fireEvent.click(screen.getByRole('button', { name: /registrar motocicleta/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Campos obligatorios',
        'Placa, marca y modelo son requeridos.',
        'warning'
      );
      expect(motoService.insertarMoto).not.toHaveBeenCalled();
    });
  });

  // 10. ERROR DE SESIÓN SIN USER_ID
  it('debería mostrar alerta de sesión si no hay usuario identificado', async () => {
    localStorage.removeItem('user_id');
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));

    fireEvent.change(screen.getByPlaceholderText('Ej: ABC123'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: KTM'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Duke 390'), { target: { value: 'Duke 390' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar motocicleta/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Error de sesión',
        'No se pudo identificar tu usuario. Intenta cerrar sesión e ingresar de nuevo.',
        'error'
      );
    });
  });

  // 11. REGISTRO EXITOSO DE MOTO
  it('debería registrar la moto con el payload correcto y cerrar el formulario', async () => {
    jest.mocked(motoService.insertarMoto).mockResolvedValue({ data: { success: true } } as any);
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));

    fireEvent.change(screen.getByPlaceholderText('Ej: ABC123'), { target: { value: 'nueva99' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: KTM'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Duke 390'), { target: { value: 'Duke 200' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 390'), { target: { value: '200' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 15000'), { target: { value: '5000' } });

    fireEvent.click(screen.getByRole('button', { name: /registrar motocicleta/i }));

    await waitFor(() => {
      expect(motoService.insertarMoto).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_CLIENTES: '100',
          Placa: 'NUEVA99', // Mayúsculas
          marca: 'KTM',
          modelo: 'Duke 200',
          cilindraje: 200, // Number
          kilometraje: 5000,
          Recorrido: 5000,
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¡Moto registrada!', icon: 'success' })
      );
    });

    // El formulario se cierra
    await waitFor(() => {
      expect(screen.queryByText('Nueva Motocicleta')).not.toBeInTheDocument();
    });
  });

  // 12. ERROR AL REGISTRAR
  it('debería mostrar alerta de error si falla el registro', async () => {
    jest.mocked(motoService.insertarMoto).mockRejectedValue({
      response: { data: { message: 'La placa ya existe' } },
    });
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));
    fireEvent.change(screen.getByPlaceholderText('Ej: ABC123'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: KTM'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Duke 390'), { target: { value: 'Duke' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar motocicleta/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'La placa ya existe', 'error');
    });
  });

  // 13. BOTÓN DESHABILITADO MIENTRAS GUARDA
  it('debería deshabilitar el botón y mostrar "Registrando..." durante el guardado', async () => {
    jest.mocked(motoService.insertarMoto).mockImplementation(() => new Promise(() => {}));
    render(<ClienteMotos />);
    await waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /agregar moto/i }));
    fireEvent.change(screen.getByPlaceholderText('Ej: ABC123'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: KTM'), { target: { value: 'KTM' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: Duke 390'), { target: { value: 'Duke' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar motocicleta/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /registrando/i });
      expect(btn).toBeDisabled();
    });
  });
});