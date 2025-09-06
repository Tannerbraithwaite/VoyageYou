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
  type: 'bookable' | 'estimated' | 'transport';
  description?: string;
  alternatives?: ItineraryActivity[];
  transport_details?: {
    type: 'flight' | 'train' | 'bus';
    carrier: string;
    departure: string;
    time: string;
  };
}

export interface ItineraryDay {
  day: number;
  date: string;
  city?: string; // For multi-city trips
  activities: ItineraryActivity[];
}

export interface FlightInfo {
  airline: string;
  flight: string;
  departure: string;
  time: string;
  price: number;
  type: 'outbound' | 'return';
  alternatives?: FlightInfo[];
}

export interface HotelInfo {
  city?: string; // For multi-city trips
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  room_type: string;
  price: number;
  total_nights: number;
  alternatives?: HotelInfo[];
}

export interface InterCityTransport {
  from_location: string;
  to: string;
  type: 'flight' | 'train' | 'bus';
  carrier: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  description: string;
}

// Single City Itinerary
export interface SingleCityItinerary {
  trip_type: 'single_city';
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

// Multi-City Itinerary
export interface MultiCityItinerary {
  trip_type: 'multi_city';
  destinations: string[];
  duration: string;
  description: string;
  flights: FlightInfo[];
  hotels: HotelInfo[];
  inter_city_transport: InterCityTransport[];
  schedule: ItineraryDay[];
  total_cost: number;
  bookable_cost: number;
  estimated_cost: number;
}

// Union type for both itinerary types
export type EnhancedItinerary = SingleCityItinerary | MultiCityItinerary;

// Enhanced Booking Types
export interface FlightUpgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'seat' | 'meal' | 'baggage' | 'priority' | 'lounge';
  category?: string;
  available: boolean;
}

export interface HotelRoomOption {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'room_upgrade' | 'amenity' | 'service' | 'package';
  category?: string;
  available: boolean;
}

export interface BookingRequest {
  itinerary_id: string;
  traveler_info: TravelerInfo[];
  flight_upgrades: FlightUpgradeSelection[];
  hotel_upgrades: HotelUpgradeSelection[];
  payment_info: PaymentInfo;
  contact_info: ContactInfo;
  total_cost: number;
  booking_notes?: string;
}

export interface FlightUpgradeSelection {
  flight_id: string;
  upgrades: string[]; // Array of upgrade IDs
}

export interface HotelUpgradeSelection {
  hotel_id: string;
  upgrades: string[]; // Array of upgrade IDs
}

export interface TravelerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  email?: string;
  phone?: string;
}

export interface PaymentInfo {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  savePayment?: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface BookingConfirmation {
  booking_id: string;
  status: 'confirmed' | 'pending' | 'failed';
  confirmation_number: string;
  total_cost: number;
  itinerary_summary: {
    destination: string;
    dates: string;
    travelers: number;
  };
  next_steps: string[];
  contact_support: {
    email: string;
    phone: string;
  };
} 