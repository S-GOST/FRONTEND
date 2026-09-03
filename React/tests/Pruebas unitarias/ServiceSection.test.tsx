import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ServiceSection from '../../src/componentes/ServiceSection';
import { Service } from '../../src/types';

describe('ServiceSection', () => {
  const mockServices: Service[] = [
    { id: 1, name: 'Service 1', description: 'Desc 1', price: 10000, icon: 'bi-wrench' },
    { id: 2, name: 'Service 2', description: 'Desc 2', price: 25000, icon: 'bi-gear' }
  ];

  it('renders correctly with services', () => {
    const onAddToCart = vi.fn();
    render(
      <ServiceSection 
        title="Test Title" 
        subtitle="Test Subtitle" 
        services={mockServices} 
        onAddToCart={onAddToCart} 
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.getByText('Desc 1')).toBeInTheDocument();
    expect(screen.getByText('$10.000 COP')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const onAddToCart = vi.fn();
    render(
      <ServiceSection 
        title="Test Title" 
        subtitle="Test Subtitle" 
        services={mockServices} 
        onAddToCart={onAddToCart} 
      />
    );

    const buttons = screen.getAllByRole('button', { name: /Agregar al Carrito/i });
    fireEvent.click(buttons[0]);

    expect(onAddToCart).toHaveBeenCalledWith(mockServices[0]);
  });
});
