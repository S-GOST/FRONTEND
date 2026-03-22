import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SearchSuggestion } from '../types';
import logo from '../assets/icons/rock.png';

interface NavbarProps {
  cartCount: number;
  onSearch: (query: string) => SearchSuggestion[];
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onSearch, onSuggestionClick }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (query.trim()) {
      setSuggestions(onSearch(query));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (suggestions.length > 0) {
      onSuggestionClick(suggestions[0]);
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion);
    setQuery('');
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-premium">
      <div className="container">
        <div className="navbar-left">
          <div className="navbar-brand">
            <Link to="/">
              <img src={logo} alt="KTM Rocket Service Logo" />
            </Link>
          </div>

          <div className="ktm-search-container">
            <form className="ktm-search-form" ref={formRef} onSubmit={handleSubmit}>
              <div className="search-input-group">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="form-control ktm-search-input"
                  placeholder="Buscar servicios, repuestos, diagnósticos..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.trim() && setShowSuggestions(true)}
                />
                <button type="submit" className="ktm-search-btn">
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions show">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="search-suggestion-item"
                      onClick={() => handleSuggestionSelect(suggestion)}
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
          <Link to="/carrito" className="nav-btn btn-cart">
            <i className="bi bi-cart3"></i>
            <span>Carrito</span>
            <span className="cart-count">{cartCount}</span>
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
