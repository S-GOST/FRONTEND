import React from 'react';

const ClienteDashboard: React.FC = () => {
  const userName = localStorage.getItem('user_name') || 'Cliente';

  return (
    <div className="cliente-dashboard">
      <h2>Bienvenido, {userName}</h2>
      <p>Este es tu panel de control. Aquí podrás ver el estado de tus servicios, tus motos y más.</p>
      <div className="dashboard-stats">
        <div className="stat-card">
          <i className="fa-solid fa-clipboard-list fa-2x"></i>
          <h3>Órdenes activas</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <i className="fa-solid fa-motorcycle fa-2x"></i>
          <h3>Motos registradas</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <i className="fa-solid fa-clock fa-2x"></i>
          <h3>Próximo servicio</h3>
          <p>--</p>
        </div>
      </div>
    </div>
  );
};

export default ClienteDashboard;