export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  icon: string; // nombre del ícono Bootstrap (ej. "bi-shield-check")
}

export interface CartItem extends Service {
  quantity: number;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  icon: string;
  price: string;
}