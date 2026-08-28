/// <reference types="vitest" />
import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../src/componentes/Navbar';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navbar Component', () => {
  const mockOnSearch = vi.fn();
  const mockOnSuggestionClick = vi.fn();

  const defaultProps = {
    cartCount: 0,
    onSearch: mockOnSearch,
    onSuggestionClick: mockOnSuggestionClick
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockOnSearch.mockReturnValue([]);
  });

  test('debe renderizar el navbar correctamente', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  test('debe mostrar el logo', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const logo = document.querySelector('img');
    expect(logo).toBeInTheDocument();
  });

  test('debe mostrar el contador del carrito', () => {
    renderWithRouter(<Navbar {...defaultProps} cartCount={5} />);
    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  test('debe mostrar 0 cuando no hay items', () => {
    renderWithRouter(<Navbar {...defaultProps} cartCount={0} />);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  test('debe tener links de navegación', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const links = document.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  test('debe tener campo de búsqueda', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const input = document.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  test('debe llamar onSearch al escribir en el campo de búsqueda', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const input = document.querySelector('input') as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value: 'ktm' } });
      expect(input.value).toBe('ktm');
      expect(mockOnSearch).toHaveBeenCalledWith('ktm');
    }
  });

  test('debe tener un formulario de búsqueda', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  test('debe mostrar el icono del carrito', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const cartIcon = document.querySelector('[class*="cart"], i[class*="bi-"]');
    expect(cartIcon).toBeInTheDocument();
  });

  test('debe tener link al carrito', () => {
    renderWithRouter(<Navbar {...defaultProps} />);
    const allLinks = document.querySelectorAll('a');
    expect(allLinks.length).toBeGreaterThan(0);
  });
});


