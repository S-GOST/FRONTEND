export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
}

export interface CartItem extends Service {
  quantity: number;
}

export interface SearchSuggestion {
  id: number;
  name: string;
  category: string;
  icon: string;
  price: number;
}