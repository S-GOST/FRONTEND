import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="ktm-header">
      <div className="container">
        <h1 className="ktm-title">SISTEMA GESTIÓN ÓRDENES DE SERVICIO TÉCNICO</h1>
        <p className="ktm-subtitle">
          Plataforma integral para la gestión de servicios técnicos especializados en motocicletas KTM de alta cilindrada.
          Accede a nuestro sistema profesional para administrar todas tus operaciones de mantenimiento y reparación.
        </p>
        <div className="ktm-title-line"></div>
      </div>
    </header>
  );
};

export default Header;