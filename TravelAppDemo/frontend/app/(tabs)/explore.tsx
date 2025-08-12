import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { useFocusEffect } from '@react-navigation/native';
import { EnhancedItinerary } from '@/types';

interface Activity {
  time: string;
  activity: string;
  price: number;
  type: 'bookable' | 'estimated';
}

export default function ScheduleScreen() {
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

  const [enhancedItinerary, setEnhancedItinerary] = useState<EnhancedItinerary | null>(null);

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
            .sort((a: Activity, b: Activity) => {
              // Sort activities by time within each day
              const timeA = new Date(`2000-01-01 ${a.time}`);
              const timeB = new Date(`2000-01-01 ${b.time}`);
              return timeA.getTime() - timeB.getTime();
            })
          }));
          
          // Sort days by day number
          newSchedule.sort((a: any, b: any) => a.day - b.day);
          setSchedule(newSchedule);
        } catch (error) {
          console.error('Error parsing stored itinerary:', error);
        }
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItineraryData();
    }, [])
  );

  useEffect(() => {
    loadItineraryData();
  }, []);

  const totalActivities = schedule.reduce((sum, day) =>
    sum + day.activities.reduce((daySum, activity) => daySum + activity.price, 0), 0
  );

  const totalFlights = enhancedItinerary ? enhancedItinerary.flights.reduce((sum, flight) => sum + flight.price, 0) : 0;
  const totalHotel = enhancedItinerary ? enhancedItinerary.hotel.price * enhancedItinerary.hotel.total_nights : 0;
  const bookableActivities = schedule.flatMap(day => 
    day.activities.filter(activity => activity.type === 'bookable')
  ).reduce((sum, activity) => sum + activity.price, 0);
  const estimatedActivities = schedule.flatMap(day => 
    day.activities.filter(activity => activity.type === 'estimated')
  ).reduce((sum, activity) => sum + activity.price, 0);
  const totalCost = totalFlights + totalHotel + totalActivities;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassCard style={styles.header}>
          <Text style={styles.headerTitle}>📅 Schedule Overview</Text>
          <Text style={styles.headerSubtitle}>
            View your current travel schedule
          </Text>
        </GlassCard>

        {/* Enhanced Itinerary Summary */}
        {enhancedItinerary && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>✈️ Trip Summary</Text>
            <Text style={styles.destinationText}>{enhancedItinerary.destination}</Text>
            <Text style={styles.durationText}>{enhancedItinerary.duration}</Text>
            <Text style={styles.descriptionText}>{enhancedItinerary.description}</Text>
            
            {/* Flight Info */}
            <GlassCard style={styles.subsection}>
              <Text style={styles.subsectionTitle}>✈️ Flights</Text>
              {enhancedItinerary.flights.map((flight, index) => (
                <View key={index} style={styles.flightRow}>
                  <Text style={styles.flightInfo}>{flight.airline} - {flight.flight}</Text>
                  <Text style={styles.flightRoute}>{flight.departure}</Text>
                  <Text style={styles.flightTime}>{flight.time}</Text>
                  <Text style={styles.flightPrice}>${flight.price}</Text>
                </View>
              ))}
            </GlassCard>

            {/* Hotel Info */}
            <GlassCard style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🏨 Hotel</Text>
              <Text style={styles.hotelName}>{enhancedItinerary.hotel.name}</Text>
              <Text style={styles.hotelAddress}>{enhancedItinerary.hotel.address}</Text>
              <Text style={styles.hotelDates}>
                {enhancedItinerary.hotel.check_in} - {enhancedItinerary.hotel.check_out}
              </Text>
              <Text style={styles.hotelPrice}>
                ${enhancedItinerary.hotel.price}/night × {enhancedItinerary.hotel.total_nights} nights
              </Text>
            </GlassCard>
          </GlassCard>
        )}

        {/* Daily Schedule - Read Only */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Daily Schedule</Text>
          <Text style={styles.scheduleHelpText}>
            💡 This is a read-only view of your schedule. Use the Home tab to edit activities.
          </Text>
          
          {schedule.map((day) => (
            <GlassCard key={day.day} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>Day {day.day}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
              
              {/* Show all scheduled activities */}
              {day.activities.length > 0 ? (
                day.activities.map((activity, index) => (
                  <View key={index} style={styles.activityContainer}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.time}>{activity.time}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityInfo}>
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
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyDayContainer}>
                  <Text style={styles.emptyDayText}>No activities scheduled for this day</Text>
                  <Text style={styles.emptyDaySubtext}>Use the Home tab to plan your activities</Text>
                </View>
              )}
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
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
    fontWeight: '500',
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
  subsection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  flightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flightInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  flightRoute: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  flightTime: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  flightPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
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
  hotelDates: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  hotelPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  destinationText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
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
  activityInfo: {
    flex: 1,
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
  scheduleHelpText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 8,
  },
  totalSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
});
