import React, { useState, useEffect } from 'react';
import { safeSessionStorage } from '@/utils/storage';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookingConfirmation } from '@/types';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [bookingData, setBookingData] = useState<BookingConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get booking data from route params or safeSessionStorage
    const loadBookingData = () => {
      try {
        if (params.bookingData) {
          // If passed via route params
          const data = JSON.parse(params.bookingData as string);
          setBookingData(data);
        } else {
          // Try to get from safeSessionStorage as fallback
          const storedData = safeSessionStorage.getItem('lastBookingConfirmation');
          if (storedData) {
            const data = JSON.parse(storedData);
            setBookingData(data);
          } else {
            setError('No booking data found');
          }
        }
      } catch (err) {
        console.error('Error loading booking data:', err);
        setError('Failed to load booking confirmation');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [params]);

  const handleBackToHome = () => {
    // Clear the booking data from safeSessionStorage
    if (typeof window !== 'undefined') {
      safeSessionStorage.removeItem('lastBookingConfirmation');
      safeSessionStorage.removeItem('selectedItinerary');
    }
    router.push('/');
  };

  const handleViewItinerary = () => {
    router.push('/explore');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Processing your booking...</Text>
        </View>
      </View>
    );
  }

  if (error || !bookingData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Booking Error</Text>
          <Text style={styles.errorMessage}>
            {error || 'Unable to load booking confirmation'}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBackToHome}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isSuccess = bookingData.success;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{isSuccess ? '🎉' : '❌'}</Text>
          <Text style={styles.headerTitle}>
            {isSuccess ? 'Booking Confirmed!' : 'Booking Failed'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isSuccess 
              ? 'Your travel booking has been successfully processed'
              : 'There was an issue processing your booking'
            }
          </Text>
        </View>

        {isSuccess && bookingData.booking && (
          <>
            {/* Booking Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking ID:</Text>
                <Text style={styles.detailValue}>{bookingData.booking.booking_id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Confirmation Number:</Text>
                <Text style={styles.detailValue}>{bookingData.booking.confirmation_number}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, styles.statusConfirmed]}>
                  {bookingData.booking.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cost:</Text>
                <Text style={styles.detailValue}>${bookingData.booking.total_cost.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booked On:</Text>
                <Text style={styles.detailValue}>
                  {new Date(bookingData.booking.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Itinerary Summary */}
            {bookingData.booking.itinerary_summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trip Summary</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Destination:</Text>
                  <Text style={styles.detailValue}>{bookingData.booking.itinerary_summary.destination}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dates:</Text>
                  <Text style={styles.detailValue}>{bookingData.booking.itinerary_summary.dates}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Travelers:</Text>
                  <Text style={styles.detailValue}>{bookingData.booking.itinerary_summary.travelers}</Text>
                </View>
              </View>
            )}

            {/* Next Steps */}
            {bookingData.booking.next_steps && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Next Steps</Text>
                {bookingData.booking.next_steps.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Contact Support */}
            {bookingData.booking.contact_support && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Need Help?</Text>
                <Text style={styles.supportText}>
                  If you have any questions about your booking, please contact our support team:
                </Text>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Email:</Text>
                  <Text style={styles.contactValue}>{bookingData.booking.contact_support.email}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Phone:</Text>
                  <Text style={styles.contactValue}>{bookingData.booking.contact_support.phone}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {!isSuccess && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What happened?</Text>
            <Text style={styles.errorDetails}>
              {bookingData.message || 'An unexpected error occurred while processing your booking. Please try again or contact support if the problem persists.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {isSuccess ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleViewItinerary}>
              <Text style={styles.secondaryButtonText}>View Itineraries</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBackToHome}>
              <Text style={styles.primaryButtonText}>Plan New Trip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBackToHome}>
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 40,
  },
  headerIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusConfirmed: {
    color: '#10b981',
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  supportText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: '#999',
    width: 60,
  },
  contactValue: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  errorDetails: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginLeft: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

