import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../../src/componentes/Header';

describe('Header', () => {
  it('should render the main title and subtitle', () => {
    render(<Header />);
    expect(screen.getByText('SISTEMA GESTIÓN ÓRDENES DE SERVICIO TÉCNICO')).toBeInTheDocument();
    expect(screen.getByText(/Plataforma integral para la gestión/i)).toBeInTheDocument();
  });
});
