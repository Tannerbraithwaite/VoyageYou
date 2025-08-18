import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

interface Activity {
  time: string;
  activity: string;
  price: number;
  type: 'bookable' | 'estimated';
}

interface SavedSchedule {
  id: string;
  name: string;
  destination: string;
  duration: string;
  savedAt: string;
  status: 'unbooked' | 'booked' | 'past';
  itinerary: any;
  schedule: Activity[][];
}

export default function ScheduleScreen() {
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SavedSchedule | null>(null);
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  const [activityRatings, setActivityRatings] = useState<Record<string, number>>({});

  // Load saved schedules from localStorage
  const loadSavedSchedules = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedSchedules = localStorage.getItem('savedSchedules');
        if (storedSchedules) {
          const schedules = JSON.parse(storedSchedules);
          setSavedSchedules(schedules);
          console.log('📱 Loaded saved schedules:', schedules.length);
        }
        const storedRatings = localStorage.getItem('activityRatings');
        if (storedRatings) {
          try { setActivityRatings(JSON.parse(storedRatings)); } catch {}
        }
      } catch (error) {
        console.error('Error loading saved schedules:', error);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedSchedules();
    }, [])
  );

  useEffect(() => {
    loadSavedSchedules();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return '#10b981';
      case 'unbooked': return '#f59e0b';
      case 'past': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return '✅';
      case 'unbooked': return '⏳';
      case 'past': return '📅';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScheduleClick = (schedule: SavedSchedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleDetails(true);
  };

  const handleCheckout = (schedule: SavedSchedule) => {
    // Store the selected schedule in sessionStorage for checkout
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentItinerary', JSON.stringify(schedule.itinerary));
    }
    router.push('/checkout');
  };

  // Inject the selected schedule back into the Home tab for editing
  const handleEditSchedule = (schedule: SavedSchedule) => {
    // Persist itinerary so the Home screen can pick it up
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentItinerary', JSON.stringify(schedule.itinerary));
    }

    // Close the details modal before navigating
    setShowScheduleDetails(false);

    // Navigate to the Home tab so the user can modify the schedule
    router.push('/');
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const updatedSchedules = savedSchedules.filter(s => s.id !== scheduleId);
    setSavedSchedules(updatedSchedules);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
    }
    
    if (selectedSchedule?.id === scheduleId) {
      setSelectedSchedule(null);
      setShowScheduleDetails(false);
    }
  };

  const handleStatusChange = (scheduleId: string, newStatus: 'unbooked' | 'booked' | 'past') => {
    const updatedSchedules = savedSchedules.map(schedule => 
      schedule.id === scheduleId ? { ...schedule, status: newStatus } : schedule
    );
    setSavedSchedules(updatedSchedules);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
    }
    
    if (selectedSchedule?.id === scheduleId) {
      setSelectedSchedule(updatedSchedules.find(s => s.id === scheduleId) || null);
    }
  };

  const setRating = (key: string, rating: number) => {
    setActivityRatings(prev => {
      const updated = { ...prev, [key]: rating };
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('activityRatings', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
  };

  const renderStars = (key: string) => {
    const current = activityRatings[key] || 0;
    return (
      <View style={styles.ratingRow}>
        {[1,2,3,4,5].map(star => (
          <TouchableOpacity key={star} style={styles.starButton} onPress={() => setRating(key, star)}>
            <Text style={[styles.star, star <= current && styles.starFilled]}>{star <= current ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassCard style={styles.header}>
          <Text style={styles.headerTitle}>📅 My Saved Schedules</Text>
          <Text style={styles.headerSubtitle}>
            Manage and view all your travel schedules
          </Text>
        </GlassCard>

        {/* Schedules List */}
        <View style={styles.schedulesSection}>
          {savedSchedules.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>No Saved Schedules</Text>
              <Text style={styles.emptyStateText}>
                Create a schedule in the Home tab and save it to see it here!
              </Text>
              <TouchableOpacity 
                style={styles.createScheduleButton}
                onPress={() => router.push('/')}
              >
                <Text style={styles.createScheduleButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            savedSchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={styles.scheduleCard}
                onPress={() => handleScheduleClick(schedule)}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleName}>{schedule.name}</Text>
                    <Text style={styles.scheduleDestination}>{schedule.destination}</Text>
                    <Text style={styles.scheduleDuration}>{schedule.duration}</Text>
                    <Text style={styles.scheduleDate}>Saved: {formatDate(schedule.savedAt)}</Text>
                  </View>
                  <View style={styles.scheduleStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                      <Text style={styles.statusIcon}>{getStatusIcon(schedule.status)}</Text>
                      <Text style={styles.statusText}>{schedule.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.scheduleActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(schedule.id, 'unbooked')}
                  >
                    <Text style={styles.actionButtonText}>⏳ Unbooked</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(schedule.id, 'booked')}
                  >
                    <Text style={styles.actionButtonText}>✅ Booked</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(schedule.id, 'past')}
                  >
                    <Text style={styles.actionButtonText}>📅 Past</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Schedule Details Modal */}
      <Modal
        visible={showScheduleDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSchedule && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedSchedule.name}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowScheduleDetails(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {/* Schedule Info */}
                  <GlassCard style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📋 Schedule Information</Text>
                    <Text style={styles.detailText}>Destination: {selectedSchedule.destination}</Text>
                    <Text style={styles.detailText}>Duration: {selectedSchedule.duration}</Text>
                    <Text style={styles.detailText}>Status: {selectedSchedule.status}</Text>
                    <Text style={styles.detailText}>Saved: {formatDate(selectedSchedule.savedAt)}</Text>
                  </GlassCard>

                  {/* Daily Schedule */}
                  <GlassCard style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📅 Daily Schedule</Text>
                    {selectedSchedule.schedule.map((dayActivities, dayIndex) => (
                      <View key={dayIndex} style={styles.daySection}>
                        <Text style={styles.dayTitle}>Day {dayIndex + 1}</Text>
                        {dayActivities.map((activity, activityIndex) => {
                          const key = `${selectedSchedule.id}|${dayIndex}|${activityIndex}|${activity.time}|${activity.activity}`;
                          return (
                            <View key={activityIndex} style={styles.activityItem}>
                              <Text style={styles.activityTime}>{activity.time}</Text>
                              <View style={styles.activityContent}>
                                <Text style={styles.activityName}>{activity.activity}</Text>
                                <View style={styles.activityDetails}>
                                  <Text style={styles.activityPrice}>${activity.price}</Text>
                                  <View style={[styles.typeBadge, activity.type === 'bookable' ? styles.bookableBadge : styles.estimatedBadge]}>
                                    <Text style={styles.typeText}>
                                      {activity.type === 'bookable' ? 'Bookable' : 'Estimated'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              {/* Ratings visible only for past schedules */}
                              {selectedSchedule.status === 'past' && renderStars(key)}
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </GlassCard>

                  {/* Secondary Actions */}
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditSchedule(selectedSchedule)}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Schedule',
                          'Are you sure you want to delete this schedule?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Delete', 
                              style: 'destructive',
                              onPress: () => handleDeleteSchedule(selectedSchedule.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Primary Action */}
                  <View style={styles.primaryAction}>
                    <TouchableOpacity 
                      style={styles.checkoutButton}
                      onPress={() => handleCheckout(selectedSchedule)}
                    >
                      <Text style={styles.checkoutButtonText}>💳 Checkout</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
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
  schedulesSection: {
    margin: 16,
  },
  scheduleCard: {
    marginBottom: 16,
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  scheduleDestination: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  scheduleDuration: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 12,
    color: '#999',
  },
  scheduleStatus: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyStateIcon: {
    fontSize: 48,
    color: '#6366f1',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  createScheduleButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  createScheduleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  detailText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
  daySection: {
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    width: 60,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityName: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  bookableBadge: {
    backgroundColor: '#10b981',
  },
  estimatedBadge: {
    backgroundColor: '#475569',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  starButton: {
    marginHorizontal: 2,
  },
  star: {
    fontSize: 16,
    color: '#666',
  },
  starFilled: {
    color: '#FFD700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginBottom: 15,
  },
  primaryAction: {
    paddingHorizontal: 20,
  },
  checkoutButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
