import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoSection from '../../src/componentes/InfoSection';

describe('InfoSection', () => {
  it('should render the info section', () => {
    render(<InfoSection />);
    expect(screen.getByText('KTM ROCKET SERVICE')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
    expect(screen.getByText(/Venta de repuestos originales/i)).toBeInTheDocument();
    expect(screen.getByText(/Nuestro compromiso con la privacidad/i)).toBeInTheDocument();
  });
});
