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

export interface TripDates {
  startDate: Date | null;
  endDate: Date | null;
  isFlexible: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

// Enhanced Itinerary Types
export interface ItineraryActivity {
  name: string;
  time: string;
  price: number;
  type: 'bookable' | 'estimated';
  description?: string;
  alternatives?: ItineraryActivity[];
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
}

export interface FlightInfo {
  airline: string;
  flight: string;
  departure: string;
  time: string;
  price: number;
  type: 'outbound' | 'return';
}

export interface HotelInfo {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  room_type: string;
  price: number;
  total_nights: number;
}

export interface EnhancedItinerary {
  destination: string;
  duration: string;
  description: string;
  flights: FlightInfo[];
  hotel: HotelInfo;
  schedule: ItineraryDay[];
  total_cost: number;
  bookable_cost: number;
  estimated_cost: number;
} 