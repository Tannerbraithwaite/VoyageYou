import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, Platform, ActivityIndicator, PermissionsAndroid, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import GlassCard from '@/components/ui/GlassCard';
import { router, useLocalSearchParams } from 'expo-router';
import { DatePicker, CleanSchedule, AlternativesSelector, CurrencyConverter, useCurrencyConverter, type Currency, VoyageYouHeader } from '@/components';
import { TripDates, EnhancedItinerary, ItineraryActivity, FlightInfo, HotelInfo, ItineraryDay, MultiCityItinerary, SingleCityItinerary } from '@/types';
import DetailsModal from '@/components/DetailsModal';
import { Ionicons } from '@expo/vector-icons';
import { formatDateForChat, calculateTripDuration } from '@/utils';
import exportService from '@/services/export';
import { API_BASE_URL } from '@/config/api';
import { safeSessionStorage, safeLocalStorage } from '@/utils/storage';


interface Activity {
  time: string;
  name: string;
  price: number;
  type: 'bookable' | 'estimated';
}

interface AlternativeActivity {
  name: string;
  price: number;
  type: 'bookable' | 'estimated';
  description: string;
}

interface SavedSchedule {
  id: string;
  name: string;
  destination: string;
  duration: string;
  savedAt: string;
  status: 'unbooked' | 'booked' | 'past';
  itinerary: EnhancedItinerary;
  schedule: ItineraryDay[]; // Changed from Activity[][] to ItineraryDay[]
  // New fields for automatic status assignment
  checkoutDate?: string; // When the trip was checked out
  tripStartDate?: string; // When the trip starts
  tripEndDate?: string; // When the trip ends
  
  // Enhanced information fields
  flights: FlightInfo[];
  hotels: HotelInfo[];
  activities: ItineraryActivity[];
  dates: string[];
  costBreakdown: {
    total: number;
    bookable: number;
    estimated: number;
  };
}

interface EditingTime {
  dayIndex: number;
  activityIndex: number;
  newTime: string;
}

interface EditingDay {
  dayIndex: number;
  activityIndex: number;
  newDay: number;
}

// Activity Edit Form Component will be defined inside the main component

