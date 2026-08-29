import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest'; // Importar vi
import AppRoutes from '../../src/routes/AppRoutes';
import type { Service } from '../../src/types';

// Mocks de componentes lazy loaded
vi.mock('../../src/componentes/TableAdmin/Dashboard', () => ({ default: () => <div>Dashboard Admin</div> }));
vi.mock('../../src/componentes/TableAdmin/Panel', () => ({ default: () => <><div>Panel Admin</div><Outlet /></> }));
vi.mock('../../src/componentes/TableAdmin/Usuarios', () => ({ default: () => <div>Usuarios</div> }));
vi.mock('../../src/componentes/TableOrdenServicios/OrdenesServicio', () => ({ default: () => <div>Ordenes Servicio</div> }));
vi.mock('../../src/componentes/TableOrdenServicios/DetallesOrden', () => ({ default: () => <div>Detalles Orden</div> }));
vi.mock('../../src/componentes/TableOrdenServicios/AsignacionTecnicos', () => ({ default: () => <div>Asignacion Tecnicos</div> }));
vi.mock('../../src/componentes/TableServicios/Servicios', () => ({ default: () => <div>Servicios</div> }));
vi.mock('../../src/componentes/TableProductos/productos', () => ({ default: () => <div>Productos</div> }));
vi.mock('../../src/componentes/TableCategorias/Categorias', () => ({ default: () => <div>Categorias</div> }));
vi.mock('../../src/componentes/TableMotos/Motos', () => ({ default: () => <div>Motos</div> }));
vi.mock('../../src/componentes/Tableinforme/informe', () => ({ default: () => <div>Informe</div> }));
vi.mock('../../src/componentes/Tablehistorial/historial', () => ({ default: () => <div>Historial</div> }));
vi.mock('../../src/componentes/TableComprobante/Comprobante', () => ({ default: () => <div>Comprobante</div> }));
vi.mock('../../src/componentes/TableAdmin/Productividad', () => ({ default: () => <div>Productividad</div> }));
vi.mock('../../src/componentes/TableAdmin/ReporteInventario', () => ({ default: () => <div>Reporte Inventario</div> }));
vi.mock('../../src/componentes/TableTecnico/TecnicoDashboard', () => ({ default: () => <div>Dashboard Tecnico</div> }));
vi.mock('../../src/componentes/TableCliente/ClienteDashboard', () => ({ default: () => <><div>Dashboard Cliente</div><Outlet /></> }));
vi.mock('../../src/componentes/TableCliente/ClienteOrdenes', () => ({ default: () => <div>Ordenes Cliente</div> }));
vi.mock('../../src/componentes/TableCliente/ClienteMotos', () => ({ default: () => <div>Motos Cliente</div> }));
vi.mock('../../src/componentes/TableCliente/ClienteComprobantes', () => ({ default: () => <div>Comprobantes Cliente</div> }));
vi.mock('../../src/componentes/TableCliente/ClienteHistorial', () => ({ default: () => <div>Historial Cliente</div> }));

