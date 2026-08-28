import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor,} from '@testing-library/react';
import '@testing-library/jest-dom';
import Usuarios from '../../src/componentes/TableAdmin/Usuarios';
import * as adminService from '../../src/services/admin.service';
import * as tecnicoService from '../../src/services/tecnico.service';
import * as clienteService from '../../src/services/cliente.service';
import * as tipoDocService from '../../src/services/tipoDocumento.service';
import Swal from 'sweetalert2';

// 1. VARIABLES DE MOCK ANTES DE LOS Mock
const mockNavigate = vi.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: 'Documento no válido' }),
  showValidationMessage: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin/usuarios' }),
}));

// Mock del componente FormattedId para simplificar
vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 3. MOCKS DE SERVICIOS (mismas rutas que los imports)
vi.mock('../../src/services/admin.service');
vi.mock('../../src/services/tecnico.service');
vi.mock('../../src/services/cliente.service');
vi.mock('../../src/services/tipoDocumento.service');

// ==================== DATOS DE PRUEBA ====================
const mockAdmins = [
  { numero_documento: '1001', nombre: 'Admin Uno', correo: 'admin@test.com', telefono: '3001112233', usuario: 'admin1', id_tipo_documento: 1, estado: 1 },
  { numero_documento: '1002', nombre: 'Admin Inactivo', correo: 'inactivo@test.com', telefono: '3001112234', usuario: 'admin2', id_tipo_documento: 1, estado: 0 },
];
const mockTecnicos = [
  { numero_documento: '2001', nombre: 'Técnico Uno', correo: 'tec@test.com', telefono: '3002223344', usuario: 'tec1', id_tipo_documento: 1, estado: 1 },
];
const mockClientes = [
  { numero_documento: '3001', nombre: 'Cliente Uno', correo: 'cli@test.com', telefono: '3003334455', usuario: 'cli1', id_tipo_documento: 2, ciudad: 'Bogotá', estado: 1 },
];
const mockPendientes = [
  { numero_documento: '4001', nombre: 'Pendiente Uno', correo: 'pen@test.com', telefono: '3004445566', usuario: 'pen1', id_tipo_documento: 2, ciudad: 'Cali', estado: 'Pendiente' },
];
const mockTipos = [
  { id_tipo_documento: 1, nombre: 'Cédula' },
  { id_tipo_documento: 2, nombre: 'CE' },
];

