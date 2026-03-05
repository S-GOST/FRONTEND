import React from 'react';

const AccessSection: React.FC = () => {
  return (
    <section className="access-section">
      <h3 className="access-title">Acceso al Sistema de Gestión</h3>
      <div className="access-buttons">
        <a href="#admin" className="access-btn">
          <i className="bi bi-person-badge-fill access-icon"></i>
          <span>Administrador</span>
          <span className="access-role">Acceso completo al sistema</span>
        </a>
        <a href="#tecnico" className="access-btn">
          <i className="bi bi-tools access-icon"></i>
          <span>Técnico Especializado</span>
          <span className="access-role">Gestión de reparaciones y diagnósticos</span>
        </a>
      </div>
    </section>
  );
};

export default AccessSection;