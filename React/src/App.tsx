import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Header from './componentes/Header';
import ServiceSection from './componentes/ServiceSection';
import InfoSection from './componentes/InfoSection';
import AccessSection from './componentes/AccessSection';
import Footer from './componentes/Footer';
import Login from './pages/Login'; 
import { servicesData, searchSuggestionsData } from './utils/constants';
import { Service, SearchSuggestion, CartItem } from './types';
import './App.css';

// 1. HomePage DEBE estar fuera para evitar que desaparezca el contenido al actualizar el estado
const HomePage: React.FC<{ addToCart: (s: Service) => void }> = ({ addToCart }) => {
  const categories = ['Mantenimiento', 'Reparaciones', 'Diagnósticos', 'Instalaciones'];
  
  return (
    <>
      <Header />
      <div className="container">
        {categories.map((cat, index) => {
          const filtered = servicesData.filter(s => s.category === cat);
          return (
            <React.Fragment key={cat}>
              <ServiceSection
                title={cat}
                subtitle="Categorías Oficiales"
                services={filtered}
                onAddToCart={addToCart}
              />
              {index < categories.length - 1 && <div className="section-divider"></div>}
            </React.Fragment>
          );
        })}
        <div className="section-divider"></div>
        <InfoSection />
        <AccessSection />
      </div>
    </>
  );
};

function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('ktmCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('ktmCart', JSON.stringify(cart));
  }, [cart]);

  // Partículas
  useEffect(() => {
    const container = document.querySelector('.particles');
    if (container && container.innerHTML === '') {
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animation = `float ${5 + Math.random() * 10}s linear infinite`;
        container.appendChild(p);
      }
    }
  }, []);

  const addToCart = (service: Service) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...service, quantity: 1 }];
    });
  };

  const filterSuggestions = (query: string): SearchSuggestion[] => {
    if (!query.trim()) return [];
    return searchSuggestionsData.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const service: Service = {
      id: suggestion.id,
      name: suggestion.name,
      description: `Servicio especializado de ${suggestion.category}`,
      price: suggestion.price,
      category: suggestion.category,
      icon: suggestion.icon
    };
    addToCart(service);
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <div className="app">
      <div className="particles"></div>

      <Navbar
        cartCount={cartCount}
        onSearch={filterSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />

      <main className="ktm-container">
        <Routes>
          {/* RUTA RAÍZ: Aquí es donde aparece todo el contenido principal */}
          <Route path="/" element={<HomePage addToCart={addToCart} />} />
          
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin/usuarios" element={
            <div className="container" style={{padding: '100px 20px', textAlign: 'center', color: 'white'}}>
              <h1>Panel de Administración SGOST</h1>
              <p>Bienvenido, Duvan.</p>
            </div>
          } />
          
          {/* Ruta comodín: si la URL no existe, vuelve al Home para que no se vea vacío */}
          <Route path="*" element={<HomePage addToCart={addToCart} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;