describe('Usuarios Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(adminService.obtenerAdmins).mockResolvedValue({ data: { admins: mockAdmins } } as any);
    jest.mocked(tecnicoService.obtenerTecnicos).mockResolvedValue({ data: { tecnicos: mockTecnicos } } as any);
    jest.mocked(clienteService.obtenerClientes).mockResolvedValue({ data: { clientes: mockClientes } } as any);
    jest.mocked(clienteService.obtenerClientesPendientes).mockResolvedValue({ data: { data: mockPendientes } } as any);
    jest.mocked(tipoDocService.obtenerTiposDocumento).mockResolvedValue({ data: mockTipos } as any);
  });

  // 1. RENDERIZADO INICIAL Y TARJETAS RESUMEN
  it('debería renderizar el título y las tarjetas resumen con los conteos', async () => {
    const { container } = render(<Usuarios />);

    expect(screen.getByText('Usuarios')).toBeInTheDocument();

    await waitFor(() => {
      const cards = container.querySelectorAll('.summary-card strong');
      expect(cards).toHaveLength(4);
      expect(cards[0]).toHaveTextContent('2'); // Admins
      expect(cards[1]).toHaveTextContent('1'); // Técnicos
      expect(cards[2]).toHaveTextContent('1'); // Clientes
      expect(cards[3]).toHaveTextContent('1'); // Pendientes
    });
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando usuarios..." mientras consulta la API', () => {
    jest.mocked(adminService.obtenerAdmins).mockImplementation(() => new Promise(() => {}));
    render(<Usuarios />);
    expect(screen.getByText(/cargando usuarios/i)).toBeInTheDocument();
  });

  // 3. TABLA CON DATOS Y TIPO DE DOCUMENTO FORMATEADO
  it('debería mostrar los usuarios en la tabla con el tipo de documento formateado', async () => {
    render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('Admin Uno')).toBeInTheDocument();
      expect(screen.getByText('Admin Inactivo')).toBeInTheDocument();
    });

    // El id_tipo_documento 1 debe mostrarse como "Cédula"
    expect(screen.getAllByText('Cédula').length).toBeGreaterThan(0);
    // Estado activo e inactivo
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  // 4. CAMBIO DE PESTAÑA Y NAVEGACIÓN
  it('debería navegar a la ruta correcta al cambiar de pestaña', async () => {
    render(<Usuarios />);

    fireEvent.click(screen.getByRole('button', { name: 'Técnicos' }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/tecnicos');

    fireEvent.click(screen.getByRole('button', { name: 'Clientes' }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/clientes');

    fireEvent.click(screen.getByRole('button', { name: 'Administradores' }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/usuarios');
  });

  // 5. BÚSQUEDA DE USUARIOS
  it('debería filtrar usuarios al buscar', async () => {
    render(<Usuarios />);

    await waitFor(() => expect(screen.getByText('Admin Uno')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/buscar en/i);
    fireEvent.change(searchInput, { target: { value: 'Admin Uno' } });
    fireEvent.click(screen.getByTitle('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('Admin Uno')).toBeInTheDocument();
      expect(screen.queryByText('Admin Inactivo')).not.toBeInTheDocument();
    });
  });

  // 6. BÚSQUEDA SIN RESULTADOS
  it('debería mostrar mensaje cuando la búsqueda no tiene resultados', async () => {
    render(<Usuarios />);

    await waitFor(() => expect(screen.getByText('Admin Uno')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar en/i), { target: { value: 'zzz' } });
    fireEvent.click(screen.getByTitle('Buscar'));

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron resultados/i)).toBeInTheDocument();
    });
  });

  // 7. BOTÓN VOLVER AL DASHBOARD
  it('debería navegar al dashboard con el botón de volver', async () => {
    render(<Usuarios />);
    fireEvent.click(screen.getByTitle('Volver al Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  // 8. ABRIR MODAL DE CREACIÓN
it('debería abrir el modal de creación con el formulario vacío', async () => {
  render(<Usuarios />);

  fireEvent.click(screen.getByRole('button', { name: /nuevo administrador/i }));

  expect(screen.getByText('Crear Administrador')).toBeInTheDocument();

  const modal = screen.getByText('Crear Administrador').closest('.modal-container') as HTMLElement;

  // Verificar que los campos del formulario están vacíos
  expect(modal.querySelector('input[name="nombre"]')).toHaveValue('');
  expect(modal.querySelector('input[name="correo"]')).toHaveValue('');
  expect(modal.querySelector('input[name="numero_documento"]')).toHaveValue('');
  expect(modal.querySelector('input[name="usuario"]')).toHaveValue('');
});

  // 9. CREAR USUARIO EXITOSAMENTE
  it('debería crear un administrador y llamar al servicio', async () => {
    render(<Usuarios />);

    fireEvent.click(screen.getByRole('button', { name: /nuevo administrador/i }));
    const modal = screen.getByText('Crear Administrador').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="numero_documento"]')!, { target: { value: '1003' } });
    fireEvent.change(modal.querySelector('input[name="nombre"]')!, { target: { value: 'Nuevo Admin' } });
    fireEvent.change(modal.querySelector('input[name="correo"]')!, { target: { value: 'nuevo@test.com' } });
    fireEvent.change(modal.querySelector('select[name="id_tipo_documento"]')!, { target: { value: '1' } });
    fireEvent.change(modal.querySelector('input[name="telefono"]')!, { target: { value: '3009998877' } });
    fireEvent.change(modal.querySelector('input[name="usuario"]')!, { target: { value: 'nuevo' } });
    fireEvent.change(modal.querySelector('input[name="password"]')!, { target: { value: 'clave123' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(adminService.insertarAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          numero_documento: '1003',
          nombre: 'Nuevo Admin',
          password: 'clave123',
        })
      );
    });
  });

  // 10. VALIDACIÓN: CONTRASEÑA OBLIGATORIA AL CREAR
  it('debería mostrar alerta si se intenta crear sin contraseña', async () => {
    render(<Usuarios />);

    fireEvent.click(screen.getByRole('button', { name: /nuevo administrador/i }));
    const modal = screen.getByText('Crear Administrador').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="numero_documento"]')!, { target: { value: '1004' } });
    fireEvent.change(modal.querySelector('input[name="nombre"]')!, { target: { value: 'Sin Clave' } });
    // Sin password

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Atención', icon: 'warning' })
      );
      expect(adminService.insertarAdmin).not.toHaveBeenCalled();
    });
  });

  // 11. EDITAR USUARIO
  it('debería abrir el modal de edición con los datos y actualizar', async () => {
    render(<Usuarios />);

    await waitFor(() => expect(screen.getByText('Admin Uno')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);

    expect(screen.getByText('Editar Administrador')).toBeInTheDocument();
    const modal = screen.getByText('Editar Administrador').closest('.modal-container') as HTMLElement;
    expect(modal.querySelector('input[name="nombre"]')).toHaveValue('Admin Uno');

    fireEvent.change(modal.querySelector('input[name="nombre"]')!, { target: { value: 'Admin Editado' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(adminService.actualizarAdmin).toHaveBeenCalledWith(
        '1001',
        expect.objectContaining({ nombre: 'Admin Editado' })
      );
    });
  });

  // 12. INHABILITAR USUARIO
  it('debería inhabilitar un usuario activo tras confirmar', async () => {
    render(<Usuarios />);

    await waitFor(() => expect(screen.getByText('Admin Uno')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /inhabilitar/i })[0]);

    await waitFor(() => {
      expect(adminService.eliminarAdmin).toHaveBeenCalledWith('1001');
    });
  });

  // 13. NO INHABILITAR SI SE CANCELA
  it('no debería inhabilitar si se cancela la confirmación', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<Usuarios />);

    await waitFor(() => expect(screen.getByText('Admin Uno')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /inhabilitar/i })[0]);

    await waitFor(() => {
      expect(adminService.eliminarAdmin).not.toHaveBeenCalled();
    });
  });

  // 14. HABILITAR USUARIO INACTIVO
  it('debería habilitar un usuario inactivo tras confirmar', async () => {
    render(<Usuarios />);

    await waitFor(() => expect(screen.getByText('Admin Inactivo')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /^habilitar/i })[0]);

    await waitFor(() => {
      expect(adminService.habilitarAdmin).toHaveBeenCalledWith('1002');
    });
  });

  // 15. APROBAR CLIENTE PENDIENTE
  it('debería aprobar un cliente pendiente', async () => {
    render(<Usuarios />);

    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }));

    await waitFor(() => expect(screen.getByText('Pendiente Uno')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /aprobar/i }));

    await waitFor(() => {
      expect(clienteService.procesarAprobacionCliente).toHaveBeenCalledWith('4001', 'Aprobar');
    });
  });

  // 16. RECHAZAR CLIENTE PENDIENTE
  it('debería rechazar un cliente pendiente con justificación', async () => {
    render(<Usuarios />);

    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }));

    await waitFor(() => expect(screen.getByText('Pendiente Uno')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /rechazar/i }));

    await waitFor(() => {
      expect(clienteService.procesarAprobacionCliente).toHaveBeenCalledWith(
        '4001',
        'Rechazar',
        'Documento no válido'
      );
    });
  });

  // 17. MANEJO DE ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga de datos', async () => {
    jest.mocked(adminService.obtenerAdmins).mockRejectedValue({ response: { status: 500, data: { message: 'Error servidor' } } });

    render(<Usuarios />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', icon: 'error' })
      );
    });
  });
});



