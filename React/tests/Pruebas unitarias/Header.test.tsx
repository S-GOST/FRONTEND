import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../../src/componentes/Header';

describe('Componente Header', () => {
  it('debe renderizarse correctamente', () => {
    // 1. Renderizar el componente en el DOM virtual
    render(<MemoryRouter><Header /></MemoryRouter>);
    
    // 2. Buscar un elemento por su texto en la pantalla
    const titulo = screen.getByText(/SISTEMA GESTIÓN ÓRDENES DE SERVICIO TÉCNICO/i);
    
    // 3. Validar que el elemento exista en el documento
    expect(titulo).toBeInTheDocument();
  });

  it('debe contener la descripción o subtítulo', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    
    // Podemos buscar fragmentos de texto también
    const descripcion = screen.getByText(/Plataforma integral para la gestión/i);
    expect(descripcion).toBeInTheDocument();
  });
});



