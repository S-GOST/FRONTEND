import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ProtectedRoute from '../../src/routes/ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderRoute = (allowedRole: 'admin' | 'tecnico' | 'cliente', fallbackPath?: string) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
          <Route path="/tecnico/dashboard" element={<div>Tecnico Dashboard</div>} />
          <Route path="/cliente/dashboard" element={<div>Cliente Dashboard</div>} />
          <Route path="/custom-fallback" element={<div>Custom Fallback</div>} />
          
          <Route element={<ProtectedRoute allowedRole={allowedRole} fallbackPath={fallbackPath} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('should navigate to login if no token is present', () => {
    const { getByText } = renderRoute('admin');
    expect(getByText('Login Page')).toBeInTheDocument();
  });

  it('should navigate to fallback if role does not match (tecnico fallback)', () => {
    localStorage.setItem('user_token', 'token');
    localStorage.setItem('user_role', 'tecnico');
    const { getByText } = renderRoute('admin');
    expect(getByText('Tecnico Dashboard')).toBeInTheDocument();
  });

  it('should navigate to fallback if role does not match (cliente fallback)', () => {
    localStorage.setItem('user_token', 'token');
    localStorage.setItem('user_role', 'cliente');
    const { getByText } = renderRoute('admin');
    expect(getByText('Cliente Dashboard')).toBeInTheDocument();
  });

  it('should navigate to custom fallback if provided', () => {
    localStorage.setItem('user_token', 'token');
    localStorage.setItem('user_role', 'tecnico');
    const { getByText } = renderRoute('admin', '/custom-fallback');
    expect(getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('should render outlet if token and role match', () => {
    localStorage.setItem('user_token', 'token');
    localStorage.setItem('user_role', 'admin');
    const { getByText } = renderRoute('admin');
    expect(getByText('Protected Content')).toBeInTheDocument();
  });
});
