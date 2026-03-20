import React from 'react';
import ServiceCard from './ServiceCard';
import { Service } from '../types';

interface ServiceSectionProps {
  title: string;
  subtitle: string;
  services: Service[];
  onAddToCart: (service: Service) => void;
}

const ServiceSection: React.FC<ServiceSectionProps> = ({
  title,
  subtitle,
  services,
  onAddToCart
}) => {
  return (
    <section className="services-section" id={title.toLowerCase()}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <h3 className="section-subtitle">{subtitle}</h3>
      </div>
      <div className="services-grid">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
};

export default ServiceSection;