import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { router, useLocalSearchParams } from 'expo-router';
import { DatePicker, CleanSchedule } from '@/components';
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

interface SavedSchedule {
  id: string;
  name: string;
  destination: string;
  duration: string;
  savedAt: string;
  status: 'unbooked' | 'booked' | 'past';
  itinerary: EnhancedItinerary;
  schedule: Activity[][];
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
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
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

  // Purchase options
  const [includeFlights, setIncludeFlights] = useState(true);
  const [includeHotel, setIncludeHotel] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);

  // Persist purchase options for checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const options = { includeFlights, includeHotel, includeActivities };
      try {
        sessionStorage.setItem('purchaseOptions', JSON.stringify(options));
      } catch (e) {
        // ignore
      }
    }
  }, [includeFlights, includeHotel, includeActivities]);

  console.log('HomeScreen rendering with isLoading:', isLoading, 'response:', response);

  // Activity Edit Form Component
  const ActivityEditForm = ({ 
    activity, 
    alternatives, 
    onSave, 
    onCancel 
  }: { 
    activity: Activity; 
    alternatives: AlternativeActivity[]; 
    onSave: (activity: Activity) => void; 
    onCancel: () => void; 
  }) => {
    const [editedActivity, setEditedActivity] = useState<Activity>(activity);
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
            style={styles.timeInput}
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
            <Text style={styles.currentActivityName}>{activity.activity}</Text>
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

  // Load itinerary data from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedItinerary = sessionStorage.getItem('currentItinerary');
      if (storedItinerary) {
        try {
          const itinerary = JSON.parse(storedItinerary);
          console.log('📱 Loading stored itinerary from sessionStorage:', itinerary);
          setCurrentItinerary(itinerary);
          updateScheduleFromItinerary(itinerary);
          console.log('✅ Itinerary loaded and schedule updated from sessionStorage');
        } catch (error) {
          console.error('Error parsing stored itinerary:', error);
        }
      } else {
        console.log('📱 No stored itinerary found in sessionStorage');
      }
    }
  }, []);

  // Load saved schedules from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSchedules = localStorage.getItem('savedSchedules');
        if (storedSchedules) {
          const schedules = JSON.parse(storedSchedules);
          setSavedSchedules(schedules);
          console.log('📱 Loaded saved schedules from localStorage:', schedules.length);
        }
      } catch (error) {
        console.error('Error loading saved schedules:', error);
      }
    }
  }, []);

  // Interactive schedule editing - no modal needed

  // Old drag and drop functions removed - replaced with new interactive system

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

  // Auto-scroll chat to bottom when history or loading state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatHistory, isLoading]);

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
      activities: sortActivitiesByTime(day.activities.map((activity: any) => ({
        time: activity.time,
        activity: activity.name,
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
          day.activities.some(activity => activity.activity === alt.name)
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

  // New interactive schedule functions
  const handleActivityEdit = (dayIndex: number, activityIndex: number) => {
    setEditingActivity({ dayIndex, activityIndex, isEditing: true });
  };

  const handleActivityEditCancel = () => {
    setEditingActivity(null);
  };

  const handleActivityEditSave = (dayIndex: number, activityIndex: number, updatedActivity: Activity) => {
    console.log('🔄 handleActivityEditSave called:');
    console.log('   dayIndex:', dayIndex);
    console.log('   activityIndex:', activityIndex);
    console.log('   updatedActivity:', updatedActivity);
    console.log('   Current schedule before update:', schedule);
    
    setSchedule(prevSchedule => {
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
      
      console.log('   New schedule after update:', newSchedule);
      return newSchedule;
    });
    
    setEditingActivity(null);
    console.log('✅ Activity edit saved successfully');
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
      const ok = typeof window !== 'undefined' ? window.confirm(`Delete "${activity.activity}" from Day ${dayIndex + 1}?`) : true;
      if (ok) {
        performDeleteActivity(dayIndex, activityIndex);
      }
      return;
    }

    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.activity}" from Day ${dayIndex + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            performDeleteActivity(dayIndex, activityIndex);
            Alert.alert('Activity Deleted', `"${activity.activity}" has been successfully deleted from Day ${dayIndex + 1}`, [{ text: 'OK' }]);
          }
        }
      ]
    );
  };

  const handleAddActivity = (dayIndex: number) => {
    const newActivity: Activity = { time: '12:00', activity: 'New Activity', price: 0, type: 'estimated' };
    setSchedule(prevSchedule => 
      prevSchedule.map((day, index) => 
        index === dayIndex ? { 
          ...day, 
          activities: sortActivitiesByTime([...day.activities, newActivity])
        } : day
      )
    );
    const newActivityIndex = schedule[dayIndex].activities.length;
    setEditingActivity({ dayIndex, activityIndex: newActivityIndex, isEditing: true });
  };

  // Calculate totals
  const totalFlights = currentItinerary?.flights.reduce((sum, flight) => sum + flight.price, 0) || 1700;
  const totalHotel = currentItinerary?.hotel ? currentItinerary.hotel.price * currentItinerary.hotel.total_nights : 540;
  const bookableActivities = schedule.flatMap(day => 
    day.activities.filter(activity => activity.type === 'bookable')
  ).reduce((sum, activity) => sum + activity.price, 0);
  
  const totalActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => daySum + activity.price, 0), 0
  );
  
  console.log('🔄 Schedule updated, recalculating totals:');
  console.log('   New schedule:', schedule);
  console.log('   New totalActivities:', totalActivities);
  
  const selectedFlights = includeFlights ? totalFlights : 0;
  const selectedHotel = includeHotel ? totalHotel : 0;
  const selectedActivities = includeActivities ? bookableActivities : 0;

  const calculatedBookableTotal = totalFlights + totalHotel + bookableActivities;
  const enhancedItineraryBookableCost = currentItinerary?.bookable_cost;
  const bookableTotal = selectedFlights + selectedHotel + selectedActivities;

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

  const handleSaveSchedule = () => {
    if (!currentItinerary) {
      Alert.alert('No Schedule', 'There is no current schedule to save.');
      return;
    }

    // Set default name and show modal
    setScheduleName(`${currentItinerary.destination} Trip`);
    setShowSaveModal(true);
  };

  const handleSaveScheduleConfirm = () => {
    if (scheduleName && scheduleName.trim()) {
      const newSchedule: SavedSchedule = {
        id: Date.now().toString(),
        name: scheduleName.trim(),
        destination: currentItinerary!.destination,
        duration: currentItinerary!.duration,
        savedAt: new Date().toISOString(),
        status: 'unbooked',
        itinerary: currentItinerary!,
        schedule: schedule.map(day => day.activities)
      };

      // Add to local state
      setSavedSchedules(prev => [...prev, newSchedule]);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        const existingSchedules = JSON.parse(localStorage.getItem('savedSchedules') || '[]');
        const updatedSchedules = [...existingSchedules, newSchedule];
        localStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
        
        console.log('💾 Schedule saved:', newSchedule);
        Alert.alert('Success', `Schedule "${scheduleName.trim()}" has been saved!`);
      }

      // Close modal and reset
      setShowSaveModal(false);
      setScheduleName('');
    } else {
      Alert.alert('Invalid Name', 'Please enter a valid name for the schedule.');
    }
  };

  return (
    <View style={styles.container}>
              {/* Header */}
        <GlassCard style={styles.header}>
          <Text style={styles.headerTitle}>Travel Assistant</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => setShowOldTrips(true)} style={styles.oldTripsButton}>
              <Text style={styles.oldTripsButtonText}>View Old Trips</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chat Section */}
        <GlassCard style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Chat with AI Assistant</Text>

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
          </View>
          
          {/* Trip Dates */}
          <View style={styles.datesContainer}>
            <Text style={styles.datesTitle}>Trip Dates</Text>
            <DatePicker
              tripDates={tripDates}
              onDatesChange={setTripDates}
            />
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

          {/* Chat Input - Now at the bottom */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me about your trip..."
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
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
            
            {/* Debug Info */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug: currentItinerary exists</Text>
              <Text style={styles.debugText}>Schedule length: {schedule.length}</Text>
              <Text style={styles.debugText}>First day activities: {schedule[0]?.activities?.length || 0}</Text>
            </View>
            
            {/* Trip Summary */}
            <GlassCard style={styles.tripSummary}>
              <Text style={styles.destinationTitle}>{currentItinerary.destination}</Text>
              <Text style={styles.durationText}>{currentItinerary.duration}</Text>
              <Text style={styles.descriptionText}>{currentItinerary.description}</Text>
            </GlassCard>

            {/* Flight Information */}
            {includeFlights && (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>✈️ Flight Information</Text>
                
                <View style={styles.flightContainer}>
                  <GlassCard style={styles.flightCard}>
                    <Text style={styles.flightLabel}>Outbound</Text>
                    <Text style={styles.airline}>{currentItinerary.flights[0]?.airline} {currentItinerary.flights[0]?.flight}</Text>
                    <Text style={styles.route}>{currentItinerary.flights[0]?.departure}</Text>
                    <Text style={styles.timeText}>{currentItinerary.flights[0]?.time}</Text>
                    <Text style={styles.priceText}>${currentItinerary.flights[0]?.price}</Text>
                  </GlassCard>
                  
                  <GlassCard style={styles.flightCard}>
                    <Text style={styles.flightLabel}>Return</Text>
                    <Text style={styles.airline}>{currentItinerary.flights[1]?.airline} {currentItinerary.flights[1]?.flight}</Text>
                    <Text style={styles.route}>{currentItinerary.flights[1]?.departure}</Text>
                    <Text style={styles.timeText}>{currentItinerary.flights[1]?.time}</Text>
                    <Text style={styles.priceText}>${currentItinerary.flights[1]?.price}</Text>
                  </GlassCard>
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Flights:</Text>
                  <Text style={styles.totalAmount}>${totalFlights}</Text>
                </View>
              </GlassCard>
            )}

            {/* Hotel Information */}
            {includeHotel && (
              <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>🏨 Hotel Information</Text>
                
                <GlassCard style={styles.hotelCard}>
                  <Text style={styles.hotelName}>{currentItinerary.hotel.name}</Text>
                  <Text style={styles.hotelAddress}>{currentItinerary.hotel.address}</Text>
                  <Text style={styles.hotelDetails}>{currentItinerary.hotel.room_type}</Text>
                  <Text style={styles.hotelDates}>Check-in: {currentItinerary.hotel.check_in}</Text>
                  <Text style={styles.hotelDates}>Check-out: {currentItinerary.hotel.check_out}</Text>
                  <View style={styles.hotelPriceRow}>
                    <Text style={styles.hotelPriceLabel}>${currentItinerary.hotel.price}/night × {currentItinerary.hotel.total_nights} nights</Text>
                    <Text style={styles.hotelPriceTotal}>${currentItinerary.hotel.price * currentItinerary.hotel.total_nights}</Text>
                  </View>
                </GlassCard>
              </GlassCard>
            )}
            
            {/* Interactive Daily Schedule (hide when Activities are excluded) */}
            {includeActivities && (
              <CleanSchedule
                schedule={schedule}
                onEditActivity={handleActivityEdit}
                onDeleteActivity={handleDeleteActivity}
                onAddActivity={handleAddActivity}
                totalActivities={totalActivities}
                editingActivity={editingActivity}
                alternativeActivities={{ all: getAllAvailableAlternatives() }}
                onActivityEditSave={handleActivityEditSave}
                onActivityEditCancel={handleActivityEditCancel}
              />
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
                <Text style={[styles.costValue, !includeFlights && styles.costValueDisabled]}>${includeFlights ? totalFlights : 0}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, !includeHotel && styles.costLabelDisabled]}>Hotel:</Text>
                <Text style={[styles.costValue, !includeHotel && styles.costValueDisabled]}>${includeHotel ? totalHotel : 0}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, !includeActivities && styles.costLabelDisabled]}>Activities:</Text>
                <Text style={[styles.costValue, !includeActivities && styles.costValueDisabled]}>${includeActivities ? bookableActivities : 0}</Text>
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

            {/* Save Schedule Button */}
            <TouchableOpacity style={styles.saveScheduleButton} onPress={handleSaveSchedule}>
              <Text style={styles.saveScheduleButtonText}>💾 Save This Schedule</Text>
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

      {/* Save Schedule Modal */}
      <Modal visible={showSaveModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Schedule</Text>
            <TextInput
              style={styles.timeInput}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
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
  timeInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  timeInput: {
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
  debugText: {
    fontSize: 10,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'monospace',
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
  debugInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  saveScheduleButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveScheduleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
