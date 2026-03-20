export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  icon: string;
  price: number;
}

export interface CartItem extends Service {
  quantity: number;
}