/// <reference types="vitest" />
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceSection from '../../src/componentes/ServiceSection';

// Con "any" TypeScript no se queja de los campos faltantes
const mockServices: any[] = [
  { id: 1, name: 'Servicio 1', description: 'Descripción 1', icon: 'bi-tools', price: 100 },
  { id: 2, name: 'Servicio 2', description: 'Descripción 2', icon: 'bi-gear', price: 200 },
  { id: 3, name: 'Servicio 3', description: 'Descripción 3', icon: 'bi-wrench', price: 300 }
];

const mockProps: any = {
  title: 'Nuestros Servicios',
  subtitle: 'Lo mejor para ti',
  services: mockServices,
  onAddToCart: vi.fn()
};

describe('ServiceSection Component', () => {
  beforeEach(() => {
    cleanup();
  });

  test('debe renderizar la sección correctamente', () => {
    render(<ServiceSection {...mockProps} />);
    expect(document.querySelector('section')).toBeInTheDocument();
  });

  test('debe mostrar el título', () => {
    render(<ServiceSection {...mockProps} />);
    expect(document.querySelector('h2')).toBeInTheDocument();
  });

  test('debe mostrar el subtítulo', () => {
    render(<ServiceSection {...mockProps} />);
    expect(document.querySelector('h3')).toBeInTheDocument();
  });

  test('debe mostrar las tarjetas de servicio', () => {
    render(<ServiceSection {...mockProps} />);
    const cards = document.querySelectorAll('.service-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  test('debe mostrar los nombres de los servicios', () => {
    render(<ServiceSection {...mockProps} />);
    expect(document.body.textContent).toContain('Servicio 1');
  });

  test('debe mostrar descripciones', () => {
    render(<ServiceSection {...mockProps} />);
    const paragraphs = document.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  test('debe mostrar iconos', () => {
    render(<ServiceSection {...mockProps} />);
    const icons = document.querySelectorAll('[class*="bi-"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  test('debe tener estructura de grid', () => {
    render(<ServiceSection {...mockProps} />);
    expect(document.querySelector('.services-grid')).toBeInTheDocument();
  });
});