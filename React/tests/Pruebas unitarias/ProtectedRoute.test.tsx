import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../src/routes/ProtectedRoute';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ========== PRUEBAS PARA ROL ADMIN ==========

  // 1. SIN TOKEN - REDIRECCIÓN A LOGIN (ADMIN)
  it('debería redirigir al login si no hay token para rol admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // 2. CON TOKEN PERO ROL INCORRECTO - REDIRECCIÓN A FALLBACK (ADMIN)
  it('debería redirigir al fallback si el rol no es admin', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/tecnico/dashboard" element={<div>Dashboard Técnico</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Técnico')).toBeInTheDocument();
  });

  // 3. CON TOKEN Y ROL CORRECTO - ACCESO PERMITIDO (ADMIN)
  it('debería permitir acceso si el rol es admin', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // ========== PRUEBAS PARA ROL TÉCNICO ==========

  // 4. SIN TOKEN - REDIRECCIÓN A LOGIN (TÉCNICO)
  it('debería redirigir al login si no hay token para rol técnico', () => {
    render(
      <MemoryRouter initialEntries={['/tecnico/dashboard']}>
        <Routes>
          <Route path="/tecnico/*" element={<ProtectedRoute allowedRole="tecnico" />}>
            <Route path="dashboard" element={<div>Dashboard Técnico</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // 5. CON TOKEN PERO ROL INCORRECTO - REDIRECCIÓN A FALLBACK (TÉCNICO)
  it('debería redirigir al fallback si el rol no es técnico', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');

    render(
      <MemoryRouter initialEntries={['/tecnico/dashboard']}>
        <Routes>
          <Route path="/tecnico/*" element={<ProtectedRoute allowedRole="tecnico" />}>
            <Route path="dashboard" element={<div>Dashboard Técnico</div>} />
          </Route>
          <Route path="/cliente/dashboard" element={<div>Dashboard Cliente</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
  });

  // 6. CON TOKEN Y ROL CORRECTO - ACCESO PERMITIDO (TÉCNICO)
  it('debería permitir acceso si el rol es técnico', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');

    render(
      <MemoryRouter initialEntries={['/tecnico/dashboard']}>
        <Routes>
          <Route path="/tecnico/*" element={<ProtectedRoute allowedRole="tecnico" />}>
            <Route path="dashboard" element={<div>Dashboard Técnico</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Técnico')).toBeInTheDocument();
  });

  // ========== PRUEBAS PARA ROL CLIENTE ==========

  // 7. SIN TOKEN - REDIRECCIÓN A LOGIN (CLIENTE)
  it('debería redirigir al login si no hay token para rol cliente', () => {
    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedRoute allowedRole="cliente" />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // 8. CON TOKEN PERO ROL INCORRECTO - REDIRECCIÓN A FALLBACK (CLIENTE)
  it('debería redirigir al fallback si el rol no es cliente', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedRoute allowedRole="cliente" />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // 9. CON TOKEN Y ROL CORRECTO - ACCESO PERMITIDO (CLIENTE)
  it('debería permitir acceso si el rol es cliente', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedRoute allowedRole="cliente" />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
  });

  // ========== PRUEBAS DE FALLBACK PATH PERSONALIZADO ==========

  // 10. FALLBACK PATH PERSONALIZADO
  it('debería usar fallbackPath personalizado si se proporciona', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/tecnico/dashboard']}>
        <Routes>
          <Route path="/tecnico/*" element={<ProtectedRoute allowedRole="tecnico" fallbackPath="/custom-error" />}>
            <Route path="dashboard" element={<div>Dashboard Técnico</div>} />
          </Route>
          <Route path="/custom-error" element={<div>Error Personalizado</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Error Personalizado')).toBeInTheDocument();
  });

  // 11. FALLBACK DEFAULT PARA ADMIN CUANDO NO ES EL ROL ESPERADO
  it('debería redirigir a /admin/dashboard por defecto si el rol es admin pero se espera otro', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/tecnico/dashboard']}>
        <Routes>
          <Route path="/tecnico/*" element={<ProtectedRoute allowedRole="tecnico" />}>
            <Route path="dashboard" element={<div>Dashboard Técnico</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  // 12. FALLBACK DEFAULT PARA TÉCNICO CUANDO NO ES EL ROL ESPERADO
  it('debería redirigir a /tecnico/dashboard por defecto si el rol es técnico pero se espera otro', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'tecnico');

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard']}>
        <Routes>
          <Route path="/cliente/*" element={<ProtectedRoute allowedRole="cliente" />}>
            <Route path="dashboard" element={<div>Dashboard Cliente</div>} />
          </Route>
          <Route path="/tecnico/dashboard" element={<div>Dashboard Técnico</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Técnico')).toBeInTheDocument();
  });

  // 13. FALLBACK DEFAULT PARA CLIENTE CUANDO NO ES EL ROL ESPERADO
  it('debería redirigir a /cliente/dashboard por defecto si el rol es cliente pero se espera otro', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'cliente');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/cliente/dashboard" element={<div>Dashboard Cliente</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
  });

  // 14. ROL NULL - COMPORTAMIENTO POR DEFECTO
  it('debería comportarse correctamente cuando el rol es null', () => {
    localStorage.setItem('user_token', 'fake-token');
    localStorage.setItem('user_role', 'null');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="dashboard" element={<div>Dashboard Admin</div>} />
          </Route>
          <Route path="/admin/dashboard" element={<div>Dashboard Admin Default</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin Default')).toBeInTheDocument();
  });
});