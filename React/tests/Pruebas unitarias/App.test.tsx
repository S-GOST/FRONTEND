
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../../src/App';
import * as productoService from '../../src/services/producto.service';
import * as servicioService from '../../src/services/servicio.service';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) }
}));

// Mock de auth.services
vi.mock('../../src/services/auth.services', () => ({
  clearSession: vi.fn()
}));

// Mock services
vi.mock('../../src/services/producto.service');
vi.mock('../../src/services/servicio.service');

// Mocks de Componentes Hijos para aislar App.tsx
vi.mock('../../src/componentes/Navbar', () => ({
  default: ({ cartCount, onSearch, onSuggestionClick }: any) => (
    <nav data-testid="navbar">
      <span>Cart: {cartCount}</span>
      <button 
        data-testid="search-mock-btn" 
        onClick={() => {
          const suggestions = onSearch('aceite');
          if (suggestions.length > 0) {
            onSuggestionClick(suggestions[0]);
          }
        }}
      >
        Simular Busqueda
      </button>
    </nav>
  )
}));

vi.mock('../../src/routes/AppRoutes', () => ({
  default: ({ productos, servicios }: any) => (
    <div data-testid="app-routes">
      <span data-testid="prod-count">{productos?.length || 0}</span>
      <span data-testid="serv-count">{servicios?.length || 0}</span>
    </div>
  )
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderApp = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    );
  };

  it('debería renderizar Navbar y AppRoutes por defecto', async () => {
    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: [] } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: [] } as any);

    renderApp('/');

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  it('no debería renderizar Navbar en /login', async () => {
    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: [] } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: [] } as any);

    renderApp('/login');

    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  it('debería cargar y mapear productos y servicios', async () => {
    const mockProds = [{ ID_PRODUCTOS: 1, Nombre: 'Aceite', precio_venta: 100 }];
    const mockServs = [{ ID_SERVICIOS: 2, Nombre: 'Cambio', Precio: 50 }];

    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: mockProds } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: mockServs } as any);

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByTestId('prod-count')).toHaveTextContent('1');
      expect(screen.getByTestId('serv-count')).toHaveTextContent('1');
    });
  });

  it('debería procesar distintos formatos de respuesta del backend (data.data, data.productos)', async () => {
    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: { productos: [{ ID_PRODUCTOS: 1 }] } } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: { result: [{ ID_SERVICIOS: 2 }] } } as any);

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByTestId('prod-count')).toHaveTextContent('1');
      expect(screen.getByTestId('serv-count')).toHaveTextContent('1');
    });
  });

  it('debería manejar errores silenciosamente al cargar datos', async () => {
    vi.mocked(productoService.obtenerProductos).mockRejectedValue(new Error('Network error'));
    vi.mocked(servicioService.obtenerServicios).mockRejectedValue(new Error('Network error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderApp('/');

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar productos:', expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith('Error al cargar servicios:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('debería filtrar sugerencias y agregarlas al carrito desde el navbar', async () => {
    const mockProds = [{ ID_PRODUCTOS: 1, Nombre: 'Aceite Motor', precio_venta: 100 }];
    
    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: mockProds } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: [] } as any);

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByTestId('prod-count')).toHaveTextContent('1');
    });

    // Simular búsqueda y click en Navbar
    const searchBtn = screen.getByTestId('search-mock-btn');
    searchBtn.click(); // Esto llamará a onSearch('aceite') y onSuggestionClick

    // Como agregó al carrito, el cartCount debería subir a 1
    await waitFor(() => {
      expect(screen.getByText('Cart: 1')).toBeInTheDocument();
    });
  });
});
