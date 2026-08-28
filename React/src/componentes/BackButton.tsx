import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  title?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to = '/admin/dashboard', title = 'Volver al Dashboard' }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(to)} 
      className="btn-back-dashboard"
      title={title}
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        color: '#fff',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '1.2rem',
        flexShrink: 0
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#ff6600';
        e.currentTarget.style.borderColor = '#ff6600';
        e.currentTarget.style.color = '#000';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = '#1a1a1a';
        e.currentTarget.style.borderColor = '#333';
        e.currentTarget.style.color = '#fff';
      }}
    >
      <i className="bi bi-arrow-left"></i>
    </button>
  );
};
