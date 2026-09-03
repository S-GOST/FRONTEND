import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../../src/componentes/Navbar';
import { MemoryRouter } from 'react-router-dom';

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderNavbar = (props: any = {}) => {
    const defaultProps = {
      cartCount: 0,
      onSearch: vi.fn().mockReturnValue([]),
      onSuggestionClick: vi.fn(),
      ...props
    };
    return render(
      <MemoryRouter>
        <Navbar {...defaultProps} />
      </MemoryRouter>
    );
  };

  it('should render the logo and search input', () => {
    renderNavbar();
    expect(screen.getByPlaceholderText(/Buscar servicios/i)).toBeInTheDocument();
    expect(screen.getByAltText('KTM Rocket Service Logo')).toBeInTheDocument();
  });

  it('should display login and register buttons when no token is present', () => {
    renderNavbar();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('should display "Volver al panel" when token is present', () => {
    localStorage.setItem('user_token', 'token123');
    localStorage.setItem('user_role', 'admin');
    renderNavbar();
    expect(screen.getByText('Volver al panel')).toBeInTheDocument();
  });

  it('should call onSearch when typing in the search input', () => {
    const onSearch = vi.fn().mockReturnValue([{ id: 1, name: 'Service', category: 'Cat', icon: 'bi-star' }]);
    renderNavbar({ onSearch });
    const input = screen.getByPlaceholderText(/Buscar servicios/i);
    fireEvent.change(input, { target: { value: 'serv' } });
    
    expect(onSearch).toHaveBeenCalledWith('serv');
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('should call onSuggestionClick when submitting form with suggestions', () => {
    const suggestion = { id: 1, name: 'Service', category: 'Cat', icon: 'bi-star' };
    const onSearch = vi.fn().mockReturnValue([suggestion]);
    const onSuggestionClick = vi.fn();
    
    renderNavbar({ onSearch, onSuggestionClick });
    const input = screen.getByPlaceholderText(/Buscar servicios/i);
    fireEvent.change(input, { target: { value: 'serv' } });
    
    const form = input.closest('form');
    fireEvent.submit(form!);
    
    expect(onSuggestionClick).toHaveBeenCalledWith(suggestion);
  });

  it('should call onSuggestionClick when clicking a suggestion', () => {
    const suggestion = { id: 1, name: 'Service', category: 'Cat', icon: 'bi-star' };
    const onSearch = vi.fn().mockReturnValue([suggestion]);
    const onSuggestionClick = vi.fn();
    
    renderNavbar({ onSearch, onSuggestionClick });
    const input = screen.getByPlaceholderText(/Buscar servicios/i);
    fireEvent.change(input, { target: { value: 'serv' } });
    
    const suggestionEl = screen.getByText('Service');
    fireEvent.click(suggestionEl);
    
    expect(onSuggestionClick).toHaveBeenCalledWith(suggestion);
  });

  it('should read cartCount from localStorage', () => {
    localStorage.setItem('ktmCart', JSON.stringify([{ quantity: 2 }, { quantity: 3 }]));
    renderNavbar();
    const cartCounts = screen.getAllByText('5');
    expect(cartCounts.length).toBeGreaterThan(0);
  });
});
