import React, { useState, useRef, useEffect } from 'react';
import { SearchSuggestion } from '../types';
import rock from "../assets/icons/rock.png";
import { Link } from 'react-router-dom';

interface NavbarProps {
  cartCount: number;
  onSearch: (query: string) => SearchSuggestion[];
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onSearch, onSuggestionClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      const results = onSearch(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && suggestions.length > 0) {
      onSuggestionClick(suggestions[0]);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <nav className="navbar navbar-premium">
      <div className="container">
        <div className="navbar-left">
          <div className="navbar-brand">
            <img src={rock} alt="logo" />
          </div>
          
          <div className="ktm-search-container" ref={searchRef}>
            <form className="ktm-search-form" onSubmit={handleSubmit}>
              <div className="search-input-group">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="form-control ktm-search-input"
                  placeholder="Buscar servicios, repuestos, diagnósticos..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                />
                <button type="submit" className="ktm-search-btn">
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className="search-suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <i className={`bi ${suggestion.icon} suggestion-icon`}></i>
                      <div className="suggestion-text">{suggestion.name}</div>
                      <div className="suggestion-category">{suggestion.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
        
        <div className="nav-user-actions">
          <a href="#carrito" className="nav-btn btn-cart">
            <i className="bi bi-cart3"></i>
            <span>Carrito</span>
            <span className="cart-count">{cartCount}</span>
          </a>
          <Link to="/login" className="nav-btn btn-login">
            <i className="bi bi-box-arrow-in-right"></i>
            <span>Iniciar Sesión</span>
          </Link>
          <a href="#registro" className="nav-btn btn-register">
            <i className="bi bi-person-plus"></i>
            <span>Registrarse</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;