import { MemoryRouter } from 'react-router-dom';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Panel from '../../src/componentes/TableAdmin/Panel';
import * as authService from '../../src/services/auth.services';
import Swal from 'sweetalert2';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }), getInput: vi.fn() } }));

// Mock de React Router DOM
vi.mock('react-router-dom', async () => {
  const originalModule = await vi.importActual('react-router-dom') as any;
  return {
    ...originalModule,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to} data-testid="link">{children}</a>
    ),
  };
});

// Mock del servicio de autenticación
vi.mock('../../services/auth.services');

describe('Panel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 1. PRUEBA DE RENDERIZADO BÁSICO
  it('debería renderizar el panel correctamente', () => {
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    expect(screen.getByText(/ADMIN KTM/i)).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  // 2. PRUEBA DE VISUALIZACIÓN DE NOMBRE DE USUARIO
  it('debería mostrar el nombre del usuario desde localStorage', () => {
    localStorage.setItem('user_name', 'Juan Pérez');
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  // 3. PRUEBA DE VALOR POR DEFECTO CUANDO NO HAY USUARIO
  it('debería mostrar "ADMIN KTM" cuando no hay usuario en localStorage', () => {
    localStorage.removeItem('user_name');
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    expect(screen.getByText('ADMIN KTM')).toBeInTheDocument();
  });

  // 4. PRUEBA DE LOGO CON ENLACE
  it('debería tener el logo con enlace a la ruta principal', () => {
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    const logo = screen.getByAltText('Logo');
    const link = logo.closest('a');
    
    expect(logo).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  // 5. PRUEBA DE OUTLET
  it('debería renderizar el Outlet para contenido dinámico', () => {
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  // 6. PRUEBA DE BOTÓN DE LOGOUT
  it('debería mostrar el botón de cerrar sesión', () => {
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent('Cerrar sesión');
  });

  // 7. PRUEBA DE CONFIRMACIÓN DE LOGOUT
  it('debería mostrar confirmación de SweetAlert al hacer clic en logout', async () => {
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutButton);
    
    expect(Swal.fire).toHaveBeenCalledWith({
      title: "¿Salir del sistema?",
      text: "Tu sesión será cerrada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF6D1F",
      cancelButtonColor: "#333",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar"
    });
  });

  // 8. PRUEBA DE CIERRE DE SESIÓN CONFIRMADO
  it('debería llamar a clearSession cuando se confirma el logout', async () => {
    // Configurar Swal para que retorne confirmación
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as any);
    
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(authService.clearSession).toHaveBeenCalled();
    });
  });

  // 9. PRUEBA DE NO CIERRE DE SESIÓN CUANDO SE CANCELA
  it('no debería llamar a clearSession cuando se cancela el logout', async () => {
    // Configurar Swal para que retorne cancelación
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as any);
    
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(authService.clearSession).not.toHaveBeenCalled();
    });
  });

  // 10. PRUEBA DE ICONO DE USUARIO
  it('debería mostrar el icono de usuario', () => {
    render(<MemoryRouter><Panel /></MemoryRouter>);
    
    const userIcon = screen.getByTestId('user-icon');
    expect(userIcon).toBeInTheDocument();
  });
});



