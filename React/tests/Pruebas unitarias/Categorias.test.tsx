import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Categorias from '../../src/componentes/TableCategorias/Categorias';
import * as categoriaService from '../../src/services/categoria.service';

vi.mock('../../src/services/categoria.service');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

describe('Categorias Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<MemoryRouter><Categorias /></MemoryRouter>);

  it('debería renderizar y cargar categorías', async () => {
    const mockCategorias = [
      { ID_CATEGORIA: 1, nombre: 'Categoria 1', tipo: 'PRODUCTO', estado: 'Activo' }
    ];
    vi.mocked(categoriaService.obtenerCategorias).mockResolvedValue({ data: mockCategorias } as any);

    renderComponent();
    expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Categoria 1')).toBeInTheDocument();
    });
  });

  it('debería permitir abrir el modal de creación y enviar el formulario', async () => {
    vi.mocked(categoriaService.obtenerCategorias).mockResolvedValue({ data: [] } as any);
    vi.mocked(categoriaService.insertarCategoria).mockResolvedValue({ data: { success: true } } as any);

    renderComponent();

    const btnCreate = screen.getByRole('button', { name: /Nueva Categoría/i });
    fireEvent.click(btnCreate);

    expect(screen.getByText('Crear Categoría')).toBeInTheDocument();

    const inputNombre = screen.getByLabelText(/Nombre/i);
    fireEvent.change(inputNombre, { target: { name: 'nombre', value: 'CatTest' } });

    const btnGuardar = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(btnGuardar);

    await waitFor(() => {
      expect(categoriaService.insertarCategoria).toHaveBeenCalledWith(expect.objectContaining({
        nombre: 'CatTest'
      }));
    });
  });

  it('debería filtrar categorías por búsqueda', async () => {
    const mockCategorias = [
      { ID_CATEGORIA: 1, nombre: 'Aceites', tipo: 'PRODUCTO', estado: 'Activo' },
      { ID_CATEGORIA: 2, nombre: 'Llantas', tipo: 'PRODUCTO', estado: 'Activo' }
    ];
    vi.mocked(categoriaService.obtenerCategorias).mockResolvedValue({ data: mockCategorias } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Aceites')).toBeInTheDocument();
      expect(screen.getByText('Llantas')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Aceites' } });
    
    const searchBtn = screen.getByTitle('Buscar');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Aceites')).toBeInTheDocument();
      expect(screen.queryByText('Llantas')).not.toBeInTheDocument();
    });
  });
});
