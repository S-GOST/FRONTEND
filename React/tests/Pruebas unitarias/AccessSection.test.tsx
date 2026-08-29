import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { BrowserRouter } from 'react-router-dom';
import AccessSection from '../../src/componentes/AccessSection';

// Wrapper para envolver el componente con Router (necesario por los <Link>)
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AccessSection Component', () => {

  // Renderizado básico
  test('debe renderizar la sección de acceso correctamente', () => {
    renderWithRouter(<AccessSection />);
    
    expect(screen.getByText('Acceso al Sistema de Gestión')).toBeInTheDocument();
  });

  // Título de la sección
  test('debe mostrar el título "Acceso al Sistema de Gestión"', () => {
    renderWithRouter(<AccessSection />);
    
    const title = screen.getByText('Acceso al Sistema de Gestión');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
  });

  // Botón de Administrador
  test('debe mostrar el botón de Administrador', () => {
    renderWithRouter(<AccessSection />);
    
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Acceso completo al sistema')).toBeInTheDocument();
  });

  // Botón de Técnico
  test('debe mostrar el botón de Técnico Especializado', () => {
    renderWithRouter(<AccessSection />);
    
    expect(screen.getByText('Técnico Especializado')).toBeInTheDocument();
    expect(screen.getByText('Gestión de reparaciones y diagnósticos')).toBeInTheDocument();
  });

  // Links de navegación
  test('debe tener links correctos para cada rol', () => {
    renderWithRouter(<AccessSection />);
    
    const adminLink = screen.getByText('Administrador').closest('a');
    const tecnicoLink = screen.getByText('Técnico Especializado').closest('a');
    
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(tecnicoLink).toHaveAttribute('href', '/tecnico/login');
  });

  // Iconos de Bootstrap
  test('debe mostrar los iconos de Bootstrap', () => {
    renderWithRouter(<AccessSection />);
    
    const adminIcon = document.querySelector('.bi-person-badge-fill');
    const tecnicoIcon = document.querySelector('.bi-tools');
    
    expect(adminIcon).toBeInTheDocument();
    expect(tecnicoIcon).toBeInTheDocument();
  });

  // Clases CSS correctas
  test('debe tener las clases CSS correctas', () => {
    renderWithRouter(<AccessSection />);
    
    const section = document.querySelector('.access-section');
    expect(section).toBeInTheDocument();
    
    const buttons = document.querySelectorAll('.access-btn');
    expect(buttons).toHaveLength(2);
    
    const icons = document.querySelectorAll('.access-icon');
    expect(icons).toHaveLength(2);
    
    const roles = document.querySelectorAll('.access-role');
    expect(roles).toHaveLength(2);
  });

  // Estructura del DOM
  test('debe tener la estructura HTML correcta', () => {
    renderWithRouter(<AccessSection />);
    
    const section = document.querySelector('section.access-section');
    expect(section).toBeInTheDocument();
    
    const h3 = section?.querySelector('h3.access-title');
    expect(h3).toBeInTheDocument();
    
    const buttonsContainer = section?.querySelector('div.access-buttons');
    expect(buttonsContainer).toBeInTheDocument();
  });

  // Número de botones de acceso
  test('debe tener exactamente 2 botones de acceso', () => {
    renderWithRouter(<AccessSection />);
    
    const accessButtons = document.querySelectorAll('.access-btn');
    expect(accessButtons).toHaveLength(2);
  });

  // Texto descriptivo de cada rol
  test('debe mostrar la descripción de cada rol', () => {
    renderWithRouter(<AccessSection />);
    
    expect(screen.getByText('Acceso completo al sistema')).toBeInTheDocument();
    expect(screen.getByText('Gestión de reparaciones y diagnósticos')).toBeInTheDocument();
  });
});


