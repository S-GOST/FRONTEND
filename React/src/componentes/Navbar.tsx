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

  // Cerrar sugerencias al hacer click afuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const results = onSearch(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClickInternal = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <nav className="navbar navbar-premium">
      <div className="container">
        <div className="navbar-left">
          <div className="navbar-brand">
            <Link to="/">
              <img src={rock} alt="logo" style={{ cursor: 'pointer' }} />
            </Link>
          </div>
          
          <div className="ktm-search-container" ref={searchRef}>
            <form className="ktm-search-form" onSubmit={(e) => e.preventDefault()}>
              <div className="search-input-group">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="form-control ktm-search-input"
                  placeholder="Buscar servicios..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                />
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions show">
                  {suggestions.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className="search-suggestion-item" 
                      onClick={() => handleSuggestionClickInternal(suggestion)}
                    >
                      <i className={`bi ${suggestion.icon} suggestion-icon`}></i>
                      <div className="suggestion-text">
                        <span className="suggestion-name">{suggestion.name}</span>
                        <span className="suggestion-category">{suggestion.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="nav-user-actions">
          <Link to="/carrito" className="nav-btn btn-cart">
            <i className="bi bi-cart3"></i>
            <span>Carrito</span>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>
          <Link to="/login" className="nav-btn btn-login">
            <i className="bi bi-box-arrow-in-right"></i>
            <span>Iniciar Sesión</span>
          </Link>
          <Link to="/registro" className="nav-btn btn-register">
            <i className="bi bi-person-plus"></i>
            <span>Registrarse</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;