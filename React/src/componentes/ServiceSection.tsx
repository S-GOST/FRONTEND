import React from 'react';
import { Service } from '../types';

interface ServiceSectionProps {
  title: string;
  subtitle: string;
  services: Service[];
  onAddToCart: (service: Service) => void;
}

const ServiceSection: React.FC<ServiceSectionProps> = ({ title, subtitle, services, onAddToCart }) => {
  return (
    <section className="services-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <h3 className="section-subtitle">{subtitle}</h3>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-icon">
              <i className={`bi ${service.icon}`}></i>
            </div>
            <h4 className="service-name">{service.name}</h4>
            <p className="service-desc">{service.description}</p>
            <div className="service-price">€{service.price.toFixed(2)}</div>
            <button
              className="btn-service add-to-cart-btn"
              onClick={() => onAddToCart(service)}
            >
              <i className="bi bi-cart-plus"></i>
              Agregar al Carrito
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceSection;