import React from 'react';
import '../layouts/AuthLayout.css'; // Asegúrate de tener este archivo para estilos personalizados

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="auth-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
      <div className="auth-card" style={{   }}>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;