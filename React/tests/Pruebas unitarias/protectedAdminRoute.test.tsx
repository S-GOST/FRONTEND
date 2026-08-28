import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedAdminRoute from '../../src/routes/ProtectedAdminRoute';

describe('ProtectedAdminRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // 1. SIN TOKEN - REDIRECCIÓN A LOGIN
  it('debería redirigir al login si no hay token', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // 2. CON TOKEN PERO ROL NO ADMIN - REDIRECCIÓN A TÉCNICO
  it('debería redirigir al dashboard técnico si el rol no es admin', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/tecnico/dashboard" element={<div>Dashboard Técnico</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Técnico')).toBeInTheDocument();
  });

  // 3. CON TOKEN Y ROL ADMIN - ACCESO PERMITIDO
  it('debería permitir acceso si el rol es admin', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // 4. CON TOKEN PERO ROL CLIENTE - REDIRECCIÓN A TÉCNICO
  it('debería redirigir al dashboard técnico si el rol es cliente', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/tecnico/dashboard" element={<div>Dashboard Técnico</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Técnico')).toBeInTheDocument();
  });

  // 5. CON TOKEN PERO ROL NULL - REDIRECCIÓN A TÉCNICO
  it('debería redirigir al dashboard técnico si el rol es null', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'null');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/tecnico/dashboard" element={<div>Dashboard Técnico</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Técnico')).toBeInTheDocument();
  });

  // 6. LOGGING DE DEBUG
  it('debería hacer logging de debug para verificar token y rol', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('ProtectedAdminRoute - Token:', true, 'Role:', 'admin');
    expect(consoleSpy).toHaveBeenCalledWith('Access granted to admin routes');
    
    consoleSpy.mockRestore();
  });

  // 7. LOGGING CUANDO NO HAY TOKEN
  it('debería hacer logging cuando no hay token', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('ProtectedAdminRoute - Token:', false, 'Role:', null);
    expect(consoleSpy).toHaveBeenCalledWith('No token, redirecting to login');
    
    consoleSpy.mockRestore();
  });

  // 8. LOGGING CUANDO EL ROL NO ES ADMIN
  it('debería hacer logging cuando el rol no es admin', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/tecnico/dashboard" element={<div>Dashboard Técnico</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('ProtectedAdminRoute - Token:', true, 'Role:', 'tecnico');
    expect(consoleSpy).toHaveBeenCalledWith('Role is not admin, redirecting to tecnico dashboard');
    
    consoleSpy.mockRestore();
  });
});