export default function HomeScreen() {
  const params = useLocalSearchParams();
  const chatScrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{message: string, isBot: boolean}>>([]);
  const [userId] = useState(1); // Default user ID for demo
  const [tripDates, setTripDates] = useState<TripDates>({
    startDate: null,
    endDate: null,
    isFlexible: false,
  });
  
  // State for undecided dates planning
  const [isUndecidedDates, setIsUndecidedDates] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState<EnhancedItinerary | null>(null);
  const [showOldTrips, setShowOldTrips] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState<'flight' | 'hotel'>('flight');
  const [detailsData, setDetailsData] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Location detection state
  const [userLocation, setUserLocation] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  // Helper function to generate date range from start to end date
  const generateDateRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Function to show details modal with enhanced data
  const showDetails = async (type: 'flight' | 'hotel', data: any) => {
    setIsLoadingDetails(true);
    try {
      let enhancedData = data;
      
      if (type === 'flight') {
        // Extract origin and destination from departure string
        let origin = 'JFK';
        let destination = 'LHR';
        
        if (data.departure && data.departure.includes(' → ')) {
          const parts = data.departure.split(' → ');
          if (parts.length === 2) {
            origin = parts[0].trim();
            destination = parts[1].trim();
          }
        }
        
        // Call enhanced flight API to get detailed information
        const response = await fetch(`${API_BASE_URL}/api/flights/enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: origin,
            destination: destination,
            departure_date: '2025-09-11', // Default date for demo
            passengers: 1
          })
        });
        
        if (response.ok) {
          const enhancedResponse = await response.json();
          if (enhancedResponse.flights && enhancedResponse.flights.length > 0) {
            // Merge basic data with enhanced data
            // Handle both nested structures: basic data might be under 'flights' key
            const basicData = Array.isArray(data) ? data[0] : data;
            enhancedData = {
              ...basicData,
              ...enhancedResponse.flights[0]
            };
          }
        }
      } else if (type === 'hotel') {
        // Extract destination from address or use a default
        let destination = 'Barcelona';
        
        if (data.address) {
          // Try to extract city from address (e.g., "Eixample | Barcelona | 📍 41.3956, 2.1495")
          if (data.address.includes('|')) {
            const parts = data.address.split('|');
            if (parts.length >= 2) {
              destination = parts[1].trim();
            }
          } else if (data.address.includes(',')) {
            // Fallback to comma-separated format
            destination = data.address.split(',')[0].trim();
          }
        }
        
        // Call enhanced hotel API to get detailed information
        const response = await fetch(`${API_BASE_URL}/api/hotels/enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination: destination,
            check_in: '2025-09-11', // Default date for demo
            check_out: '2025-09-14', // Default date for demo
            rooms: 1,
            adults: 2
          })
        });
        
        if (response.ok) {
          const enhancedResponse = await response.json();
          if (enhancedResponse.hotels && enhancedResponse.hotels.length > 0) {
            // Merge basic data with enhanced data
            // Handle both nested structures: basic data might be under 'hotel' key
            const basicData = data.hotel || data;
            enhancedData = {
              ...basicData,
              ...enhancedResponse.hotels[0]
            };
          }
        }
      }
      
      setDetailsType(type);
      setDetailsData(enhancedData);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching enhanced data:', error);
      // Fallback to basic data if enhanced API fails
      setDetailsType(type);
      setDetailsData(data);
      setShowDetailsModal(true);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Function to detect user's location from phone
  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Check location permissions
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Request permission
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }
      
      setLocationPermission(status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'To provide better flight planning, we need access to your location. Please enable location services in your phone settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 1000,
      });
      
      // Reverse geocode to get city name
      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (geocodeResult.length > 0) {
        const address = geocodeResult[0];
        const city = address.city || address.subregion || address.region || 'Unknown City';
        const country = address.country || '';
        const locationString = country ? `${city}, ${country}` : city;
        
        setUserLocation(locationString);
        
        // Update user profile with detected location
        try {
          const response = await fetch(`${API_BASE_URL}/users/${userId}/test`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: locationString
            })
          });
          
          if (response.ok) {
            console.log('Location updated in profile:', locationString);
          }
        } catch (error) {
          console.error('Error updating location in profile:', error);
        }
        
        Alert.alert(
          'Location Detected!',
          `We've detected you're in ${locationString}. This will be used for flight planning.`,
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert(
        'Location Detection Failed',
        'We couldn\'t detect your location. You can still manually set your location in your profile.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const [schedule, setSchedule] = useState<ItineraryDay[]>([
    {
      day: 1,
      date: 'July 15, 2024',
      city: 'Default City',
      activities: [
        { time: '09:00', name: 'Arrive at Hotel', price: 0, type: 'bookable' as const },
        { time: '10:30', name: 'City Walking Tour', price: 25, type: 'bookable' as const },
        { time: '13:00', name: 'Lunch at Local Bistro', price: 35, type: 'estimated' as const },
        { time: '15:00', name: 'Museum Visit', price: 18, type: 'bookable' as const },
        { time: '18:00', name: 'Dinner & Wine Tasting', price: 65, type: 'estimated' as const },
      ]
    }
  ]);
  const [alternativeActivities, setAlternativeActivities] = useState<Record<string, AlternativeActivity[]>>({});
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [activityRatings, setActivityRatings] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(safeLocalStorage.getItem('activityRatings') || '{}');
      } catch {}
    }
    return {};
  });


  // Interactive schedule state - using new drag and drop system

  // Interactive schedule editing state
  const [editingDay, setEditingDay] = useState<EditingDay | null>(null);
  
  // New state for interactive schedule editing
  const [editingActivity, setEditingActivity] = useState<{
    dayIndex: number;
    activityIndex: number;
    isEditing: boolean;
  } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    dayIndex: number;
    activityIndex: number;
    activity: Activity;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    dayIndex: number;
    timeSlot: string;
  } | null>(null);

  // State for save schedule modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  
  // State for add activity modal
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [selectedDayForActivity, setSelectedDayForActivity] = useState<number | null>(null);
  
  // State for currency conversion
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rate: 1.0
  });
  
  // State for export functionality
  const [isExporting, setIsExporting] = useState(false);
  

  
  // Currency converter hook
  const { formatPrice } = useCurrencyConverter(selectedCurrency);

  // Purchase options
  const [includeFlights, setIncludeFlights] = useState(true);
  const [includeHotel, setIncludeHotel] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);

  // Persist purchase options for checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const options = { includeFlights, includeHotel, includeActivities };
      try {
        safeSessionStorage.setItem('purchaseOptions', JSON.stringify(options));
      } catch (e) {
        // ignore
      }
    }
  }, [includeFlights, includeHotel, includeActivities]);



  // Activity Edit Form Component
  const ActivityEditForm = ({ 
    activity, 
    alternatives, 
    onSave, 
    onCancel 
  }: { 
    activity: ItineraryActivity; 
    alternatives: AlternativeActivity[]; 
    onSave: (activity: ItineraryActivity) => void; 
    onCancel: () => void; 
  }) => {
    const [editedActivity, setEditedActivity] = useState<ItineraryActivity>(activity);
    const [selectedAlternative, setSelectedAlternative] = useState<AlternativeActivity | null>(null);
    const [customTime, setCustomTime] = useState(activity.time);

    const handleSave = () => {
      const finalActivity = selectedAlternative 
        ? { ...editedActivity, ...selectedAlternative }
        : editedActivity;
      onSave({ ...finalActivity, time: customTime });
    };

    return (
      <View style={styles.activityEditForm}>
        <Text style={styles.editFormTitle}>Edit Activity</Text>
        
        {/* Time Input */}
        <View style={styles.timeInputRow}>
          <Text style={styles.timeInputLabel}>Time:</Text>
          <TextInput
            style={styles.timeInputMain}
            value={customTime}
            onChangeText={setCustomTime}
            placeholder="09:00"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>

        {/* Current Activity */}
        <View style={styles.currentActivitySection}>
          <Text style={styles.sectionLabel}>Current Activity:</Text>
          <View style={styles.currentActivityCard}>
            <Text style={styles.currentActivityName}>{activity.name}</Text>
            <Text style={styles.currentActivityPrice}>${activity.price}</Text>
            <Text style={styles.currentActivityType}>{activity.type}</Text>
          </View>
        </View>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={styles.sectionLabel}>Alternative Activities:</Text>
            {alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alternativeCard,
                  selectedAlternative === alt && styles.alternativeCardSelected
                ]}
                onPress={() => setSelectedAlternative(alt)}
              >
                <Text style={styles.alternativeName}>{alt.name}</Text>
                <Text style={styles.alternativePrice}>${alt.price}</Text>
                <Text style={styles.alternativeType}>{alt.type}</Text>
                {alt.description && (
                  <Text style={styles.alternativeDescription}>{alt.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.editFormActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          // Backend connection successful
        } else {
          // Backend connection failed
        }
      } catch (error) {
        // Backend connection error
        Alert.alert('Connection Error', 'Unable to connect to the travel assistant. Please check your internet connection.');
      }
    };

    testBackendConnection();
  }, []);

  // Load itinerary data from safeSessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedItinerary = safeSessionStorage.getItem('currentItinerary');
      if (storedItinerary) {
        try {
          const itinerary = JSON.parse(storedItinerary);
          setCurrentItinerary(itinerary);
          updateScheduleFromItinerary(itinerary);
        } catch (error) {
          // Error parsing stored itinerary - silent handling
        }
      }
    }
  }, []);
  
  // Load user's location from profile and auto-detect if needed
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        // First try to get location from user profile
        const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const profileData = await response.json();
          if (profileData.user && profileData.user.location) {
            setUserLocation(profileData.user.location);
            return; // User already has location set
          }
        }
        
        // If no location in profile, automatically try to detect it
        console.log('No location in profile, attempting automatic detection...');
        await detectUserLocation();
      } catch (error) {
        console.error('Error loading user location:', error);
        // If profile loading fails, still try to auto-detect
        console.log('Profile loading failed, attempting automatic detection...');
        await detectUserLocation();
      }
    };
    
    loadUserLocation();
  }, [userId]);

  // Reload the itinerary every time the Home tab gains focus (e.g., after selecting "Edit" from the Schedule tab)
  useFocusEffect(
    React.useCallback(() => {
      if (typeof window !== 'undefined') {
        const storedItinerary = safeSessionStorage.getItem('currentItinerary');
        if (storedItinerary) {
          try {
            const itinerary = JSON.parse(storedItinerary);
            setCurrentItinerary(itinerary);
            updateScheduleFromItinerary(itinerary);
          } catch (error) {
            // Error parsing stored itinerary on focus
          }
        }
      }
      // No cleanup necessary
      return () => {};
    }, [])
  );

  // Load saved schedules from safeLocalStorage on component mount
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const storedSchedules = await safeLocalStorage.getItem('savedSchedules');
        if (storedSchedules) {
          const schedules = JSON.parse(storedSchedules);
          setSavedSchedules(schedules);
        }
      } catch (error) {
        // Error loading saved schedules - silent handling
      }
    };
    
    loadSchedules();
  }, []);

  // Interactive schedule editing - no modal needed

  // Old drag and drop functions removed - replaced with new interactive system

  // Component mount effect
  useEffect(() => {

  }, []);

    const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) {
      return;
    }

    const userMessage = messageText.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { message: userMessage, isBot: false }]);
    
    // Prepare the message with trip dates context
    let enhancedMessage = userMessage;
    
    if (isUndecidedDates) {
      // For undecided dates, don't include specific dates but indicate planning mode
      const planningContext = `Planning Mode: Undecided dates - planning ahead without specific dates\n` +
        `Purchase Options:\n- Flights: ${includeFlights ? 'Include' : 'Exclude'}\n- Hotel: ${includeHotel ? 'Include' : 'Exclude'}\n- Activities: ${includeActivities ? 'Include' : 'Exclude'}`;
      
      const locationContext = userLocation ? `User Location: ${userLocation} (flight departure city)` : 'User Location: Not specified';
      
      enhancedMessage = `${planningContext}\n${locationContext}\n\nUser Request: ${userMessage}`;
    } else if (tripDates.startDate && tripDates.endDate) {
      // For specific dates, include full date context
      const startDateStr = formatDateForChat(tripDates.startDate);
      const endDateStr = formatDateForChat(tripDates.endDate);
      const duration = calculateTripDuration(tripDates.startDate, tripDates.endDate);
      
      let dateContext = `Trip Dates: ${startDateStr} to ${endDateStr} (${duration} days)`;
      if (tripDates.isFlexible) {
        dateContext += ' - Flexible with dates';
      }
      
      // Purchase options context
      const optionsContext = `Purchase Options:\n- Flights: ${includeFlights ? 'Include' : 'Exclude'}\n- Hotel: ${includeHotel ? 'Include' : 'Exclude'}\n- Activities: ${includeActivities ? 'Include' : 'Exclude'}`;
      
      const locationContext = userLocation ? `User Location: ${userLocation} (flight departure city)` : 'User Location: Not specified';

      enhancedMessage = `${dateContext}\n${optionsContext}\n${locationContext}\n\nUser Request: ${userMessage}`;
    } else {
      // No dates selected, basic context
      const basicContext = `No specific dates selected\n` +
        `Purchase Options:\n- Flights: ${includeFlights ? 'Include' : 'Exclude'}\n- Hotel: ${includeHotel ? 'Include' : 'Exclude'}\n- Activities: ${includeActivities ? 'Include' : 'Exclude'}`;
      
      const locationContext = userLocation ? `User Location: ${userLocation} (flight departure city)` : 'User Location: Not specified';
      
      enhancedMessage = `${basicContext}\n${locationContext}\n\nUser Request: ${userMessage}`;
    }
    
    // Log full prompt for debugging

    
    await sendMessageToAPI(enhancedMessage);
  };

  // Auto-scroll chat to bottom when history or loading state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatHistory, isLoading]);

  const sendMessageToAPI = async (messageToSend: string) => {

    try {
      // Use LangChain endpoint for better conversation context and structured output
      const response = await fetch(`${API_BASE_URL}/chat/langchain/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          user_id: userId,
          conversation_history: chatHistory.map(chat => ({
            message: chat.message,
            isBot: chat.isBot
          }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if this is a question response (LLM asking for clarification)
        if (result.type === 'question') {
          // Handle question response - just display the message
          const questionMessage = result.message || "I need more information to help you plan your trip.";
          setResponse(questionMessage);
          setChatHistory(prev => [...prev, { message: questionMessage, isBot: true }]);
          setIsLoading(false);
          return;
        }
        
        // Check if we have a valid itinerary response
        if (!result || (!result.destination && !result.destinations)) {
          // Handle case where response doesn't contain expected itinerary data
          const errorMessage = "Sorry, I encountered an error processing your request. Please try again.";
          setResponse(errorMessage);
          setChatHistory(prev => [...prev, { message: errorMessage, isBot: true }]);
          setIsLoading(false);
          return;
        }
        
        // Store the itinerary data
        setCurrentItinerary(result);
        
        // If we used a detected location for trip planning, update the user's profile
        if (userLocation && !result.location_updated) {
          try {
            const profileUpdateResponse = await fetch(`${API_BASE_URL}/users/${userId}/test`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                location: userLocation
              })
            });
            
            if (profileUpdateResponse.ok) {
              console.log('Location saved to profile after successful trip planning');
            }
          } catch (error) {
            console.error('Error updating profile with location:', error);
          }
        }
        
        // Create a user-friendly response message
        let botResponse = '';
        
        if (result.trip_type === 'multi_city') {
          // Multi-city trip
          const destinations = result.destinations ? result.destinations.join(' and ') : 'your destinations';
          const hotelCount = result.hotels ? result.hotels.length : 0;
          const flightCount = result.flights ? result.flights.length : 0;
          const totalCost = result.total_cost || 'TBD';
          
          botResponse = `I've created a detailed multi-city itinerary for your trip to ${destinations}!\n\n` +
            `📅 Duration: ${result.duration || 'TBD'}\n` +
            `✈️ Flights: ${flightCount} flights with multiple options\n` +
            `🏨 Hotels: ${hotelCount} hotels with alternatives to choose from\n` +
            `🚄 Inter-city transport included\n` +
            `💰 Total Cost: $${totalCost}\n\n` +
            `💡 **Tip**: Click on flights and hotels to see alternative options!\n\n` +
            `Your chronological schedule has been loaded below. You can continue chatting with me to make changes or ask questions!`;
        } else {
          // Single city trip
          const flightCount = result.flights ? result.flights.length : 0;
          const hotelName = result.hotel && result.hotel.name ? result.hotel.name : 'Hotel included';
          const totalCost = result.total_cost || 'TBD';
          
          botResponse = `I've created a detailed itinerary for your trip to ${result.destination || 'your destination'}!\n\n` +
            `📅 Duration: ${result.duration || 'TBD'}\n` +
            `✈️ Flights: ${flightCount} flights with multiple options\n` +
            `🏨 Hotel: ${hotelName} with alternatives\n` +
            `💰 Total Cost: $${totalCost}\n\n` +
            `💡 **Tip**: Click on flights and hotels to see alternative options!\n\n` +
            `Your chronological schedule has been loaded below. You can continue chatting with me to make changes or ask questions!`;
        }
        
        setResponse(botResponse);
        setChatHistory(prev => [...prev, { message: botResponse, isBot: true }]);
        
        // Update schedule with the new itinerary
        updateScheduleFromItinerary(result);
        
        // Store in session storage for persistence
        if (typeof window !== 'undefined') {
          safeSessionStorage.setItem('currentItinerary', JSON.stringify(result));
        }
      } else {
        // LangChain endpoint failed, falling back to enhanced endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/chat/enhanced/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageToSend,
            user_id: userId,
            conversation_history: chatHistory.map(chat => ({
              message: chat.message,
              isBot: chat.isBot
            }))
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          setResponse(fallbackResult.bot_response);
          setChatHistory(prev => [...prev, { message: fallbackResult.bot_response, isBot: true }]);
        } else {
          throw new Error(`HTTP ${fallbackResponse.status}`);
        }
      }
    } catch (error) {
      // Error sending message - show user-friendly message
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setResponse(errorMessage);
      setChatHistory(prev => [...prev, { message: errorMessage, isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    await sendMessage(message);
  };

  const updateScheduleFromItinerary = (itinerary: EnhancedItinerary) => {
    // Convert enhanced itinerary to schedule format
    const newSchedule = itinerary.schedule.map((day: any) => ({
      day: day.day,
      date: day.date,
      city: day.city,
      activities: sortActivitiesByTime(day.activities.map((activity: any) => ({
        time: activity.time,
        name: activity.name,
        price: activity.price,
        type: activity.type as 'bookable' | 'estimated'
      })))
    }));
    
    // Sort days by day number
    newSchedule.sort((a, b) => a.day - b.day);
    
    setSchedule(newSchedule);
    
    // Build alternatives map
    const alternativesMap: Record<string, AlternativeActivity[]> = {};
    itinerary.schedule.forEach((day: any) => {
      day.activities.forEach((activity: any) => {
        if (activity.alternatives && activity.alternatives.length > 0) {
          alternativesMap[activity.name] = activity.alternatives.map((alt: any) => ({
            name: alt.name,
            price: alt.price,
            type: alt.type as 'bookable' | 'estimated',
            description: alt.description || ''
          }));
        }
      });
    });
    setAlternativeActivities(alternativesMap);
  };

  const handleRateActivity = (tripId: number, activityName: string, newRating: number) => {
    setOldTripsState(prevTrips => 
      prevTrips.map(trip => 
        trip.id === tripId 
          ? {
              ...trip,
              activities: trip.activities.map(activity => 
                activity.name === activityName 
                  ? { ...activity, rating: newRating }
                  : activity
              )
            }
          : trip
      )
    );
  };

  const renderStars = (rating: number, onPress: (tripId: number, activityName: string, rating: number) => void, activityName: string, tripId: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(tripId, activityName, star)}
            style={styles.starButton}
          >
            <Text style={[styles.star, star <= rating && styles.starFilled]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Get all available alternatives from the LLM
  const getAllAvailableAlternatives = () => {
    const allAlternatives: AlternativeActivity[] = [];
    
    // Collect all alternatives from all activities
    Object.values(alternativeActivities).forEach(alternatives => {
      alternatives.forEach(alt => {
        // Check if this alternative is already in the schedule
        const isInSchedule = schedule.some(day => 
          day.activities.some(activity => activity.name === alt.name)
        );
        
        // Only include alternatives that aren't already scheduled
        if (!isInSchedule) {
          allAlternatives.push(alt);
        }
      });
    });
    
    return allAlternatives;
  };

  // Utility function to sort activities by time within a day
  // This ensures activities are always displayed in chronological order
  const sortActivitiesByTime = (activities: Activity[]) => {
    return activities.sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`);
      const timeB = new Date(`2000-01-01 ${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });
  };

  const handleCheckout = async () => {
    console.log('🛒 Checkout button clicked');
    console.log('📊 Current state:', {
      currentItinerary: !!currentItinerary,
      currentItineraryType: currentItinerary?.trip_type,
      isUndecidedDates,
      windowAvailable: typeof window !== 'undefined'
    });
    
    // Store the current itinerary in safeSessionStorage for checkout
    if (typeof window !== 'undefined' && currentItinerary) {
      try {
        await safeSessionStorage.setItem('selectedItinerary', JSON.stringify(currentItinerary));
        console.log('✅ Itinerary stored for checkout:', currentItinerary);
        router.push('/checkout');
      } catch (error) {
        console.error('❌ Error storing itinerary for checkout:', error);
        Alert.alert('Error', 'Failed to prepare checkout. Please try again.');
      }
    } else {
      console.warn('⚠️ No itinerary available for checkout');
      console.log('🔍 Debug info:', {
        windowAvailable: typeof window !== 'undefined',
        currentItinerary: currentItinerary,
        currentItineraryKeys: currentItinerary ? Object.keys(currentItinerary) : 'null'
      });
      Alert.alert('No Itinerary', 'Please generate an itinerary first before checking out.');
    }
  };

  const handleChangeActivity = (activity: ItineraryActivity) => {
    setSelectedActivity(activity);
    setShowAlternatives(true);
  };

  const handleSelectAlternative = (alternative: AlternativeActivity) => {
    if (selectedActivity) {
      // Update the schedule with the selected alternative
      setSchedule(prevSchedule => 
        prevSchedule.map(day => ({
          ...day,
          activities: day.activities.map(act => 
            act.name === selectedActivity.name && 
            act.time === selectedActivity.time && 
            act.price === selectedActivity.price
              ? { 
                  ...act, 
                  name: alternative.name, 
                  price: alternative.price, 
                  type: alternative.type,
                  description: alternative.description || act.description
                }
              : act
          )
        }))
      );
    }
    setShowAlternatives(false);
    setSelectedActivity(null);
  };

  const handleRatePastActivity = (key: string, rating: number) => {
    setActivityRatings(prev => {
      const updated = { ...prev, [key]: rating };
      if (typeof window !== 'undefined') {
        try { safeLocalStorage.setItem('activityRatings', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
  };

  // New interactive schedule functions
  const handleActivityEdit = (dayIndex: number, activityIndex: number) => {
    setEditingActivity({ dayIndex, activityIndex, isEditing: true });
  };

  const handleActivityEditCancel = () => {
    setEditingActivity(null);
  };

    const handleActivityEditSave = (dayIndex: number, activityIndex: number, updatedActivity: ItineraryActivity) => {
    console.log('🔄 handleActivityEditSave called with:', {
      dayIndex,
      activityIndex,
      updatedActivity,
      currentSchedule: schedule
    });
    
    // Update activity in schedule
    setSchedule(prevSchedule => {
      console.log('🔄 Previous schedule:', prevSchedule);
      
      const newSchedule = prevSchedule.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              activities: sortActivitiesByTime(day.activities.map((act, actIndex) => 
                actIndex === activityIndex ? updatedActivity : act
              ))
            }
          : day
      );
      
      console.log('🔄 New schedule:', newSchedule);
      return newSchedule;
    });
    
    setEditingActivity(null);
  };

  const handleDragStart = (dayIndex: number, activityIndex: number) => {
    const activity = schedule[dayIndex].activities[activityIndex];
    setDraggedItem({ dayIndex, activityIndex, activity });
  };

  const handleDragOver = (dayIndex: number, timeSlot: string) => {
    setDragOverTarget({ dayIndex, timeSlot });
  };

  const handleDragEnd = () => {
    if (draggedItem && dragOverTarget) {
      const { dayIndex: sourceDay, activityIndex: sourceActivity, activity } = draggedItem;
      const { dayIndex: targetDay, timeSlot: targetTime } = dragOverTarget;
      
      // Remove from source
      setSchedule(prevSchedule => 
        prevSchedule.map((day, index) => 
          index === sourceDay 
            ? { ...day, activities: day.activities.filter((_, actIndex) => actIndex !== sourceActivity) }
            : day
        )
      );
      
      // Add to target with new time
      setSchedule(prevSchedule => 
        prevSchedule.map((day, index) => 
          index === targetDay 
            ? { 
                ...day, 
                activities: [...day.activities, { ...activity, time: targetTime }]
                  .sort((a, b) => {
                    const timeA = new Date(`2000-01-01 ${a.time}`);
                    const timeB = new Date(`2000-01-01 ${b.time}`);
                    return timeA.getTime() - timeB.getTime();
                  })
              }
            : day
        )
      );
    }
    
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const performDeleteActivity = (dayIndex: number, activityIndex: number) => {
    setSchedule(prevSchedule => 
      prevSchedule.map((day, index) => 
        index === dayIndex 
          ? { 
              ...day, 
              activities: sortActivitiesByTime(day.activities.filter((_, actIndex) => actIndex !== activityIndex))
            }
          : day
      )
    );
  };

  const handleDeleteActivity = (dayIndex: number, activityIndex: number) => {
    const activity = schedule[dayIndex].activities[activityIndex];
    
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`Delete "${activity.name}" from Day ${dayIndex + 1}?`) : true;
      if (ok) {
        performDeleteActivity(dayIndex, activityIndex);
      }
      return;
    }

    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}" from Day ${dayIndex + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            performDeleteActivity(dayIndex, activityIndex);
            Alert.alert('Activity Deleted', `"${activity.name}" has been successfully deleted from Day ${dayIndex + 1}`, [{ text: 'OK' }]);
          }
        }
      ]
    );
  };

  const handleAddActivity = (dayIndex: number) => {
    setSelectedDayForActivity(dayIndex);
    setShowAddActivityModal(true);
  };

  const handleSelectActivityFromAlternatives = (alternative: AlternativeActivity, dayIndex: number) => {
    // Create a new activity from the selected alternative
    const newActivity: Activity = {
      time: '12:00', // Default time, user can edit later
      name: alternative.name,
      price: alternative.price,
      type: alternative.type as 'bookable' | 'estimated'
    };
    
    // Add to schedule
    setSchedule(prevSchedule => 
      prevSchedule.map((day, index) => 
        index === dayIndex ? { 
          ...day, 
          activities: sortActivitiesByTime([...day.activities, newActivity])
        } : day
      )
    );
    
    // Close modal
    setShowAddActivityModal(false);
    setSelectedDayForActivity(null);
    
    // Show success message
    Alert.alert('Activity Added', `"${alternative.name}" has been added to Day ${dayIndex + 1}`);
  };

  const handleAddDatesToPlan = () => {
    setIsUndecidedDates(false);
    // Focus on the date picker
    // You could also scroll to the date picker here
  };

  // Calculate totals with proper type checking
  const totalFlights = (() => {
    if (!currentItinerary?.flights || !Array.isArray(currentItinerary.flights)) {
      return 1700; // fallback
    }
    return currentItinerary.flights.reduce((sum, flight) => sum + (flight.price || 0), 0);
  })();
  
  // Handle both single-city and multi-city hotel calculations with proper type checking
  const totalHotel = (() => {
    if (!currentItinerary) return 540;
    if (currentItinerary.trip_type === 'multi_city' && 'hotels' in currentItinerary && Array.isArray(currentItinerary.hotels)) {
      return currentItinerary.hotels.reduce((sum, hotel) => sum + ((hotel.price || 0) * (hotel.total_nights || 1)), 0);
    } else if (currentItinerary.trip_type === 'single_city' && 'hotel' in currentItinerary && currentItinerary.hotel) {
      return (currentItinerary.hotel.price || 0) * (currentItinerary.hotel.total_nights || 1);
    }
    return 540; // fallback
  })();
  
  const bookableActivities = schedule.flatMap(day => 
    day.activities.filter(activity => activity.type === 'bookable')
  ).reduce((sum, activity) => sum + (activity.price || 0), 0);
  
  const totalActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => daySum + (activity.price || 0), 0), 0
  );
  
  // Schedule updated, recalculating totals
  
  const selectedFlights = includeFlights ? totalFlights : 0;
  const selectedHotel = includeHotel ? totalHotel : 0;
  const selectedActivities = includeActivities ? bookableActivities : 0;

  const calculatedBookableTotal = totalFlights + totalHotel + bookableActivities;
  const enhancedItineraryBookableCost = currentItinerary?.bookable_cost;
  const bookableTotal = selectedFlights + selectedHotel + selectedActivities;



  const handleSaveSchedule = () => {
    if (!currentItinerary) {
      Alert.alert('No Schedule', 'There is no current schedule to save.');
      return;
    }

    // Set default name and show modal
    const destinationName = currentItinerary.trip_type === 'multi_city' 
      ? currentItinerary.destinations?.join(' → ') || 'Multi-City Trip'
      : currentItinerary.destination || 'Trip';
    
    setScheduleName(`${destinationName} Trip`);
    setShowSaveModal(true);
  };

  const handleSaveScheduleConfirm = () => {
    if (scheduleName && scheduleName.trim()) {
      // Use the actual user-selected dates from tripDates state
      let tripStartDate = new Date().toISOString();
      let tripEndDate = new Date().toISOString();
      
      // Use user-selected dates if available, otherwise use fallback dates
      if (tripDates.startDate) {
        tripStartDate = tripDates.startDate.toISOString();
      } else {
        // Fallback: create a future date if no user date selected
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
        tripStartDate = futureDate.toISOString();
      }
      
      if (tripDates.endDate) {
        tripEndDate = tripDates.endDate.toISOString();
      } else if (tripDates.startDate) {
        // If only start date is selected, calculate end date based on duration
        const duration = currentItinerary?.duration || '3 days';
        const durationDays = parseInt(duration.split(' ')[0]) || 3;
        const endDate = new Date(tripDates.startDate);
        endDate.setDate(endDate.getDate() + durationDays - 1);
        tripEndDate = endDate.toISOString();
      } else {
        // Fallback: create a future date if no user date selected
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30 + (parseInt(currentItinerary?.duration?.split(' ')[0]) || 3)); // 30+ days from now
        tripEndDate = futureDate.toISOString();
      }
      

      
      const newSchedule: SavedSchedule = {
        id: Date.now().toString(),
        name: scheduleName.trim(),
        destination: currentItinerary!.trip_type === 'multi_city' 
          ? currentItinerary!.destinations?.join(' → ') || 'Multi-City Trip'
          : currentItinerary!.destination || 'Trip',
        duration: currentItinerary!.duration,
        savedAt: new Date().toISOString(),
        status: 'unbooked',
        itinerary: currentItinerary!,
        schedule: currentItinerary?.schedule || [],
        // Add trip dates for automatic status assignment
        tripStartDate: tripStartDate,
        tripEndDate: tripEndDate,
        
        // Enhanced information fields
        flights: currentItinerary?.flights || [],
        hotels: currentItinerary?.trip_type === 'multi_city' 
          ? (currentItinerary as MultiCityItinerary).hotels 
          : currentItinerary?.trip_type === 'single_city' 
            ? [(currentItinerary as SingleCityItinerary).hotel]
            : [],
        activities: currentItinerary?.schedule?.flatMap(day => day.activities) || [],
        dates: tripDates.startDate && tripDates.endDate ? 
          generateDateRange(tripDates.startDate, tripDates.endDate) : 
          currentItinerary?.schedule?.map(day => day.date) || [],
        costBreakdown: {
          total: currentItinerary?.total_cost || 0,
          bookable: currentItinerary?.bookable_cost || 0,
          estimated: currentItinerary?.estimated_cost || 0
        }
      };

      // Add to local state
      setSavedSchedules(prev => [...prev, newSchedule]);

      // Save to safeLocalStorage
      const saveSchedule = async () => {
        try {
          console.log('💾 Saving new schedule:', newSchedule);
          console.log('💾 Schedule validation check:', {
            hasId: !!newSchedule.id,
            hasName: !!newSchedule.name,
            hasDestination: !!newSchedule.destination,
            hasScheduleOrItinerary: !!(newSchedule.schedule || newSchedule.itinerary)
          });
          
          const existingSchedulesData = await safeLocalStorage.getItem('savedSchedules');
          const existingSchedules = existingSchedulesData ? JSON.parse(existingSchedulesData) : [];
          console.log('💾 Existing schedules count:', existingSchedules.length);
          
          const updatedSchedules = [...existingSchedules, newSchedule];
          console.log('💾 Updated schedules count:', updatedSchedules.length);
          
          await safeLocalStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
          console.log('✅ Schedule saved to storage');

          Alert.alert('Success', `Schedule "${scheduleName.trim()}" has been saved!`);
        } catch (error) {
          console.error('Error saving schedule:', error);
          Alert.alert('Error', 'Failed to save schedule. Please try again.');
        }
      };
      
      saveSchedule();

      // Close modal and reset
      setShowSaveModal(false);
      setScheduleName('');
    } else {
      Alert.alert('Invalid Name', 'Please enter a valid name for the schedule.');
    }
  };

  const handleExportItinerary = async () => {
    if (!currentItinerary) {
      Alert.alert('No Itinerary', 'There is no current itinerary to export.');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportService.exportItinerary(currentItinerary);
      
      if (result.success) {
        if (Platform.OS === 'web') {
          Alert.alert('Success', result.message || 'PDF downloaded successfully!');
        } else {
          Alert.alert('Success', result.message || 'PDF has been sent to your email!');
        }
      }
    } catch (error) {
      // Export error
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Failed to export itinerary');
    } finally {
      setIsExporting(false);
    }
  };

  // Map ItineraryDay to Day format for CleanSchedule component
  const mapItineraryToSchedule = (itineraryDays: ItineraryDay[]) => {
    return itineraryDays.map(day => ({
      day: day.day,
      date: day.date,
      activities: day.activities.map(activity => ({
        time: activity.time,
        name: activity.name, // Use 'name' directly for CleanSchedule
        price: activity.price,
        type: activity.type as 'bookable' | 'estimated' | 'transport',
        description: activity.description || ''
      }))
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chat Section */}
        <GlassCard style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Chat with Neel</Text>



          {/* Quick Purchase Options (adjust before/while chatting) */}
          <View style={styles.quickOptionsCard}>
            <Text style={styles.quickOptionsTitle}>Include in Plan</Text>
            <View style={styles.quickOptionsRow}>
              <TouchableOpacity style={styles.checkboxRow} onPress={() => setIncludeFlights(!includeFlights)}>
                <View style={[styles.checkbox, includeFlights && styles.checkboxChecked]}>
                  {includeFlights && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Flights</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setIncludeHotel(!includeHotel)}>
                <View style={[styles.checkbox, includeHotel && styles.checkboxChecked]}>
                  {includeHotel && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Hotel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setIncludeActivities(!includeActivities)}>
                <View style={[styles.checkbox, includeActivities && styles.checkboxChecked]}>
                  {includeActivities && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Activities</Text>
              </TouchableOpacity>
            </View>
            
            {/* Currency Selector */}
            <View style={styles.currencySection}>
              <Text style={styles.currencySectionTitle}>Currency</Text>
              <CurrencyConverter
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
              />
            </View>
          </View>
          
          {/* Trip Dates */}
          <View style={styles.datesContainer}>
            <Text style={styles.datesTitle}>Trip Dates</Text>
            
            {/* Undecided Dates Checkbox */}
            <TouchableOpacity 
              style={styles.undecidedCheckboxRow} 
              onPress={() => setIsUndecidedDates(!isUndecidedDates)}
            >
              <View style={[styles.checkbox, isUndecidedDates && styles.checkboxChecked]}>
                {isUndecidedDates && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Undecided dates - plan ahead without committing to specific dates</Text>
            </TouchableOpacity>
            
            {!isUndecidedDates && (
              <DatePicker
                tripDates={tripDates}
                onDatesChange={setTripDates}
              />
            )}
            
            {isUndecidedDates && (
              <View style={styles.undecidedInfo}>
                <Text style={styles.undecidedInfoText}>
                  💡 You can still plan your trip! The AI will suggest flights, hotels, and activities without specific dates. 
                  You can add dates later when you're ready to book.
                </Text>
              </View>
            )}
          </View>

          {/* Chat History - Scrollable with auto-scroll to bottom */}
          <View style={styles.chatHistoryContainer}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatHistoryScroll}
              contentContainerStyle={styles.chatHistoryContent}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {chatHistory.length === 0 && (
                <View style={styles.welcomeMessage}>
                  <Text style={styles.welcomeText}>
                    Hi! I&apos;m your AI travel assistant. I can help you with:
                  </Text>
                  <Text style={styles.welcomeBullet}>• Travel recommendations</Text>
                  <Text style={styles.welcomeBullet}>• Destination information</Text>
                  <Text style={styles.welcomeBullet}>• Travel planning tips</Text>
                  <Text style={styles.welcomeBullet}>• Budget advice</Text>
                  <Text style={styles.welcomeText}>
                    Just ask me anything about your trip!
                  </Text>
                </View>
              )}
              
              {chatHistory.map((chat, index) => (
                <View key={index} style={[styles.chatMessage, chat.isBot ? styles.botMessage : styles.userMessage]}>
                  <View style={[styles.messageBubble, chat.isBot ? styles.botBubble : styles.userBubble]}>
                    <Text style={[styles.chatText, chat.isBot ? styles.botText : styles.userText]}>
                      {chat.message}
                    </Text>
                  </View>
                </View>
              ))}
              
              {isLoading && (
                <View style={[styles.chatMessage, styles.botMessage]}>
                  <View style={[styles.messageBubble, styles.botBubble]}>
                    <Text style={[styles.chatText, styles.botText, styles.typingText]}>
                      Thinking...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>


          
          {/* Current Location Display */}
          {userLocation && (
            <View style={styles.currentLocationContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.currentLocationText}>
                📍 Departing from: {userLocation}
              </Text>
              <TouchableOpacity 
                style={styles.changeLocationButton}
                onPress={() => setUserLocation('')}
              >
                <Text style={styles.changeLocationButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Chat Input - Now at the bottom */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me about your trip..."
              placeholderTextColor="#666"
              value={message}
              onChangeText={(text) => {
                // Check if the last character is a newline (Enter key)
                if (text.endsWith('\n') && text.length > 1) {
                  // Remove the newline and send the message
                  const messageToSend = text.slice(0, -1).trim();
                  if (messageToSend) {
                    setMessage('');
                    sendMessage(messageToSend);
                  }
                } else {
                  setMessage(text);
                }
              }}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
              enablesReturnKeyAutomatically={true}
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Schedule Section */}
        {currentItinerary && (
          <GlassCard style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Your Itinerary</Text>
            
            {/* Currency Converter */}
            <CurrencyConverter
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
            />
            
            {/* Debug Info */}

            
            {/* Trip Summary Header */}
            <GlassCard style={styles.tripSummary}>
              <Text style={styles.tripTitle}>
                {currentItinerary.trip_type === 'multi_city' 
                  ? `🌍 ${currentItinerary.destinations?.join(' → ') || 'Multi-City Trip'}`
                  : `🌍 ${currentItinerary.destination || 'Trip'}`
                }
              </Text>
              
              {!isUndecidedDates && currentItinerary.duration && (
                <Text style={styles.tripDuration}>{currentItinerary.duration}</Text>
              )}
              
              {isUndecidedDates && (
                <View style={styles.undecidedDatesBanner}>
                  <Text style={styles.undecidedDatesText}>📅 Undecided Dates - Planning Mode</Text>
                  <Text style={styles.undecidedDatesSubtext}>
                    This is a preliminary plan. Add specific dates when ready to book.
                  </Text>
                  <TouchableOpacity 
                    style={styles.addDatesButton}
                    onPress={handleAddDatesToPlan}
                  >
                    <Text style={styles.addDatesButtonText}>Add Travel Dates</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Export Button */}
              <TouchableOpacity 
                style={styles.exportButton} 
                onPress={handleExportItinerary}
                disabled={isExporting}
              >
                <Text style={styles.exportButtonText}>
                  {isExporting ? 'Exporting...' : Platform.OS === 'web' ? '📥 Download PDF' : '📧 Email PDF'}
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Flight Information */}
            {includeFlights && currentItinerary.flights && currentItinerary.flights.length > 0 && currentItinerary.flights[0]?.airline && currentItinerary.flights[1]?.airline ? (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>✈️ Flight Information</Text>
                
                {isUndecidedDates && (
                  <View style={styles.undecidedDatesInfo}>
                    <Text style={styles.undecidedDatesInfoText}>
                      💡 Flight suggestions are based on general availability. Specific dates and times will be confirmed when you select travel dates.
                    </Text>
                  </View>
                )}
                
                <View style={styles.flightContainer}>
                  <GlassCard style={styles.flightCard}>
                    <Text style={styles.flightLabel}>Outbound</Text>
                    <Text style={styles.airline}>{currentItinerary.flights[0].airline} {currentItinerary.flights[0].flight}</Text>
                    <Text style={styles.route}>{currentItinerary.flights[0].departure}</Text>
                    {!isUndecidedDates && (
                      <Text style={styles.timeText}>{currentItinerary.flights[0].time}</Text>
                    )}
                    <Text style={styles.priceText}>{formatPrice(currentItinerary.flights[0].price)}</Text>
                    
                    {/* View Details Button for Outbound Flight */}
                    <TouchableOpacity
                      style={[styles.detailButton, isLoadingDetails && styles.detailButtonDisabled]}
                      onPress={() => showDetails('flight', currentItinerary.flights[0])}
                      disabled={isLoadingDetails}
                    >
                      {isLoadingDetails ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : (
                        <Ionicons name="information-circle" size={16} color="#007AFF" />
                      )}
                      <Text style={[styles.detailButtonText, isLoadingDetails && styles.detailButtonTextDisabled]}>
                        {isLoadingDetails ? 'Loading...' : 'View Details'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Alternatives Selector for Outbound Flight */}
                    {currentItinerary.flights[0]?.alternatives && currentItinerary.flights[0].alternatives.length > 0 && (
                      <AlternativesSelector
                        title="Outbound Flight Alternatives"
                        currentOption={currentItinerary.flights[0]}
                        alternatives={currentItinerary.flights[0].alternatives}
                        onSelect={(option: FlightInfo | HotelInfo) => {
                          // Update the itinerary with the selected flight
                          const selectedFlight = option as FlightInfo;
                          
                          // Preserve the alternatives array for the new flight
                          const updatedFlight = {
                            ...selectedFlight,
                            alternatives: currentItinerary.flights[0].alternatives
                          };
                          
                          if (currentItinerary && currentItinerary.trip_type === 'multi_city') {
                            const updatedItinerary = {
                              ...currentItinerary,
                              flights: [
                                updatedFlight, // Replace outbound flight with alternatives preserved
                                currentItinerary.flights[1] // Keep return flight
                              ]
                            };
                            setCurrentItinerary(updatedItinerary);
                          } else if (currentItinerary && currentItinerary.trip_type === 'single_city') {
                            const updatedItinerary = {
                              ...currentItinerary,
                              flights: [
                                updatedFlight, // Replace outbound flight with alternatives preserved
                                currentItinerary.flights[1] // Keep return flight
                              ]
                            };
                            setCurrentItinerary(updatedItinerary);
                          }
                        }}
                        type="flight"
                      />
                    )}
                  </GlassCard>
                  
                  <GlassCard style={styles.flightCard}>
                    <Text style={styles.flightLabel}>Return</Text>
                    <Text style={styles.airline}>{currentItinerary.flights[1].airline} {currentItinerary.flights[1].flight}</Text>
                    <Text style={styles.route}>{currentItinerary.flights[1].departure}</Text>
                    {!isUndecidedDates && (
                      <Text style={styles.timeText}>{currentItinerary.flights[1].time}</Text>
                    )}
                    <Text style={styles.priceText}>{formatPrice(currentItinerary.flights[1].price)}</Text>
                    
                    {/* View Details Button for Return Flight */}
                    <TouchableOpacity
                      style={[styles.detailButton, isLoadingDetails && styles.detailButtonDisabled]}
                      onPress={() => showDetails('flight', currentItinerary.flights[1])}
                      disabled={isLoadingDetails}
                    >
                      {isLoadingDetails ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : (
                        <Ionicons name="information-circle" size={16} color="#007AFF" />
                      )}
                      <Text style={[styles.detailButtonText, isLoadingDetails && styles.detailButtonTextDisabled]}>
                        {isLoadingDetails ? 'Loading...' : 'View Details'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Alternatives Selector for Return Flight */}
                    {currentItinerary.flights[1]?.alternatives && currentItinerary.flights[1].alternatives.length > 0 && (
                      <AlternativesSelector
                        title="Return Flight Alternatives"
                        currentOption={currentItinerary.flights[1]}
                        alternatives={currentItinerary.flights[1].alternatives}
                        onSelect={(option: FlightInfo | HotelInfo) => {
                          // Update the itinerary with the selected flight
                          const selectedFlight = option as FlightInfo;
                          
                          // Preserve the alternatives array for the new flight
                          const updatedFlight = {
                            ...selectedFlight,
                            alternatives: currentItinerary.flights[1].alternatives
                          };
                          
                          if (currentItinerary && currentItinerary.trip_type === 'multi_city') {
                            const updatedItinerary = {
                              ...currentItinerary,
                              flights: [
                                currentItinerary.flights[0], // Keep outbound flight
                                updatedFlight // Replace return flight with alternatives preserved
                              ]
                            };
                            setCurrentItinerary(updatedItinerary);
                          } else if (currentItinerary && currentItinerary.trip_type === 'single_city') {
                            const updatedItinerary = {
                              ...currentItinerary,
                              flights: [
                                currentItinerary.flights[0], // Keep outbound flight
                                updatedFlight // Replace return flight with alternatives preserved
                              ]
                            };
                            setCurrentItinerary(updatedItinerary);
                          }
                        }}
                        type="flight"
                      />
                    )}
                  </GlassCard>
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Flights:</Text>
                  <Text style={styles.totalAmount}>{formatPrice(totalFlights)}</Text>
                </View>
              </GlassCard>
            ) : includeFlights && (
              // No flight information available
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>✈️ Flight Information</Text>
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No flight information available</Text>
                  <Text style={styles.noDataSubtext}>
                    The AI couldn't find suitable flight options for your trip. Try adjusting your preferences or dates.
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Hotel Information - Handle both single and multi-city */}
            {includeHotel && (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>🏨 Hotel Information</Text>
                
                {isUndecidedDates && (
                  <View style={styles.undecidedDatesInfo}>
                    <Text style={styles.undecidedDatesInfoText}>
                      💡 Hotel suggestions are based on general availability and pricing. Specific check-in/check-out dates will be confirmed when you select travel dates.
                    </Text>
                  </View>
                )}
                
                {currentItinerary.trip_type === 'multi_city' && currentItinerary.hotels && currentItinerary.hotels.length > 0 ? (
                  // Multi-city hotels
                  <View>
                    {currentItinerary.hotels.map((hotel, index) => (
                      <GlassCard key={index} style={styles.hotelCard}>
                        <Text style={styles.hotelCity}>{hotel.city}</Text>
                        <Text style={styles.hotelName}>{hotel.name}</Text>
                        <Text style={styles.hotelAddress}>{hotel.address}</Text>
                        <Text style={styles.hotelDetails}>{hotel.room_type}</Text>
                        {!isUndecidedDates && (
                          <>
                            <Text style={styles.hotelDates}>Check-in: {hotel.check_in}</Text>
                            <Text style={styles.hotelDates}>Check-out: {hotel.check_out}</Text>
                          </>
                        )}
                        <View style={styles.hotelPriceRow}>
                          <Text style={styles.hotelPriceLabel}>{formatPrice(hotel.price)}/night × {hotel.total_nights} nights</Text>
                          <Text style={styles.hotelPriceTotal}>{formatPrice(hotel.price * hotel.total_nights)}</Text>
                        </View>
                        
                        {/* View Details Button for Multi-City Hotel */}
                        <TouchableOpacity
                          style={[styles.detailButton, isLoadingDetails && styles.detailButtonDisabled]}
                          onPress={() => showDetails('hotel', hotel)}
                          disabled={isLoadingDetails}
                        >
                          {isLoadingDetails ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                          ) : (
                            <Ionicons name="information-circle" size={16} color="#007AFF" />
                          )}
                          <Text style={[styles.detailButtonText, isLoadingDetails && styles.detailButtonTextDisabled]}>
                            {isLoadingDetails ? 'Loading...' : 'View Details'}
                          </Text>
                        </TouchableOpacity>
                        
                        {/* Alternatives Selector for Hotel */}
                        {hotel.alternatives && hotel.alternatives.length > 0 && (
                          <AlternativesSelector
                            title={`${hotel.city} Hotel Alternatives`}
                            currentOption={hotel}
                            alternatives={hotel.alternatives}
                            onSelect={(option: FlightInfo | HotelInfo) => {
                              // Update the itinerary with the selected hotel
                              const selectedHotel = option as HotelInfo;
                              
                              // Preserve the alternatives array for the new hotel
                              const updatedHotel = {
                                ...selectedHotel,
                                alternatives: hotel.alternatives
                              };
                              
                              if (currentItinerary && currentItinerary.trip_type === 'multi_city') {
                                const updatedItinerary = {
                                  ...currentItinerary,
                                  hotels: currentItinerary.hotels.map((h, i) => 
                                    i === index ? updatedHotel : h
                                  )
                                };
                                setCurrentItinerary(updatedItinerary);
                              }
                            }}
                            type="hotel"
                          />
                        )}
                      </GlassCard>
                    ))}
                  </View>
                ) : currentItinerary.trip_type === 'single_city' && currentItinerary.hotel && currentItinerary.hotel.name ? (
                  // Single city hotel
                  <GlassCard style={styles.hotelCard}>
                    <Text style={styles.hotelName}>{currentItinerary.hotel.name}</Text>
                    <Text style={styles.hotelAddress}>{currentItinerary.hotel.address}</Text>
                    <Text style={styles.hotelDetails}>{currentItinerary.hotel.room_type}</Text>
                    {!isUndecidedDates && (
                      <>
                        <Text style={styles.hotelDates}>Check-in: {currentItinerary.hotel.check_in}</Text>
                        <Text style={styles.hotelDates}>Check-out: {currentItinerary.hotel.check_out}</Text>
                      </>
                    )}
                    <View style={styles.hotelPriceRow}>
                      <Text style={styles.hotelPriceLabel}>{formatPrice(currentItinerary.hotel.price)}/night × {currentItinerary.hotel.total_nights} nights</Text>
                      <Text style={styles.hotelPriceTotal}>{formatPrice(currentItinerary.hotel.price * currentItinerary.hotel.total_nights)}</Text>
                    </View>
                    
                    {/* View Details Button for Single City Hotel */}
                    <TouchableOpacity
                      style={[styles.detailButton, isLoadingDetails && styles.detailButtonDisabled]}
                      onPress={() => showDetails('hotel', currentItinerary.hotel)}
                      disabled={isLoadingDetails}
                    >
                      {isLoadingDetails ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : (
                        <Ionicons name="information-circle" size={16} color="#007AFF" />
                      )}
                      <Text style={[styles.detailButtonText, isLoadingDetails && styles.detailButtonTextDisabled]}>
                        {isLoadingDetails ? 'Loading...' : 'View Details'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Alternatives Selector for Single City Hotel */}
                    {currentItinerary.hotel.alternatives && currentItinerary.hotel.alternatives.length > 0 && (
                      <AlternativesSelector
                        title="Hotel Alternatives"
                        currentOption={currentItinerary.hotel}
                        alternatives={currentItinerary.hotel.alternatives}
                        onSelect={(option: FlightInfo | HotelInfo) => {
                          // Update the itinerary with the selected hotel
                          const selectedHotel = option as HotelInfo;
                          
                          // Preserve the alternatives array for the new hotel
                          const updatedHotel = {
                            ...selectedHotel,
                            alternatives: currentItinerary.hotel.alternatives
                          };
                          
                          if (currentItinerary && currentItinerary.trip_type === 'single_city') {
                            const updatedItinerary = {
                              ...currentItinerary,
                              hotel: updatedHotel
                            };
                            setCurrentItinerary(updatedItinerary);
                          }
                        }}
                        type="hotel"
                      />
                    )}
                  </GlassCard>
                ) : (
                  // No hotel information available
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No hotel information available</Text>
                    <Text style={styles.noDataSubtext}>
                      The AI couldn't find suitable hotel options for your trip. Try adjusting your preferences or dates.
                    </Text>
                  </View>
                )}
              </GlassCard>
            )}

            {/* Inter-City Transportation for Multi-City Trips */}
            {currentItinerary.trip_type === 'multi_city' && currentItinerary.inter_city_transport && currentItinerary.inter_city_transport.length > 0 && (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>🚄 Inter-City Transportation</Text>
                
                {currentItinerary.inter_city_transport.map((transport, index) => (
                  <GlassCard key={index} style={styles.transportCard}>
                    <View style={styles.transportHeader}>
                      <Text style={styles.transportType}>{transport.type.toUpperCase()}</Text>
                      <Text style={styles.transportPrice}>{formatPrice(transport.price)}</Text>
                    </View>
                    <Text style={styles.transportCarrier}>{transport.carrier}</Text>
                    <Text style={styles.transportRoute}>{transport.from_location} → {transport.to}</Text>
                    <Text style={styles.transportTime}>{transport.departure_time} - {transport.arrival_time}</Text>
                    <Text style={styles.transportDescription}>{transport.description}</Text>
                  </GlassCard>
                ))}
              </GlassCard>
            )}

            {/* Interactive Schedules - Separate for each city */}
            {includeActivities && (
              <>
                {/* Schedule for First Location */}
                <GlassCard style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    📅 {currentItinerary.trip_type === 'multi_city' 
                      ? `Activities in ${currentItinerary.hotels?.[0]?.city || 'City 1'}`
                      : 'Daily Activities'
                    }
                  </Text>
                  <CleanSchedule
                    schedule={mapItineraryToSchedule(currentItinerary.trip_type === 'multi_city' 
                      ? schedule.filter(day => day.city === currentItinerary.hotels?.[0]?.city)
                      : schedule
                    )}
                    onEditActivity={handleActivityEdit}
                    onDeleteActivity={handleDeleteActivity}
                    onAddActivity={handleAddActivity}
                    totalActivities={totalActivities}
                    editingActivity={editingActivity}
                    alternativeActivities={alternativeActivities}
                    onActivityEditSave={handleActivityEditSave}
                    onActivityEditCancel={handleActivityEditCancel}
                    formatPrice={formatPrice}
                  />
                </GlassCard>

                {/* Schedule for Second Location (Multi-city only) */}
                {currentItinerary.trip_type === 'multi_city' && currentItinerary.hotels && currentItinerary.hotels.length > 1 && (
                  <GlassCard style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      📅 Activities in {currentItinerary.hotels[1]?.city || 'City 2'}
                    </Text>
                    <CleanSchedule
                      schedule={mapItineraryToSchedule(schedule.filter(day => day.city === currentItinerary.hotels[1]?.city))}
                      onEditActivity={handleActivityEdit}
                      onDeleteActivity={handleDeleteActivity}
                      onAddActivity={handleAddActivity}
                      totalActivities={totalActivities}
                      editingActivity={editingActivity}
                      alternativeActivities={alternativeActivities}
                      onActivityEditSave={handleActivityEditSave}
                      onActivityEditCancel={handleActivityEditCancel}
                      formatPrice={formatPrice}
                    />
                  </GlassCard>
                )}
              </>
            )}

            {/* Purchase Options */}
            <GlassCard style={styles.section}>
              <Text style={styles.sectionTitle}>Purchase Options</Text>
              <View style={styles.checkboxGroup}>
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setIncludeFlights(!includeFlights)}>
                  <View style={[styles.checkbox, includeFlights && styles.checkboxChecked]}>
                    {includeFlights && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Flights</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setIncludeHotel(!includeHotel)}>
                  <View style={[styles.checkbox, includeHotel && styles.checkboxChecked]}>
                    {includeHotel && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Hotel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setIncludeActivities(!includeActivities)}>
                  <View style={[styles.checkbox, includeActivities && styles.checkboxChecked]}>
                    {includeActivities && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Activities</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Cost Summary */}
            <GlassCard style={styles.costSummary}>
              <Text style={styles.costTitle}>Cost Breakdown</Text>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, !includeFlights && styles.costLabelDisabled]}>Flights:</Text>
                <Text style={[styles.costValue, !includeFlights && styles.costValueDisabled]}>{formatPrice(includeFlights ? totalFlights : 0)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, !includeHotel && styles.costLabelDisabled]}>Hotel:</Text>
                <Text style={[styles.costValue, !includeHotel && styles.costValueDisabled]}>{formatPrice(includeHotel ? totalHotel : 0)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, !includeActivities && styles.costLabelDisabled]}>Activities:</Text>
                <Text style={[styles.costValue, !includeActivities && styles.costValueDisabled]}>{formatPrice(includeActivities ? bookableActivities : 0)}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Ready to Book:</Text>
                <Text style={styles.totalValue}>{formatPrice(bookableTotal)}</Text>
              </View>
            </GlassCard>

            {/* Save Schedule Button */}
            <TouchableOpacity style={styles.saveScheduleButton} onPress={handleSaveSchedule}>
              <Text style={styles.saveScheduleButtonText}>💾 Save This Schedule</Text>
            </TouchableOpacity>

            {/* Checkout Button - Only show when dates are decided */}
            {!isUndecidedDates && (
              <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                <Text style={styles.checkoutButtonText}>Checkout Now</Text>
              </TouchableOpacity>
            )}
            
            {isUndecidedDates && (
              <View style={styles.undecidedCheckoutInfo}>
                <Text style={styles.undecidedCheckoutText}>
                  💡 To proceed to checkout, please select specific travel dates above.
                </Text>
              </View>
            )}
          </GlassCard>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

    {/* Alternatives Modal */}
    <Modal visible={showAlternatives} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Alternative Activities</Text>
          <ScrollView style={styles.alternativesList}>
            {selectedActivity && alternativeActivities[selectedActivity.name]?.map((alternative, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeItem}
                onPress={() => handleSelectAlternative(alternative)}
              >
                <Text style={styles.alternativeName}>{alternative.name}</Text>
                <Text style={styles.alternativePrice}>{formatPrice(alternative.price)}</Text>
                <Text style={styles.alternativeDescription}>{alternative.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalButton} onPress={() => setShowAlternatives(false)}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </Modal>



    {/* Add Activity Modal */}
    <Modal visible={showAddActivityModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Activity</Text>
          <Text style={styles.modalHelpText}>
            Select an activity from the LLM suggestions to add to your schedule
          </Text>
          
          <ScrollView style={styles.alternativesList}>
            {(() => {
              // Get all available alternatives that aren't already in the schedule
              const allAlternatives = getAllAvailableAlternatives();
              
              if (allAlternatives.length === 0) {
                return (
                  <View style={styles.noAlternativesContainer}>
                    <Text style={styles.noAlternativesText}>No additional activities available</Text>
                    <Text style={styles.noAlternativesSubtext}>
                      All LLM-suggested activities are already in your schedule
                    </Text>
                  </View>
                );
              }
              
              return allAlternatives.map((alternative, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => handleSelectActivityFromAlternatives(alternative, selectedDayForActivity!)}
                >
                  <View style={styles.alternativeHeader}>
                    <Text style={styles.alternativeName}>{alternative.name}</Text>
                    <Text style={styles.alternativePrice}>{formatPrice(alternative.price)}</Text>
                  </View>
                  <Text style={styles.alternativeDescription}>{alternative.description}</Text>
                  <View style={[
                    styles.typeBadge,
                    alternative.type === 'bookable' ? styles.bookableBadge : styles.estimatedBadge
                  ]}>
                    <Text style={[
                      styles.typeText,
                      alternative.type === 'bookable' ? styles.bookableText : styles.estimatedText
                    ]}>
                      {alternative.type === 'bookable' ? 'Bookable' : 'Estimated'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ));
            })()}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => {
              setShowAddActivityModal(false);
              setSelectedDayForActivity(null);
            }}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </Modal>

    {/* Save Schedule Modal */}
    <Modal visible={showSaveModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalContent}>
          <Text style={styles.modalTitle}>Save Schedule</Text>
          <TextInput
            style={styles.timeInputMain}
            placeholder="Enter schedule name"
            placeholderTextColor="#666"
            value={scheduleName}
            onChangeText={setScheduleName}
            autoFocus
          />
          <View style={styles.timePickerButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.timePickerCancelButton]} onPress={() => setShowSaveModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleSaveScheduleConfirm}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
    
    {/* Details Modal */}
    <DetailsModal
      visible={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      type={detailsType}
      data={detailsData}
    />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100, // Increased padding to ensure content is visible above navigation bar
    backgroundColor: '#1a1a1a',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  oldTripsButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  testModalButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  oldTripsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  testModalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Increased padding to ensure content is visible above navigation bar
  },
  chatSection: {
    marginBottom: 30,
  },

  quickOptionsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  quickOptionsTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencySection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  currencySectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  undecidedCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  undecidedInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginTop: 10,
  },
  
  // Location Detection Styles
  locationDetectionContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationButtonDisabled: {
    backgroundColor: '#666',
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationHintText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },

  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  currentLocationText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  changeLocationButton: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeLocationButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  undecidedInfoText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    textAlign: 'center',
  },
  undecidedDatesBanner: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginBottom: 15,
    alignItems: 'center',
  },
  undecidedDatesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 5,
  },
  undecidedDatesSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  undecidedCheckoutInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    marginBottom: 30,
    alignItems: 'center',
  },
  undecidedCheckoutText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  undecidedDatesInfo: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginBottom: 15,
    alignItems: 'center',
  },
  undecidedDatesInfoText: {
    fontSize: 13,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 18,
  },
  addDatesButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  addDatesButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cccccc',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  scheduleSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  datesContainer: {
    marginBottom: 20,
  },
  datesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 5,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'flex-end',
    minHeight: 50,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    height: 44,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHistoryContainer: {
    marginBottom: 20,
    minHeight: 200,
    maxHeight: 400,
  },
  chatHistoryScroll: {
    flex: 1,
  },
  chatHistoryContent: {
    paddingVertical: 10,
  },
  welcomeMessage: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  welcomeBullet: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
    textAlign: 'center',
  },
  chatMessage: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 5,
  },
  chatText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#ffffff',
  },
  typingText: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  tripSummary: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  destinationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
  },
  travelInfo: {
    marginBottom: 20,
  },
  flightInfo: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  hotelInfo: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  dayContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  activityContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    width: 60,
  },
  activityName: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginHorizontal: 10,
  },
  activityPrice: {
    fontSize: 14,
    color: '#00FF00',
    fontWeight: '600',
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  deleteHint: {
    fontSize: 10,
    color: '#cccccc',
    marginTop: 2,
  },
  costSummary: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkboxTick: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  checkboxLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  costTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#cccccc',
  },
  costLabelDisabled: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  costValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  costValueDisabled: {
    color: '#666',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#00FF00',
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    padding: 24,
    margin: 24,
    minWidth: 300,
  },
  modalContentActive: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  alternativesList: {
    maxHeight: 300,
  },
  alternativeItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  alternativePrice: {
    fontSize: 14,
    color: '#00FF00',
    marginBottom: 5,
  },
  alternativeDescription: {
    fontSize: 14,
    color: '#cccccc',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 15,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  oldTripsList: {
    maxHeight: 400,
  },
  tripItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  tripDate: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 10,
  },
  activityRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: 5,
  },
  star: {
    fontSize: 18,
    color: '#666',
  },
  starFilled: {
    color: '#FFD700',
  },
  section: {
    marginBottom: 20,
  },
  flightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  flightCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  flightLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
  },
  airline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  route: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 2,
  },
  hotelCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  hotelAddress: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
  },
  hotelDetails: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 2,
  },
  hotelDates: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 2,
  },
  hotelPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  hotelPriceLabel: {
    fontSize: 14,
    color: '#cccccc',
  },
  hotelPriceTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  timeContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityClickable: {
    flex: 1,
    paddingVertical: 4,
  },
  activityText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bookableBadge: {
    backgroundColor: '#6366f1',
  },
  estimatedBadge: {
    backgroundColor: '#666',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bookableText: {
    color: 'white',
  },
  estimatedText: {
    color: '#ccc',
  },
  changeActivityHint: {
    fontSize: 11,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayDate: {
    fontSize: 14,
    color: '#cccccc',
  },
  priceText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginRight: 8,
  },
  editTimeHint: {
    fontSize: 10,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 2,
  },
  draggingActivity: {
    opacity: 0.5,
    backgroundColor: '#333',
  },
  dragOverActivity: {
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  timeInputContainer: {
    marginBottom: 20,
  },
  timeInputMainLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  timeInputMain: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
  },
  timeInputHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // New Interactive Schedule Styles
  scheduleSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
    minHeight: 60,
  },
  timeSlotDragOver: {
    borderColor: '#6366f1',
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
  },
  timeSlotEmpty: {
    borderStyle: 'dashed',
    borderColor: '#666',
  },
  timeSlotHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  timeSlotTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
  },
  activityCard: {
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    margin: 4,
  },
  activityDragging: {
    opacity: 0.5,
    backgroundColor: '#444',
  },
  emptyTimeSlot: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTimeSlotText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  editHint: {
    fontSize: 11,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  
  // Activity Edit Form Styles
  activityEditForm: {
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    margin: 8,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 12,
    minWidth: 60,
  },
  currentActivitySection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  currentActivityCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
  },
  currentActivityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  currentActivityPrice: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  currentActivityType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  alternativesSection: {
    marginBottom: 16,
  },
  alternativeCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  alternativeCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#2a2a2a',
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  alternativePrice: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  alternativeType: {
    fontSize: 11,
    color: '#999',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  alternativeDescription: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
  },
  editFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeInputError: {
    color: '#FF3B30',
    borderColor: '#FF3B30',
  },
  timePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timePickerCancelButton: {
    backgroundColor: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
  },
  dayPickerContainer: {
    marginTop: 10,
  },
  dayPickerOption: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  dayPickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#ffffff',
    transform: [{ scale: 1.05 }],
  },
  dayPickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
  },
  dayPickerOptionTextSelected: {
    color: '#ffffff',
  },
  dayPickerOptionDate: {
    fontSize: 12,
    color: '#cccccc',
  },
  dayPickerOptionDateSelected: {
    color: '#ffffff',
  },
  moveActivityInfo: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  moveActivityText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 5,
  },
  moveActivityFromText: {
    fontSize: 12,
    color: '#cccccc',
  },
  scheduleHelpText: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#999999',
  },
  modalHelpText: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  stepGuide: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  stepGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepGuideText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 3,
  },

  emptyDayContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyDayText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
    fontWeight: '600',
  },
  emptyDaySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  addActivityButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  addActivityButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  saveScheduleButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  saveScheduleButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
  exportActions: {
    marginTop: 15,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  transportCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  transportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  transportType: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: 'bold',
  },
  transportPrice: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  transportCarrier: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 2,
  },
  transportRoute: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 2,
  },
  transportTime: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 2,
  },
  transportDescription: {
    fontSize: 12,
    color: '#cccccc',
  },
  hotelCity: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: 'bold',
  },
  tripTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  tripDuration: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 10,
  },
  tripDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 5,
  },
  scheduleNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  noAlternativesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAlternativesText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  noAlternativesSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  detailButtonDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  detailButtonTextDisabled: {
    color: '#666',
  },
});