// Mocks de componentes públicos
vi.mock('../../src/pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('../../src/pages/Registro', () => ({ default: () => <div>Registro Page</div> }));
vi.mock('../../src/pages/ForgotPassword/ForgotPassword', () => ({ default: () => <div>Forgot Password</div> }));
vi.mock('../../src/pages/ResetPassword/ResetPassword', () => ({ default: () => <div>Reset Password</div> }));
vi.mock('../../src/componentes/Cart', () => ({ default: () => <div>Cart</div> }));
vi.mock('../../src/routes/ProtectedRoute', () => {
  return {
    default: () => {
      const { Navigate, Outlet } = require('react-router-dom');
      const token = localStorage.getItem('user_token');
      if (!token) return <Navigate to="/login" replace />;
      return <Outlet />;
    }
  };
});

// Mocks de componentes de la tienda
vi.mock('../../src/componentes/Header', () => ({ default: () => <div>Header</div> }));
vi.mock('../../src/componentes/ServiceSection', () => ({ default: () => <div>Service Section</div> }));
vi.mock('../../src/componentes/InfoSection', () => ({ default: () => <div>Info Section</div> }));
vi.mock('../../src/componentes/Footer', () => ({ default: () => <div>Footer</div> }));

describe('AppRoutes Component', () => {
  const mockAddToCart = vi.fn(); // ✅ Cambio: jest -> vi
  
  const mockServicios: Service[] = [
    { id: '3', name: 'S1', category: 'Cat1', price: 10, description: 'd1', icon: 'i1' },
    { id: '4', name: 'S2', category: 'Cat2', price: 10, description: 'd2', icon: 'i2' },
    { id: '5', name: 'S3', category: 'Cat3', price: 10, description: 'd3', icon: 'i3' },
    { id: '6', name: 'S4', category: 'Cat4', price: 10, description: 'd4', icon: 'i4' }
  ];
  const mockProductos: Service[] = [
    { id: '1', name: 'Aceite', category: 'Repuestos', price: 50000, description: 'Aceite sintético', icon: 'bi-oil' },
    { id: '2', name: 'Filtros', category: 'Repuestos', price: 30000, description: 'Filtros de aceite', icon: 'bi-filter' }
  ];
  const mockParticlesRef = React.createRef<HTMLDivElement>();
  const mockFilterSuggestions = vi.fn(); // ✅ Cambio: jest -> vi
  const mockHandleSuggestionClick = vi.fn(); // ✅ Cambio: jest -> vi

  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes
          addToCart={mockAddToCart}
          productos={mockProductos}
          servicios={mockServicios}
          particlesRef={mockParticlesRef}
          filterSuggestions={mockFilterSuggestions}
          handleSuggestionClick={mockHandleSuggestionClick}
        />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks(); // Cambio: jest -> vi
    localStorage.clear();
  });

  // ========== RUTAS PÚBLICAS ==========

  // 1. HOME PAGE
  it('debería renderizar la home page con Header, ServiceSection, InfoSection y Footer', async () => {
    renderWithRouter('/');

    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getAllByText('Service Section')).toHaveLength(5); // 4 categorías + productos
      expect(screen.getByText('Info Section')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  // 2. LOGIN - USUARIO NO AUTENTICADO
  it('debería mostrar login para usuario no autenticado', async () => {
    renderWithRouter('/login');

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  // 3. LOGIN - USUARIO AUTENTICADO REDIRECCIONA A ADMIN
  it('debería redirigir al dashboard admin si el usuario está autenticado como admin', async () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');
    
    renderWithRouter('/login');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    });
  });

  // 4. LOGIN - USUARIO AUTENTICADO REDIRECCIONA A TÉCNICO
  it('debería redirigir al dashboard técnico si el usuario está autenticado como técnico', async () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');
    
    renderWithRouter('/login');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Tecnico')).toBeInTheDocument();
    });
  });

  // 5. LOGIN - USUARIO AUTENTICADO REDIRECCIONA A CLIENTE
  it('debería redirigir al dashboard cliente si el usuario está autenticado como cliente', async () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');
    
    renderWithRouter('/login');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
    });
  });

  // 6. REGISTRO - USUARIO NO AUTENTICADO
  it('debería mostrar registro para usuario no autenticado', async () => {
    renderWithRouter('/registro');

    await waitFor(() => {
      expect(screen.getByText('Registro Page')).toBeInTheDocument();
    });
  });

  // 7. REGISTRO - USUARIO AUTENTICADO REDIRECCIONA
  it('debería redirigir si el usuario ya está autenticado en registro', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/registro');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    });
  });

  // 8. FORGOT PASSWORD
  it('debería mostrar forgot password', async () => {
    renderWithRouter('/forgot-password');

    await waitFor(() => {
      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    });
  });

  // 9. RESET PASSWORD CON TOKEN
  it('debería mostrar reset password con token', async () => {
    renderWithRouter('/reset-password/abc123');

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });
  });

  // 10. CARRITO
  it('debería mostrar carrito', async () => {
    renderWithRouter('/carrito');

    await waitFor(() => {
      expect(screen.getByText('Cart')).toBeInTheDocument();
    });
  });

  // ========== RUTAS DE ADMINISTRADOR ==========

  // 11. DASHBOARD ADMIN - AUTENTICADO
  it('debería mostrar dashboard admin si está autenticado', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    });
  });

  // 12. DASHBOARD ADMIN - NO AUTENTICADO REDIRECCIONA
  it('debería redirigir al login si no está autenticado', async () => {
    renderWithRouter('/admin/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  // 13. PANEL ADMIN CON SUBRUTAS
  it('debería mostrar panel admin con subrutas', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/usuarios');

    await waitFor(() => {
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
  });

  // 14. ORDENES SERVICIO
  it('debería mostrar ordenes servicio', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/ordenes_servicio');

    await waitFor(() => {
      expect(screen.getByText('Ordenes Servicio')).toBeInTheDocument();
    });
  });

  // 15. DETALLES ORDEN
  it('debería mostrar detalles orden', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/detalles-orden');

    await waitFor(() => {
      expect(screen.getByText('Detalles Orden')).toBeInTheDocument();
    });
  });

  // 16. ASIGNACIÓN TÉCNICOS
  it('debería mostrar asignación técnicos', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/asignacion_tecnicos');

    await waitFor(() => {
      expect(screen.getByText('Asignacion Tecnicos')).toBeInTheDocument();
    });
  });

  // 17. PRODUCTOS
  it('debería mostrar productos', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/productos');

    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
    });
  });

  // 18. CATEGORÍAS
  it('debería mostrar categorías', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/categorias');

    await waitFor(() => {
      expect(screen.getByText('Categorias')).toBeInTheDocument();
    });
  });

  // 19. MOTOS
  it('debería mostrar motos', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/motos');

    await waitFor(() => {
      expect(screen.getByText('Motos')).toBeInTheDocument();
    });
  });

  // 20. INFORME
  it('debería mostrar informe', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/informe');

    await waitFor(() => {
      expect(screen.getByText('Informe')).toBeInTheDocument();
    });
  });

  // 21. HISTORIAL
  it('debería mostrar historial', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/historial');

    await waitFor(() => {
      expect(screen.getByText('Historial')).toBeInTheDocument();
    });
  });

  // 22. COMPROBANTE
  it('debería mostrar comprobante', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/comprobante');

    await waitFor(() => {
      expect(screen.getByText('Comprobante')).toBeInTheDocument();
    });
  });

  // 23. PRODUCTIVIDAD
  it('debería mostrar productividad', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/productividad');

    await waitFor(() => {
      expect(screen.getByText('Productividad')).toBeInTheDocument();
    });
  });

  // 24. REPORTE INVENTARIO
  it('debería mostrar reporte inventario', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/admin/inventario');

    await waitFor(() => {
      expect(screen.getByText('Reporte Inventario')).toBeInTheDocument();
    });
  });

  // ========== RUTAS DE TÉCNICO ==========

  // 25. DASHBOARD TÉCNICO
  it('debería mostrar dashboard técnico con ProtectedRoute', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/tecnico/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Tecnico')).toBeInTheDocument();
    });
  });

  // 26. INFORMES TÉCNICO
  it('debería mostrar informes técnico', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/tecnico/informes');

    await waitFor(() => {
      expect(screen.getByText('Informe')).toBeInTheDocument();
    });
  });

  // 27. INVENTARIO TÉCNICO
  it('debería mostrar inventario técnico', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/tecnico/inventario');

    await waitFor(() => {
      expect(screen.getByText('Reporte Inventario')).toBeInTheDocument();
    });
  });

  // ========== RUTAS DE CLIENTE ==========

  // 28. DASHBOARD CLIENTE
  it('debería mostrar dashboard cliente con ProtectedRoute', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/cliente/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
    });
  });

  // 29. ÓRDENES CLIENTE
  it('debería mostrar órdenes cliente', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/cliente/ordenes');

    await waitFor(() => {
      expect(screen.getByText('Ordenes Cliente')).toBeInTheDocument();
    });
  });

  // 30. MOTOS CLIENTE
  it('debería mostrar motos cliente', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/cliente/motos');

    await waitFor(() => {
      expect(screen.getByText('Motos Cliente')).toBeInTheDocument();
    });
  });

  // 31. COMPROBANTES CLIENTE
  it('debería mostrar comprobantes cliente', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/cliente/comprobantes');

    await waitFor(() => {
      expect(screen.getByText('Comprobantes Cliente')).toBeInTheDocument();
    });
  });

  // 32. HISTORIAL CLIENTE
  it('debería mostrar historial cliente', async () => {
    localStorage.setItem('user_token', 'fake-token');
    
    renderWithRouter('/cliente/historial');

    await waitFor(() => {
      expect(screen.getByText('Historial Cliente')).toBeInTheDocument();
    });
  });

  // 33. RUTA POR DEFECTO
  it('debería redirigir a home para ruta desconocida', async () => {
    renderWithRouter('/ruta-desconocida');

    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument();
    });
  });

  // 34. LAZY LOADING CON SUSPENSE
  it.skip('debería mostrar RouteLoader mientras carga componentes lazy', async () => {
    // Simular carga lenta
    vi.useFakeTimers(); // Cambio: jest -> vi
    
    renderWithRouter('/admin/dashboard');
    
    // Debería mostrar "Cargando..." inicialmente
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    
    vi.advanceTimersByTime(1000); // Cambio: jest -> vi
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    });
    
    vi.useRealTimers(); // Cambio: jest -> vi
  });
});



