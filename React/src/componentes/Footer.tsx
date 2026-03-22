import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="ktm-footer">
      <div className="container">
        <div className="footer-info">
          <div className="footer-item">
            <h4 className="footer-title">KTM Rocket Service</h4>
            <p>Especialistas en motos de alta cilindrada</p>
            <p>Certificación oficial KTM</p>
            <p>Taller autorizado para motos de competición</p>
            <div className="footer-social">
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="#"><i className="bi bi-youtube"></i></a>
              <a href="#"><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>

          <div className="footer-item">
            <h4 className="footer-title">Contacto</h4>
            <p><i className="bi bi-envelope me-2"></i> info@ktmrocketservice.com</p>
            <p><i className="bi bi-telephone me-2"></i> +34 912 345 678</p>
            <p><i className="bi bi-geo-alt me-2"></i> Calle Motocicleta, 123 - Madrid</p>
            <p><i className="bi bi-clock me-2"></i> Atención 24/7 para emergencias</p>
          </div>

          <div className="footer-item">
            <h4 className="footer-title">Horario</h4>
            <p>Lunes a Viernes: 9:00 - 18:00</p>
            <p>Sábados: 10:00 - 14:00</p>
            <p>Domingos: Cerrado</p>
            <p>Servicio de urgencias 24h</p>
          </div>
        </div>

        <div className="copyright">
          <p>© 2025 KTM Rocket Service | Sistema de Gestión de Órdenes de Servicio Técnico</p>
          <p>Venta de repuestos originales para motos KTM de gama alta | Todos los derechos reservados</p>
          <p className="mt-3">Página 1 | 44 | Licencias Reservadas | Versión 3.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;