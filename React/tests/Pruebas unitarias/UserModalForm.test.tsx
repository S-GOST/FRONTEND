import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserModalForm, UserFormData } from '../../src/componentes/TableAdmin/UserModalForm';

describe('UserModalForm', () => {
  const mockProps = {
    showCreateModal: true,
    showEditModal: false,
    activeTab: 'admins',
    formData: {
      numero_documento: '',
      id_tipo_documento: '',
      nombre: '',
      correo: '',
      telefono: '',
      usuario: '',
      password: '',
      ciudad: ''
    } as UserFormData,
    tiposDocumento: [{ id_tipo_documento: 1, nombre: 'CC' }],
    getTabLabel: (tab: string) => tab === 'admins' ? 'Administradores' : tab,
    handleInputChange: vi.fn(),
    handleCreate: vi.fn(e => e.preventDefault()),
    handleUpdate: vi.fn(e => e.preventDefault()),
    closeCreateModal: vi.fn(),
    closeEditModal: vi.fn()
  };

  it('renders create modal', () => {
    render(<UserModalForm {...mockProps} />);
    expect(screen.getByRole('heading', { name: /Crear Administrador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar/i, exact: true })).toBeInTheDocument();
  });

  it('renders edit modal', () => {
    render(<UserModalForm {...mockProps} showCreateModal={false} showEditModal={true} />);
    expect(screen.getByRole('heading', { name: /Editar Administrador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<UserModalForm {...mockProps} />);
    const input = screen.getByLabelText(/Nombre/i);
    fireEvent.change(input, { target: { value: 'Test User' } });
    expect(mockProps.handleInputChange).toHaveBeenCalled();
  });

  it('submits create form', () => {
    render(<UserModalForm {...mockProps} />);
    const form = screen.getByRole('button', { name: /Guardar/i }).closest('form');
    fireEvent.submit(form!);
    expect(mockProps.handleCreate).toHaveBeenCalled();
  });

  it('submits edit form', () => {
    render(<UserModalForm {...mockProps} showCreateModal={false} showEditModal={true} />);
    const form = screen.getByRole('button', { name: /Guardar cambios/i }).closest('form');
    fireEvent.submit(form!);
    expect(mockProps.handleUpdate).toHaveBeenCalled();
  });
  
  it('toggles password visibility', () => {
    render(<UserModalForm {...mockProps} />);
    const input = screen.getByLabelText(/Contraseña/i);
    expect(input).toHaveAttribute('type', 'password');
    
    const toggleBtn = screen.getByRole('button', { name: /Mostrar contraseña/i });
    fireEvent.click(toggleBtn);
    
    expect(input).toHaveAttribute('type', 'text');
    
    fireEvent.click(screen.getByRole('button', { name: /Ocultar contraseña/i }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
