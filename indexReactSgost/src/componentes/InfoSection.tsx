import React from 'react';

const InfoSection: React.FC = () => {
  return (
    <section className="info-section">
      <div className="info-grid">
        <div className="info-card">
          <h3 className="info-title">
            <i className="bi bi-rocket-takeoff"></i>
            KTM ROCKET SERVICE
          </h3>
          <div className="info-content">
            <p>Venta de repuestos originales para motos KTM de gama alta. Mantenimiento y reparación con enfoque en alta cilindrada. Especialistas certificados y tecnología de última generación para garantizar el máximo rendimiento de tu motocicleta.</p>
            <p className="mt-3">Contamos con taller especializado y herramientas de diagnóstico avanzadas para atender cualquier necesidad de tu KTM.</p>
          </div>
        </div>
        
        <div className="info-card">
          <h3 className="info-title">
            <i className="bi bi-shield-lock"></i>
            Política de Privacidad
          </h3>
          <div className="info-content">
            <p><strong>2025</strong></p>
            <p>Todos los derechos reservados. Protección de datos garantizada bajo normativa internacional.</p>
            <p className="mt-3">Nuestro compromiso con la privacidad y seguridad de la información de nuestros clientes es fundamental. Implementamos las mejores prácticas de seguridad en todos nuestros procesos.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;