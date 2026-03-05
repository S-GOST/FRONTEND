import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  onAddToCart: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onAddToCart }) => {
  return (
    <div className="service-card">
      <div className="service-icon">
        <i className={`bi ${service.icon}`}></i>
      </div>
      <h4 className="service-name">{service.name}</h4>
      <p className="service-desc">{service.description}</p>
      <div className="service-price">€{service.price.toFixed(2)}</div>
      <button 
        className="btn-service"
        onClick={() => onAddToCart(service)}
      >
        <i className="bi bi-cart-plus"></i>
        Agregar al Carrito
      </button>
    </div>
  );
};

export default ServiceCard;