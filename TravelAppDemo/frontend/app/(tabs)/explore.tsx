import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { EnhancedItinerary, ItineraryActivity } from '@/types';

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

export default function ScheduleScreen() {
  const router = useRouter();
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
    },
    {
      day: 2,
      date: 'July 16, 2024',
      activities: [
        { time: '08:00', activity: 'Breakfast at Hotel', price: 0, type: 'bookable' as const },
        { time: '09:30', activity: 'Art Gallery Tour', price: 30, type: 'bookable' as const },
        { time: '12:00', activity: 'Street Food Market', price: 20, type: 'estimated' as const },
        { time: '14:00', activity: 'Boat Tour', price: 45, type: 'bookable' as const },
        { time: '19:00', activity: 'Concert at Opera House', price: 120, type: 'bookable' as const },
      ]
    },
    {
      day: 3,
      date: 'July 17, 2024',
      activities: [
        { time: '07:30', activity: 'Sunrise Photography Tour', price: 40, type: 'bookable' as const },
        { time: '10:00', activity: 'Cooking Class', price: 85, type: 'bookable' as const },
        { time: '13:30', activity: 'Wine Cellar Visit', price: 55, type: 'bookable' as const },
        { time: '16:00', activity: 'Shopping & Souvenirs', price: 0, type: 'estimated' as const },
        { time: '20:00', activity: 'Farewell Dinner', price: 75, type: 'estimated' as const },
      ]
    }
  ]);

  const [enhancedItinerary, setEnhancedItinerary] = useState<EnhancedItinerary | null>(null);
  const [alternativeActivities, setAlternativeActivities] = useState<Record<string, AlternativeActivity[]>>({});

  // Load enhanced itinerary data on component mount and when screen comes into focus
  const loadItineraryData = () => {
    if (typeof window !== 'undefined') {
      const storedItinerary = sessionStorage.getItem('currentItinerary');
      if (storedItinerary) {
        try {
          const itinerary = JSON.parse(storedItinerary);
          setEnhancedItinerary(itinerary);
          
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
        } catch (error) {
          console.error('Error parsing itinerary data:', error);
        }
      }
    }
  };

  // Load data on mount
  useEffect(() => {
    loadItineraryData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadItineraryData();
    }, [])
  );

  const oldTrips = [
    {
      id: 1,
      destination: 'Tokyo, Japan',
      date: 'March 2024',
      duration: '5 days',
      totalCost: 3200,
      activities: [
        { name: 'Sushi Making Class', rating: 5, cost: 80 },
        { name: 'Mount Fuji Day Trip', rating: 4, cost: 120 },
        { name: 'Tsukiji Fish Market Tour', rating: 5, cost: 45 },
        { name: 'Traditional Tea Ceremony', rating: 3, cost: 60 },
        { name: 'Akihabara Electronics Shopping', rating: 4, cost: 0 },
      ]
    },
    {
      id: 2,
      destination: 'Barcelona, Spain',
      date: 'January 2024',
      duration: '4 days',
      totalCost: 2100,
      activities: [
        { name: 'Sagrada Familia Tour', rating: 5, cost: 25 },
        { name: 'Tapas Food Tour', rating: 5, cost: 75 },
        { name: 'Gaudi Architecture Walk', rating: 4, cost: 30 },
        { name: 'Flamenco Show', rating: 3, cost: 65 },
        { name: 'Beach Day', rating: 4, cost: 0 },
      ]
    },
    {
      id: 3,
      destination: 'New York, USA',
      date: 'November 2023',
      duration: '3 days',
      totalCost: 1800,
      activities: [
        { name: 'Broadway Show', rating: 5, cost: 150 },
        { name: 'Central Park Bike Tour', rating: 4, cost: 40 },
        { name: 'Empire State Building', rating: 3, cost: 35 },
        { name: 'Brooklyn Bridge Walk', rating: 5, cost: 0 },
        { name: 'Times Square Shopping', rating: 2, cost: 0 },
      ]
    }
  ];

  const [oldTripsState, setOldTripsState] = useState(oldTrips);

  const flightInfo = enhancedItinerary ? {
    outbound: enhancedItinerary.flights[0] || {
      airline: 'Air France',
      flight: 'AF 1234',
      departure: 'JFK → CDG',
      time: '10:30 AM - 11:45 PM',
      price: 850
    },
    inbound: enhancedItinerary.flights[1] || {
      airline: 'Air France',
      flight: 'AF 1235',
      departure: 'CDG → JFK',
      time: '2:15 PM - 5:30 PM',
      price: 850
    }
  } : {
    outbound: {
      airline: 'Air France',
      flight: 'AF 1234',
      departure: 'JFK → CDG',
      time: '10:30 AM - 11:45 PM',
      price: 850
    },
    inbound: {
      airline: 'Air France',
      flight: 'AF 1235',
      departure: 'CDG → JFK',
      time: '2:15 PM - 5:30 PM',
      price: 850
    }
  };

  const hotelInfo = enhancedItinerary ? {
    name: enhancedItinerary.hotel.name,
    address: enhancedItinerary.hotel.address,
    checkIn: enhancedItinerary.hotel.check_in,
    checkOut: enhancedItinerary.hotel.check_out,
    roomType: enhancedItinerary.hotel.room_type,
    price: enhancedItinerary.hotel.price,
    totalNights: enhancedItinerary.hotel.total_nights
  } : {
    name: 'Hotel Le Marais',
    address: '123 Rue de Rivoli, Paris',
    checkIn: 'July 15, 2024 - 3:00 PM',
    checkOut: 'July 18, 2024 - 11:00 AM',
    roomType: 'Deluxe Room',
    price: 180,
    totalNights: 3
  };

  const totalActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => daySum + activity.price, 0), 0
  );
  const totalFlights = flightInfo.outbound.price + flightInfo.inbound.price;
  const totalHotel = hotelInfo.price * hotelInfo.totalNights;
  const totalCost = enhancedItinerary ? enhancedItinerary.total_cost : (totalActivities + totalFlights + totalHotel);

  // Calculate bookable vs estimated costs
  const bookableActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => 
      activity.type === 'bookable' ? daySum + activity.price : daySum, 0), 0
  );
  const estimatedActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => 
      activity.type === 'estimated' ? daySum + activity.price : daySum, 0), 0
  );
  // Calculate bookable total ensuring flights and hotels are always included
  const calculatedBookableTotal = totalFlights + totalHotel + bookableActivities;
  const bookableTotal = enhancedItinerary 
    ? Math.max(enhancedItinerary.bookable_cost || 0, calculatedBookableTotal) // Use the higher value to ensure all costs are included
    : calculatedBookableTotal;
  
  // Debug logging for price calculations
  console.log('Price Calculation Debug:', {
    enhancedItinerary: !!enhancedItinerary,
    enhancedItineraryBookableCost: enhancedItinerary?.bookable_cost,
    calculatedBookableTotal,
    bookableTotal,
    totalFlights,
    totalHotel,
    bookableActivities,
    flightInfo: {
      outbound: flightInfo.outbound.price,
      inbound: flightInfo.inbound.price
    },
    hotelInfo: {
      price: hotelInfo.price,
      totalNights: hotelInfo.totalNights,
      total: hotelInfo.price * hotelInfo.totalNights
    }
  });

  const handleRateActivity = (tripId: number, activityName: string, newRating: number) => {
    // Update the rating in the state
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
    console.log(`Rated ${activityName} in trip ${tripId} with ${newRating} stars`);
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
    console.log(`Processing checkout for bookable items: $${bookableTotal}`);
    // Navigate to checkout page
    router.push('/checkout');
  };

  const handleChangeActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowAlternatives(true);
  };

  const handleSelectAlternative = (alternative: AlternativeActivity) => {
    if (!selectedActivity) return;
    
    // Update the schedule with the selected alternative
    setSchedule(prevSchedule => 
      prevSchedule.map(day => ({
        ...day,
        activities: day.activities.map(activity => 
          activity === selectedActivity 
            ? { ...activity, activity: alternative.name, price: alternative.price, type: alternative.type }
            : activity
        )
      }))
    );
    
    console.log(`Selected alternative: ${alternative.name} for ${selectedActivity.activity}`);
    setShowAlternatives(false);
    setSelectedActivity(null);
  };

  const handleDeleteActivity = (dayIndex: number, activityIndex: number) => {
    setSchedule(prevSchedule => 
      prevSchedule.map((day, dayIdx) => 
        dayIdx === dayIndex 
          ? { ...day, activities: day.activities.filter((_, actIdx) => actIdx !== activityIndex) }
          : day
      )
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <GlassCard style={styles.header}>
          <Text style={styles.title}>Your Travel Schedule</Text>
          <Text style={styles.subtitle}>
            {enhancedItinerary 
              ? `${enhancedItinerary.duration} in ${enhancedItinerary.destination} - ${enhancedItinerary.description}`
              : '3 Days in Paris - Art & Food Lover\'s Dream'
            }
          </Text>
          <TouchableOpacity 
            style={styles.oldTripsButton}
            onPress={() => setShowOldTrips(true)}
          >
            <Text style={styles.oldTripsButtonText}>View Old Trips</Text>
          </TouchableOpacity>
        </GlassCard>
        
        {/* Flight Information */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>✈️ Flight Information</Text>
          
          <View style={styles.flightContainer}>
            <GlassCard style={styles.flightCard}>
              <Text style={styles.flightLabel}>Outbound</Text>
              <Text style={styles.airline}>{flightInfo.outbound.airline} {flightInfo.outbound.flight}</Text>
              <Text style={styles.route}>{flightInfo.outbound.departure}</Text>
              <Text style={styles.timeText}>{flightInfo.outbound.time}</Text>
              <Text style={styles.priceText}>${flightInfo.outbound.price}</Text>
            </GlassCard>
            
            <GlassCard style={styles.flightCard}>
              <Text style={styles.flightLabel}>Return</Text>
              <Text style={styles.airline}>{flightInfo.inbound.airline} {flightInfo.inbound.flight}</Text>
              <Text style={styles.route}>{flightInfo.inbound.departure}</Text>
              <Text style={styles.timeText}>{flightInfo.inbound.time}</Text>
              <Text style={styles.priceText}>${flightInfo.inbound.price}</Text>
            </GlassCard>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Flights:</Text>
            <Text style={styles.totalAmount}>${totalFlights}</Text>
          </View>
        </GlassCard>

        {/* Hotel Information */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🏨 Hotel Information</Text>
          
          <GlassCard style={styles.hotelCard}>
            <Text style={styles.hotelName}>{hotelInfo.name}</Text>
            <Text style={styles.hotelAddress}>{hotelInfo.address}</Text>
            <Text style={styles.hotelDetails}>{hotelInfo.roomType}</Text>
            <Text style={styles.hotelDates}>Check-in: {hotelInfo.checkIn}</Text>
            <Text style={styles.hotelDates}>Check-out: {hotelInfo.checkOut}</Text>
            <View style={styles.hotelPriceRow}>
              <Text style={styles.hotelPriceLabel}>${hotelInfo.price}/night × {hotelInfo.totalNights} nights</Text>
              <Text style={styles.hotelPriceTotal}>${hotelInfo.price * hotelInfo.totalNights}</Text>
            </View>
          </GlassCard>
        </GlassCard>
        
        {/* Daily Schedule */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Daily Schedule</Text>
          
          {schedule.map((day) => (
            <GlassCard key={day.day} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>Day {day.day}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
              
              {day.activities.map((activity, index) => (
                <View key={index} style={styles.activityContainer}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.time}>{activity.time}</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <TouchableOpacity 
                      style={styles.activityClickable}
                      onPress={() => alternativeActivities[activity.activity] && handleChangeActivity(activity)}
                      disabled={!alternativeActivities[activity.activity]}
                    >
                      <Text style={styles.activityText}>{activity.activity}</Text>
                      <View style={styles.activityDetails}>
                        {activity.price > 0 && (
                          <Text style={styles.priceText}>${activity.price}</Text>
                        )}
                        <View style={[
                          styles.typeBadge,
                          activity.type === 'bookable' ? styles.bookableBadge : styles.estimatedBadge
                        ]}>
                          <Text style={[
                            styles.typeText,
                            activity.type === 'bookable' ? styles.bookableText : styles.estimatedText
                          ]}>
                            {activity.type === 'bookable' ? 'Bookable' : 'Estimated'}
                          </Text>
                        </View>
                      </View>
                      {alternativeActivities[activity.activity] && (
                        <Text style={styles.changeActivityHint}>Tap to change</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteActivity(day.day - 1, index)}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </GlassCard>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Activities:</Text>
            <Text style={styles.totalAmount}>${totalActivities}</Text>
          </View>
        </GlassCard>
        
        {/* Cost Breakdown */}
        <GlassCard style={styles.totalContainer}>
          <Text style={styles.totalTitle}>Trip Cost Breakdown</Text>
          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Flights:</Text>
              <Text style={styles.costAmount}>${totalFlights}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Hotel:</Text>
              <Text style={styles.costAmount}>${totalHotel}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Bookable Activities:</Text>
              <Text style={styles.costAmount}>${bookableActivities}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Estimated Activities:</Text>
              <Text style={styles.costAmount}>${estimatedActivities}</Text>
            </View>
            <View style={[styles.costRow, styles.totalCostRow]}>
              <Text style={styles.totalCostLabel}>Total:</Text>
              <Text style={styles.totalCostAmount}>${totalCost}</Text>
            </View>
          </View>
          <Text style={styles.totalSubtext}>*Prices include taxes and fees</Text>
        </GlassCard>

        {/* Checkout Button */}
        <GlassCard style={styles.checkoutSection}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutTitle}>Ready to Book?</Text>
            <Text style={styles.checkoutSubtitle}>
              Secure your flights, hotel, and bookable activities
            </Text>
            <Text style={styles.checkoutAmount}>${bookableTotal}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>Checkout Now</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      {/* Alternatives Modal */}
      <Modal
        visible={showAlternatives}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Alternative Activities</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAlternatives(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedActivity && (
              <GlassCard style={styles.currentActivityCard}>
                <Text style={styles.currentActivityTitle}>Current Activity:</Text>
                <Text style={styles.currentActivityName}>{selectedActivity.activity}</Text>
                <Text style={styles.currentActivityPrice}>${selectedActivity.price}</Text>
              </GlassCard>
            )}
            
            <Text style={styles.alternativesTitle}>Choose an Alternative:</Text>
            
            {selectedActivity && alternativeActivities[selectedActivity.activity]?.map((alternative, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeCard}
                onPress={() => handleSelectAlternative(alternative)}
              >
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeName}>{alternative.name}</Text>
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
                </View>
                <Text style={styles.alternativeDescription}>{alternative.description}</Text>
                <Text style={styles.alternativePrice}>${alternative.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Old Trips Modal */}
      <Modal
        visible={showOldTrips}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Past Trips</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowOldTrips(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {oldTripsState.map((trip) => (
              <GlassCard key={trip.id} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                  <Text style={styles.tripDate}>{trip.date} • {trip.duration}</Text>
                  <Text style={styles.tripCost}>Total Cost: ${trip.totalCost}</Text>
                </View>
                
                <Text style={styles.activitiesTitle}>Rate Your Activities:</Text>
                {trip.activities.map((activity, index) => (
                  <View key={index} style={styles.activityRatingContainer}>
                    <View style={styles.activityRatingInfo}>
                      <Text style={styles.activityRatingName}>{activity.name}</Text>
                      <Text style={styles.activityRatingCost}>
                        {activity.cost > 0 ? `$${activity.cost}` : 'Free'}
                      </Text>
                    </View>
                    {renderStars(activity.rating, handleRateActivity, activity.name, trip.id)}
                  </View>
                ))}
              </GlassCard>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
    fontWeight: '500',
  },
  oldTripsButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  oldTripsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  flightContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  flightCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#333',
  },
  flightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  airline: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  route: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  hotelCard: {
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
    borderWidth: 1,
    borderColor: '#333',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  hotelAddress: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
  },
  hotelDetails: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  hotelDates: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  hotelPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  hotelPriceLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  hotelPriceTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  dayContainer: {
    marginBottom: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  dayHeader: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  dayDate: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  activityContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  changeActivityButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  changeActivityText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '600',
  },
  activityClickable: {
    flex: 1,
    paddingVertical: 4,
  },
  changeActivityHint: {
    fontSize: 11,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  costBreakdown: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    fontWeight: '600',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  totalCostRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 8,
    marginTop: 8,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
  },
  totalCostAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  totalSubtext: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  checkoutSection: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkoutInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  checkoutSubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  checkoutAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: -0.5,
  },
  checkoutButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  currentActivityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  currentActivityTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  currentActivityName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  currentActivityPrice: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
  },
  alternativesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  alternativeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginRight: 8,
  },
  alternativeDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500',
  },
  alternativePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  tripCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tripHeader: {
    marginBottom: 16,
  },
  tripDestination: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  tripDate: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    fontWeight: '500',
  },
  tripCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  activitiesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  activityRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activityRatingInfo: {
    flex: 1,
  },
  activityRatingName: {
    fontSize: 14,
    color: 'white',
    marginBottom: 2,
    fontWeight: '600',
  },
  activityRatingCost: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  star: {
    fontSize: 16,
    color: '#333',
  },
  starFilled: {
    color: '#6366f1',
  },
});
