import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import AccessSection from '../../src/componentes/AccessSection';

describe('AccessSection Component', () => {
  it('debería renderizar los botones de acceso correctamente', () => {
    render(
      <MemoryRouter>
        <AccessSection />
      </MemoryRouter>
    );

    expect(screen.getByText('Acceso al Sistema de Gestión')).toBeInTheDocument();
    
    const adminLink = screen.getByRole('link', { name: /Administrador/i });
    expect(adminLink).toHaveAttribute('href', '/admin');
    
    const tecnicoLink = screen.getByRole('link', { name: /Técnico/i });
    expect(tecnicoLink).toHaveAttribute('href', '/tecnico/login');
  });
});
