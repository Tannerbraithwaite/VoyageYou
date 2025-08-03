import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';

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

  const alternativeActivities: Record<string, AlternativeActivity[]> = {
    'City Walking Tour': [
      { name: 'Private Guided Tour', price: 45, type: 'bookable', description: 'Exclusive 2-hour private tour with expert guide' },
      { name: 'Self-Guided Audio Tour', price: 15, type: 'bookable', description: 'Downloadable audio guide with map' },
      { name: 'Bike Tour', price: 35, type: 'bookable', description: '3-hour cycling tour of major landmarks' },
    ],
    'Museum Visit': [
      { name: 'Louvre Skip-the-Line Tour', price: 45, type: 'bookable', description: 'Guided tour with priority access' },
      { name: 'Musée d\'Orsay Visit', price: 22, type: 'bookable', description: 'Impressionist masterpieces collection' },
      { name: 'Pompidou Center', price: 18, type: 'bookable', description: 'Modern and contemporary art' },
    ],
    'Art Gallery Tour': [
      { name: 'Private Gallery Tour', price: 60, type: 'bookable', description: 'Exclusive access to private collections' },
      { name: 'Street Art Walking Tour', price: 25, type: 'bookable', description: 'Explore Paris street art scene' },
      { name: 'Photography Workshop', price: 75, type: 'bookable', description: 'Learn photography while touring galleries' },
    ],
    'Boat Tour': [
      { name: 'Luxury Dinner Cruise', price: 120, type: 'bookable', description: '3-course meal with live music' },
      { name: 'Sunset Seine Cruise', price: 35, type: 'bookable', description: 'Romantic evening on the river' },
      { name: 'Speedboat Adventure', price: 85, type: 'bookable', description: 'Thrilling high-speed river tour' },
    ],
    'Concert at Opera House': [
      { name: 'Ballet Performance', price: 95, type: 'bookable', description: 'Classical ballet at Palais Garnier' },
      { name: 'Jazz Club Night', price: 45, type: 'bookable', description: 'Intimate jazz venue experience' },
      { name: 'Classical Music Concert', price: 75, type: 'bookable', description: 'Orchestra performance' },
    ],
    'Cooking Class': [
      { name: 'Pastry Making Workshop', price: 95, type: 'bookable', description: 'Learn French pastry techniques' },
      { name: 'Wine & Cheese Pairing', price: 65, type: 'bookable', description: 'Expert sommelier guided tasting' },
      { name: 'Market to Table Experience', price: 110, type: 'bookable', description: 'Shop at markets then cook together' },
    ],
    'Wine Cellar Visit': [
      { name: 'Champagne Region Tour', price: 150, type: 'bookable', description: 'Full-day champagne tasting tour' },
      { name: 'Wine Tasting Masterclass', price: 75, type: 'bookable', description: 'Learn wine appreciation techniques' },
      { name: 'Bordeaux Wine Tour', price: 200, type: 'bookable', description: 'Day trip to Bordeaux vineyards' },
    ],
  };

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

  const flightInfo = {
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

  const hotelInfo = {
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
  const totalCost = totalActivities + totalFlights + totalHotel;

  // Calculate bookable vs estimated costs
  const bookableActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => 
      activity.type === 'bookable' ? daySum + activity.price : daySum, 0), 0
  );
  const estimatedActivities = schedule.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => 
      activity.type === 'estimated' ? daySum + activity.price : daySum, 0), 0
  );
  const bookableTotal = totalFlights + totalHotel + bookableActivities;

  const handleRateActivity = (tripId: number, activityName: string, newRating: number) => {
    // In a real app, this would update the backend
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
    // In a real app, this would integrate with payment processing
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
        <View style={styles.header}>
          <Text style={styles.title}>Your Travel Schedule</Text>
          <Text style={styles.subtitle}>3 Days in Paris - Art & Food Lover's Dream</Text>
          <TouchableOpacity 
            style={styles.oldTripsButton}
            onPress={() => setShowOldTrips(true)}
          >
            <Text style={styles.oldTripsButtonText}>View Old Trips</Text>
          </TouchableOpacity>
        </View>
        
        {/* Flight Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✈️ Flight Information</Text>
          
          <View style={styles.flightContainer}>
            <View style={styles.flightCard}>
              <Text style={styles.flightLabel}>Outbound</Text>
              <Text style={styles.airline}>{flightInfo.outbound.airline} {flightInfo.outbound.flight}</Text>
              <Text style={styles.route}>{flightInfo.outbound.departure}</Text>
              <Text style={styles.timeText}>{flightInfo.outbound.time}</Text>
              <Text style={styles.priceText}>${flightInfo.outbound.price}</Text>
            </View>
            
            <View style={styles.flightCard}>
              <Text style={styles.flightLabel}>Return</Text>
              <Text style={styles.airline}>{flightInfo.inbound.airline} {flightInfo.inbound.flight}</Text>
              <Text style={styles.route}>{flightInfo.inbound.departure}</Text>
              <Text style={styles.timeText}>{flightInfo.inbound.time}</Text>
              <Text style={styles.priceText}>${flightInfo.inbound.price}</Text>
            </View>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Flights:</Text>
            <Text style={styles.totalAmount}>${totalFlights}</Text>
          </View>
        </View>

        {/* Hotel Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏨 Hotel Information</Text>
          
          <View style={styles.hotelCard}>
            <Text style={styles.hotelName}>{hotelInfo.name}</Text>
            <Text style={styles.hotelAddress}>{hotelInfo.address}</Text>
            <Text style={styles.hotelDetails}>{hotelInfo.roomType}</Text>
            <Text style={styles.hotelDates}>Check-in: {hotelInfo.checkIn}</Text>
            <Text style={styles.hotelDates}>Check-out: {hotelInfo.checkOut}</Text>
            <View style={styles.hotelPriceRow}>
              <Text style={styles.hotelPriceLabel}>${hotelInfo.price}/night × {hotelInfo.totalNights} nights</Text>
              <Text style={styles.hotelPriceTotal}>${hotelInfo.price * hotelInfo.totalNights}</Text>
            </View>
          </View>
        </View>
        
        {/* Daily Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Daily Schedule</Text>
          
          {schedule.map((day) => (
            <View key={day.day} style={styles.dayContainer}>
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
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Activities:</Text>
            <Text style={styles.totalAmount}>${totalActivities}</Text>
          </View>
        </View>
        
        {/* Cost Breakdown */}
        <View style={styles.totalContainer}>
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
        </View>

        {/* Checkout Button */}
        <View style={styles.checkoutSection}>
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
        </View>
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
              <View style={styles.currentActivityCard}>
                <Text style={styles.currentActivityTitle}>Current Activity:</Text>
                <Text style={styles.currentActivityName}>{selectedActivity.activity}</Text>
                <Text style={styles.currentActivityPrice}>${selectedActivity.price}</Text>
              </View>
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
            {oldTrips.map((trip) => (
              <View key={trip.id} style={styles.tripCard}>
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
              </View>
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
