import React, { useState, useEffect } from 'react';
import Navbar from './componentes/Navbar';
import Header from './componentes/Header';
import ServiceSection from './componentes/ServiceSection';
import InfoSection from './componentes/InfoSection';
import AccessSection from './componentes/AccessSection';
import Footer from './componentes/Footer';
import { servicesData, searchSuggestionsData } from './utils/constants';
import { Service, SearchSuggestion, CartItem } from './types';
import './App.css';

// Componente de Notificación
const Notification: React.FC<{ message: string; type: 'success' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`cart-notification alert-${type}`}>
      <i className={`bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`}></i>
      <span>{message}</span>
      <button className="close-notification" onClick={onClose}>&times;</button>
    </div>
  );
};

function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('ktmCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'success' | 'warning' }[]>([]);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('ktmCart', JSON.stringify(cart));
  }, [cart]);

  // Funciones del carrito
  const addToCart = (service: Service) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevCart, { ...service, quantity: 1 }];
    });
    
    showNotification(`${service.name} agregado al carrito`, 'success');
  };

  const showNotification = (message: string, type: 'success' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filterSuggestions = (query: string): SearchSuggestion[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return searchSuggestionsData.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const service: Service = {
      id: suggestion.id.toString(),
      name: suggestion.name,
      description: `Servicio de ${suggestion.category}`,
      price: suggestion.price,
      category: suggestion.category,
      icon: suggestion.icon
    };
    
    addToCart(service);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filtrar servicios por categoría
  const mantenimientoServices = servicesData.filter(s => s.category === 'Mantenimiento');
  const reparacionesServices = servicesData.filter(s => s.category === 'Reparaciones');
  const diagnosticosServices = servicesData.filter(s => s.category === 'Diagnósticos');
  const instalacionesServices = servicesData.filter(s => s.category === 'Instalaciones');

  return (
    <div className="app">
      {/* Partículas de fondo */}
      <div className="particles" id="particles"></div>
      
      {/* Notificaciones */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      
      <Navbar 
        cartCount={cartCount}
        onSearch={filterSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
      
      <div className="ktm-container">
        <Header />
        
        <main className="main-content">
          <div className="container">
            {/* Sección Mantenimiento */}
            <ServiceSection
              title="Mantenimiento"
              subtitle="Categorías"
              services={mantenimientoServices}
              onAddToCart={addToCart}
            />
            
            <div className="section-divider"></div>
            
            {/* Sección Reparaciones */}
            <ServiceSection
              title="Reparaciones"
              subtitle="Categorías"
              services={reparacionesServices}
              onAddToCart={addToCart}
            />
            
            <div className="section-divider"></div>
            
            {/* Sección Diagnósticos */}
            <ServiceSection
              title="Diagnósticos"
              subtitle="Categorías"
              services={diagnosticosServices}
              onAddToCart={addToCart}
            />
            
            <div className="section-divider"></div>
            
            {/* Sección Instalaciones */}
            <ServiceSection
              title="Instalaciones"
              subtitle="Categorías"
              services={instalacionesServices}
              onAddToCart={addToCart}
            />
            
            <div className="section-divider"></div>
            
            <InfoSection />
            <AccessSection />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;