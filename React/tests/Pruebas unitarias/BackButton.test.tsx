import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { BackButton } from '../../src/componentes/BackButton';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: vi.fn(),
  };
});

describe('BackButton', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('debería renderizarse con valores por defecto', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /volver al dashboard/i });
    expect(button).toBeInTheDocument();
  });

  it('debería navegar a la ruta por defecto cuando se hace clic', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /volver al dashboard/i });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('debería usar la ruta y título personalizados', () => {
    render(
      <MemoryRouter>
        <BackButton to="/cliente/dashboard" title="Volver al cliente" />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /volver al cliente/i });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/cliente/dashboard');
  });

  it('debería cambiar estilos onMouseOver y onMouseOut', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );
    const button = screen.getByRole('button');
    
    fireEvent.mouseOver(button);
    expect(button.style.borderColor).toBe('rgb(255, 102, 0)');
    
    fireEvent.mouseOut(button);
    expect(button.style.borderColor).toBe('rgb(51, 51, 51)');
  });

  it('debería cambiar estilos onFocus y onBlur', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );
    const button = screen.getByRole('button');
    
    fireEvent.focus(button);
    expect(button.style.borderColor).toBe('rgb(255, 102, 0)');
    
    fireEvent.blur(button);
    expect(button.style.borderColor).toBe('rgb(51, 51, 51)');
  });
});
