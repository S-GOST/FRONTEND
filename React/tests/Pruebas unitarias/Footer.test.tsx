import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../../src/componentes/Footer';

describe('Footer', () => {
  it('should render the footer with contact information', () => {
    render(<Footer />);
    expect(screen.getByText('KTM Rocket Service')).toBeInTheDocument();
    expect(screen.getByText('Especialistas en motos de alta cilindrada')).toBeInTheDocument();
    expect(screen.getByText('info@ktmrocketservice.com')).toBeInTheDocument();
    expect(screen.getByText('+34 912 345 678')).toBeInTheDocument();
  });
});
