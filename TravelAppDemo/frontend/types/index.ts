// Type definitions for the app
export interface TravelDestination {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  price?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    budget?: number;
    interests?: string[];
    travelStyle?: 'budget' | 'luxury' | 'adventure' | 'relaxation';
  };
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
} 