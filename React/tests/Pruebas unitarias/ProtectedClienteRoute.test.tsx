import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedClienteRoute from '../../src/routes/ProtectedClienteRoute';

describe('ProtectedClienteRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // 1. SIN TOKEN - REDIRECCIÓN A LOGIN
  it('debería redirigir al login si no hay token', () => {
    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // 2. CON TOKEN PERO ROL NO CLIENTE - REDIRECCIÓN A ADMIN
  it('debería redirigir al dashboard admin si el rol no es cliente', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // 3. CON TOKEN Y ROL CLIENTE - ACCESO PERMITIDO
  it('debería permitir acceso si el rol es cliente', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
  });

  // 4. CON TOKEN PERO ROL TÉCNICO - REDIRECCIÓN A ADMIN
  it('debería redirigir al dashboard admin si el rol es técnico', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // 5. CON TOKEN PERO ROL NULL - REDIRECCIÓN A ADMIN
  it('debería redirigir al dashboard admin si el rol es null', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'null');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // 6. LOGGING DE DEBUG
  it('debería hacer logging de debug para verificar token y rol', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('ProtectedClienteRoute - Token:', true, 'Role:', 'cliente');
    expect(consoleSpy).toHaveBeenCalledWith('Access granted to cliente routes');
    
    consoleSpy.mockRestore();
  });

  // 7. LOGGING CUANDO NO HAY TOKEN
  it('debería hacer logging cuando no hay token', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('ProtectedClienteRoute - Token:', false, 'Role:', null);
    expect(consoleSpy).toHaveBeenCalledWith('No token, redirecting to login');
    
    consoleSpy.mockRestore();
  });

  // 8. LOGGING CUANDO EL ROL NO ES CLIENTE
  it('debería hacer logging cuando el rol no es cliente', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedClienteRoute />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('ProtectedClienteRoute - Token:', true, 'Role:', 'admin');
    expect(consoleSpy).toHaveBeenCalledWith('Role is not cliente, redirecting to admin dashboard');
    
    consoleSpy.mockRestore();
  });
});