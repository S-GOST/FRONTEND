import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InfoSection from '../../src/componentes/InfoSection';

describe('InfoSection Component', () => {

  // Renderizado básico
  test('debe renderizar la sección correctamente', () => {
    render(<InfoSection />);
    
    expect(screen.getByText('KTM ROCKET SERVICE')).toBeInTheDocument();
  });

  // Título principal
  test('debe mostrar el título "KTM ROCKET SERVICE"', () => {
    render(<InfoSection />);
    
    const title = screen.getByText('KTM ROCKET SERVICE');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
  });

  // Texto de descripción
  test('debe mostrar la descripción de venta de repuestos', () => {
    render(<InfoSection />);
    
    expect(screen.getByText(/Venta de repuestos originales para motos KTM/i)).toBeInTheDocument();
  });

  // Texto de especialistas
  test('debe mencionar especialistas certificados', () => {
    render(<InfoSection />);
    
    expect(screen.getByText(/Especialistas certificados y tecnología de última generación/i)).toBeInTheDocument();
  });

  // Texto de taller
  test('debe mencionar el taller especializado', () => {
    render(<InfoSection />);
    
    expect(screen.getByText(/Contamos con taller especializado/i)).toBeInTheDocument();
  });

  // Iconos de Bootstrap
  test('debe mostrar los iconos de Bootstrap', () => {
    render(<InfoSection />);
    
    const rocketIcon = document.querySelector('.bi-rocket-takeoff');
    expect(rocketIcon).toBeInTheDocument();
  });

  // Clases CSS correctas
  test('debe tener las clases CSS correctas', () => {
    render(<InfoSection />);
    
    expect(document.querySelector('.info-section')).toBeInTheDocument();
    expect(document.querySelector('.info-grid')).toBeInTheDocument();
    expect(document.querySelector('.info-card')).toBeInTheDocument();
    expect(document.querySelector('.info-title')).toBeInTheDocument();
    expect(document.querySelector('.info-content')).toBeInTheDocument();
  });

  // Estructura HTML semántica
  test('debe tener estructura de sección HTML', () => {
    render(<InfoSection />);
    
    expect(document.querySelector('section.info-section')).toBeInTheDocument();
  });

  // Múltiples tarjetas
  test('debe tener al menos 2 info-cards', () => {
    render(<InfoSection />);
    
    const cards = document.querySelectorAll('.info-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  // Icono de escudo/seguridad
  test('debe mostrar el icono de seguridad', () => {
    render(<InfoSection />);
    
    const shieldIcon = document.querySelector('.bi-shield-lock');
    expect(shieldIcon).toBeInTheDocument();
  });
});