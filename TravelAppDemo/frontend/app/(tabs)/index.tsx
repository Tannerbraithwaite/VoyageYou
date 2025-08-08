import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { router, useLocalSearchParams } from 'expo-router';
import { DatePicker } from '@/components';
import { TripDates, EnhancedItinerary, ItineraryActivity } from '@/types';
import { formatDateForChat, calculateTripDuration } from '@/utils';

interface Activity {
  time: string;
  activity: string;
  price: number;
  type: 'bookable' | 'estimated';
}

interface AlternativeActivity {
  name: string;
  price: number;
  type: 'bookable' | 'estimated';
  description: string;
}

export default function HomeScreen() {
  const params = useLocalSearchParams();
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
  const [currentItinerary, setCurrentItinerary] = useState<EnhancedItinerary | null>(null);
  const [showOldTrips, setShowOldTrips] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [schedule, setSchedule] = useState([
    {
      day: 1,
      date: 'July 15, 2024',
      activities: [
        { time: '09:00', activity: 'Arrive at Hotel', price: 0, type: 'bookable' as const },
        { time: '10:30', activity: 'City Walking Tour', price: 25, type: 'bookable' as const },
        { time: '13:00', activity: 'Lunch at Local Bistro', price: 35, type: 'estimated' as const },
        { time: '15:00', activity: 'Museum Visit', price: 18, type: 'bookable' as const },
        { time: '18:00', activity: 'Dinner & Wine Tasting', price: 65, type: 'estimated' as const },
      ]
    }
  ]);
  const [alternativeActivities, setAlternativeActivities] = useState<Record<string, AlternativeActivity[]>>({});
  const [oldTripsState, setOldTripsState] = useState([
    {
      id: 1,
      destination: 'Paris, France',
      date: 'July 2024',
      activities: [
        { name: 'Eiffel Tower Visit', rating: 5 },
        { name: 'Louvre Museum', rating: 4 },
        { name: 'Seine River Cruise', rating: 5 }
      ]
    },
    {
      id: 2,
      destination: 'Tokyo, Japan',
      date: 'March 2024',
      activities: [
        { name: 'Sushi Making Class', rating: 5 },
        { name: 'Senso-ji Temple', rating: 4 },
        { name: 'Shibuya Crossing', rating: 3 }
      ]
    }
  ]);

  console.log('HomeScreen rendering with isLoading:', isLoading, 'response:', response);

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        if (response.ok) {
          console.log('Backend connection successful');
        } else {
          console.error('Backend connection failed');
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        Alert.alert('Connection Error', 'Unable to connect to the travel assistant. Please check your internet connection.');
      }
    };

    testBackendConnection();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { message: userMessage, isBot: false }]);
    
    // Prepare the message with trip dates context
    let enhancedMessage = userMessage;
    if (tripDates.startDate && tripDates.endDate) {
      const startDateStr = formatDateForChat(tripDates.startDate);
      const endDateStr = formatDateForChat(tripDates.endDate);
      const duration = calculateTripDuration(tripDates.startDate, tripDates.endDate);
      
      let dateContext = `Trip Dates: ${startDateStr} to ${endDateStr} (${duration} days)`;
      if (tripDates.isFlexible) {
        dateContext += ' - Flexible with dates';
      }
      
      enhancedMessage = `${dateContext}\n\nUser Request: ${userMessage}`;
    }
    
    await sendMessageToAPI(enhancedMessage);
  };

  const sendMessageToAPI = async (messageToSend: string) => {
    console.log('Sending message to API:', messageToSend);
    try {
      // Try enhanced endpoint first
      const response = await fetch('http://localhost:8000/chat/enhanced/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          user_id: userId,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Enhanced API response:', result);
        
        // Store the itinerary data
        setCurrentItinerary(result);
        
        // Create a user-friendly response message
        const botResponse = `I've created a detailed itinerary for your trip to ${result.destination}!\n\n` +
          `📅 Duration: ${result.duration}\n` +
          `✈️ Flights: ${result.flights.length} flights included\n` +
          `🏨 Hotel: ${result.hotel.name}\n` +
          `💰 Total Cost: $${result.total_cost}\n\n` +
          `Your schedule has been loaded below. You can continue chatting with me to make changes or ask questions!`;
        
        setResponse(botResponse);
        setChatHistory(prev => [...prev, { message: botResponse, isBot: true }]);
        
        // Update schedule with the new itinerary
        updateScheduleFromItinerary(result);
        
        // Store in session storage for persistence
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentItinerary', JSON.stringify(result));
        }
      } else {
        // Fallback to regular chat endpoint
        const fallbackResponse = await fetch('http://localhost:8000/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageToSend,
            user_id: userId,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          setResponse(fallbackResult.response);
          setChatHistory(prev => [...prev, { message: fallbackResult.response, isBot: true }]);
        } else {
          throw new Error(`HTTP ${fallbackResponse.status}`);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setResponse(errorMessage);
      setChatHistory(prev => [...prev, { message: errorMessage, isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateScheduleFromItinerary = (itinerary: EnhancedItinerary) => {
    // Convert enhanced itinerary to schedule format
    const newSchedule = itinerary.schedule.map((day: any) => ({
      day: day.day,
      date: day.date,
      activities: day.activities.map((activity: any) => ({
        time: activity.time,
        activity: activity.name,
        price: activity.price,
        type: activity.type as 'bookable' | 'estimated'
      }))
    }));
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

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleChangeActivity = (activity: Activity) => {
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
            act.activity === selectedActivity.activity 
              ? { ...act, activity: alternative.name, price: alternative.price, type: alternative.type }
              : act
          )
        }))
      );
    }
    setShowAlternatives(false);
    setSelectedActivity(null);
  };

  const handleDeleteActivity = (dayIndex: number, activityIndex: number) => {
    setSchedule(prevSchedule => 
      prevSchedule.map((day, index) => 
        index === dayIndex 
          ? { ...day, activities: day.activities.filter((_, actIndex) => actIndex !== activityIndex) }
          : day
      )
    );
  };

  // Calculate totals
  const totalFlights = currentItinerary?.flights.reduce((sum, flight) => sum + flight.price, 0) || 1700;
  const totalHotel = currentItinerary?.hotel ? currentItinerary.hotel.price * currentItinerary.hotel.total_nights : 540;
  const bookableActivities = schedule.flatMap(day => 
    day.activities.filter(activity => activity.type === 'bookable')
  ).reduce((sum, activity) => sum + activity.price, 0);
  
  const calculatedBookableTotal = totalFlights + totalHotel + bookableActivities;
  const enhancedItineraryBookableCost = currentItinerary?.bookable_cost;
  const bookableTotal = Math.max(calculatedBookableTotal, enhancedItineraryBookableCost || 0);

  console.log('Price Calculation Debug:', {
    enhancedItinerary: !!currentItinerary,
    enhancedItineraryBookableCost,
    calculatedBookableTotal,
    bookableTotal,
    totalFlights,
    totalHotel,
    bookableActivities,
    flightInfo: currentItinerary?.flights.reduce((acc, flight) => {
      acc[flight.type] = flight.price;
      return acc;
    }, {} as Record<string, number>),
    hotelInfo: currentItinerary?.hotel ? {
      price: currentItinerary.hotel.price,
      totalNights: currentItinerary.hotel.total_nights,
      total: currentItinerary.hotel.price * currentItinerary.hotel.total_nights
    } : null
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassCard style={styles.header}>
        <Text style={styles.headerTitle}>Travel Assistant</Text>
        <TouchableOpacity onPress={() => setShowOldTrips(true)} style={styles.oldTripsButton}>
          <Text style={styles.oldTripsButtonText}>View Old Trips</Text>
        </TouchableOpacity>
      </GlassCard>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chat Section */}
        <GlassCard style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Chat with AI Assistant</Text>
          
          {/* Trip Dates */}
          <View style={styles.datesContainer}>
            <Text style={styles.datesTitle}>Trip Dates</Text>
            <DatePicker
              tripDates={tripDates}
              onDatesChange={setTripDates}
            />
          </View>

          {/* Chat Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me about your trip..."
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
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

          {/* Chat History */}
          <View style={styles.chatHistory}>
            {chatHistory.map((chat, index) => (
              <View key={index} style={[styles.chatMessage, chat.isBot ? styles.botMessage : styles.userMessage]}>
                <Text style={[styles.chatText, chat.isBot ? styles.botText : styles.userText]}>
                  {chat.message}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.chatMessage, styles.botMessage]}>
                <Text style={styles.chatText}>Thinking...</Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Schedule Section */}
        {currentItinerary && (
          <GlassCard style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Your Itinerary</Text>
            
            {/* Trip Summary */}
            <GlassCard style={styles.tripSummary}>
              <Text style={styles.destinationTitle}>{currentItinerary.destination}</Text>
              <Text style={styles.durationText}>{currentItinerary.duration}</Text>
              <Text style={styles.descriptionText}>{currentItinerary.description}</Text>
            </GlassCard>

            {/* Flight & Hotel Info */}
            <View style={styles.travelInfo}>
              <GlassCard style={styles.flightInfo}>
                <Text style={styles.infoTitle}>✈️ Flights</Text>
                {currentItinerary.flights.map((flight, index) => (
                  <Text key={index} style={styles.infoText}>
                    {flight.airline} {flight.flight} • {flight.departure} • ${flight.price}
                  </Text>
                ))}
              </GlassCard>
              
              <GlassCard style={styles.hotelInfo}>
                <Text style={styles.infoTitle}>🏨 Hotel</Text>
                <Text style={styles.infoText}>{currentItinerary.hotel.name}</Text>
                <Text style={styles.infoText}>{currentItinerary.hotel.address}</Text>
                <Text style={styles.infoText}>
                  {currentItinerary.hotel.check_in} - {currentItinerary.hotel.check_out}
                </Text>
                <Text style={styles.infoText}>${currentItinerary.hotel.price}/night</Text>
              </GlassCard>
            </View>

            {/* Daily Schedule */}
            <View style={styles.scheduleContainer}>
              {schedule.map((day, dayIndex) => (
                <GlassCard key={dayIndex} style={styles.dayContainer}>
                  <Text style={styles.dayTitle}>Day {day.day} - {day.date}</Text>
                  {day.activities.map((activity, activityIndex) => (
                    <View key={activityIndex} style={styles.activityContainer}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                        <Text style={styles.activityName}>{activity.activity}</Text>
                        <Text style={styles.activityPrice}>${activity.price}</Text>
                      </View>
                      <View style={styles.activityActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleChangeActivity(activity)}
                        >
                          <Text style={styles.actionButtonText}>Tap to change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteActivity(dayIndex, activityIndex)}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              ))}
            </View>

            {/* Cost Summary */}
            <GlassCard style={styles.costSummary}>
              <Text style={styles.costTitle}>Cost Breakdown</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Flights:</Text>
                <Text style={styles.costValue}>${totalFlights}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Hotel:</Text>
                <Text style={styles.costValue}>${totalHotel}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Activities:</Text>
                <Text style={styles.costValue}>${bookableActivities}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Ready to Book:</Text>
                <Text style={styles.totalValue}>${bookableTotal}</Text>
              </View>
            </GlassCard>

            {/* Checkout Button */}
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Checkout Now</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>

      {/* Alternatives Modal */}
      <Modal visible={showAlternatives} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alternative Activities</Text>
            <ScrollView style={styles.alternativesList}>
              {selectedActivity && alternativeActivities[selectedActivity.activity]?.map((alternative, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => handleSelectAlternative(alternative)}
                >
                  <Text style={styles.alternativeName}>{alternative.name}</Text>
                  <Text style={styles.alternativePrice}>${alternative.price}</Text>
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

      {/* Old Trips Modal */}
      <Modal visible={showOldTrips} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Past Trips</Text>
            <ScrollView style={styles.oldTripsList}>
              {oldTripsState.map((trip) => (
                <GlassCard key={trip.id} style={styles.tripItem}>
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                  <Text style={styles.tripDate}>{trip.date}</Text>
                  {trip.activities.map((activity, index) => (
                    <View key={index} style={styles.activityRating}>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      {renderStars(activity.rating, handleRateActivity, activity.name, trip.id)}
                    </View>
                  ))}
                </GlassCard>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowOldTrips(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
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
  oldTripsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatSection: {
    marginBottom: 30,
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
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHistory: {
    marginBottom: 20,
  },
  chatMessage: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 15,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  botMessage: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    marginRight: 50,
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
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  costSummary: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
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
  costValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
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
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
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
});
