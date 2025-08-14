import React from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import GlassCard from './ui/GlassCard';

interface Activity {
  time: string;
  activity: string;
  price: number;
  type: 'bookable' | 'estimated';
}

interface Day {
  day: number;
  date: string;
  activities: Activity[];
}

interface AlternativeActivity {
  name: string;
  price: number;
  type: string;
  description: string;
}

interface CleanScheduleProps {
  schedule: Day[];
  onEditActivity: (dayIndex: number, activityIndex: number) => void;
  onDeleteActivity: (dayIndex: number, activityIndex: number) => void;
  onAddActivity: (dayIndex: number) => void;
  totalActivities: number;
  editingActivity: {
    dayIndex: number;
    activityIndex: number;
    isEditing: boolean;
  } | null;
  alternativeActivities: { all: AlternativeActivity[] };
  onActivityEditSave: (dayIndex: number, activityIndex: number, updatedActivity: Activity) => void;
  onActivityEditCancel: () => void;
  activityRatings?: Record<string, number>;
  onRateActivity?: (key: string, rating: number) => void;
}

export const CleanSchedule: React.FC<CleanScheduleProps> = ({
  schedule,
  onEditActivity,
  onDeleteActivity,
  onAddActivity,
  totalActivities,
  editingActivity,
  alternativeActivities,
  onActivityEditSave,
  onActivityEditCancel,
  activityRatings = {},
  onRateActivity
}) => {
  // Add debugging and error handling
  console.log('CleanSchedule render - schedule:', schedule);
  console.log('CleanSchedule render - totalActivities:', totalActivities);
  console.log('CleanSchedule render - editingActivity:', editingActivity);
  
  // Validate schedule data
  if (!schedule || !Array.isArray(schedule)) {
    console.error('CleanSchedule: Invalid schedule data:', schedule);
    return (
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Interactive Schedule</Text>
        <Text style={styles.scheduleHelpText}>Error: Invalid schedule data</Text>
      </GlassCard>
    );
  }

  // Activity Edit Form Component
  const ActivityEditForm = ({ 
    activity, 
    alternatives, 
    dayIndex,
    activityIndex,
    onSave, 
    onCancel 
  }: { 
    activity: Activity; 
    alternatives: AlternativeActivity[];
    dayIndex: number;
    activityIndex: number;
    onSave: (dayIndex: number, activityIndex: number, activity: Activity) => void; 
    onCancel: () => void; 
  }) => {
    const [editedActivity, setEditedActivity] = React.useState<Activity>(activity);
    const [selectedAlternative, setSelectedAlternative] = React.useState<AlternativeActivity | null>(null);
    const [customTime, setCustomTime] = React.useState(activity.time);

    const handleSave = () => {
      console.log('🔄 ActivityEditForm: Saving activity...');
      console.log('   Original activity:', activity);
      console.log('   Edited activity:', editedActivity);
      console.log('   Selected alternative:', selectedAlternative);
      console.log('   Custom time:', customTime);
      
      let finalActivity = editedActivity;
      
      if (selectedAlternative) {
        // Convert alternative to match Activity interface
        finalActivity = {
          time: customTime,
          activity: selectedAlternative.name, // Convert 'name' to 'activity'
          price: selectedAlternative.price,
          type: selectedAlternative.type as 'bookable' | 'estimated'
        };
      } else {
        // Use edited activity with custom time
        finalActivity = { ...editedActivity, time: customTime };
      }
      
      console.log('   Final activity to save:', finalActivity);
      console.log('   Calling onSave with dayIndex:', dayIndex, 'activityIndex:', activityIndex);
      
      onSave(dayIndex, activityIndex, finalActivity);
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
          />
        </View>

        {/* Activity Name Input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Activity:</Text>
          <TextInput
            style={styles.textInput}
            value={editedActivity.activity}
            onChangeText={(text) => setEditedActivity(prev => ({ ...prev, activity: text }))}
            placeholder="Activity name"
            placeholderTextColor="#666"
          />
        </View>

        {/* Price Input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Price:</Text>
          <TextInput
            style={styles.textInput}
            value={editedActivity.price.toString()}
            onChangeText={(text) => setEditedActivity(prev => ({ ...prev, price: parseFloat(text) || 0 }))}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        {/* Type Selection */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Type:</Text>
          <View style={styles.typeSelection}>
            <TouchableOpacity 
              style={[
                styles.typeOption, 
                editedActivity.type === 'bookable' && styles.typeOptionSelected
              ]}
              onPress={() => setEditedActivity(prev => ({ ...prev, type: 'bookable' }))}
            >
              <Text style={[
                styles.typeOptionText,
                editedActivity.type === 'bookable' && styles.typeOptionTextSelected
              ]}>Bookable</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.typeOption, 
                editedActivity.type === 'estimated' && styles.typeOptionSelected
              ]}
              onPress={() => setEditedActivity(prev => ({ ...prev, type: 'estimated' }))}
            >
              <Text style={[
                styles.typeOptionText,
                editedActivity.type === 'estimated' && styles.typeOptionTextSelected
              ]}>Estimated</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alternatives */}
        {alternativeActivities.all && alternativeActivities.all.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={styles.alternativesTitle}>Available Alternative Activities:</Text>
            <Text style={styles.alternativesSubtitle}>
              Select an alternative to replace the current activity
            </Text>
            {alternativeActivities.all.map((alternative, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alternativeItem,
                  selectedAlternative === alternative && styles.alternativeItemSelected
                ]}
                onPress={() => setSelectedAlternative(alternative)}
              >
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeName}>{alternative.name}</Text>
                  <Text style={styles.alternativePrice}>${alternative.price}</Text>
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
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.editFormActions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GlassCard style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Interactive Schedule</Text>
      <Text style={styles.scheduleHelpText}>
        💡 Tap activities to edit them, use the + button to add new ones
      </Text>
      
      {schedule.map((day, dayIndex) => {
        console.log(`Rendering day ${dayIndex}:`, day);
        
        if (!day || !day.activities || !Array.isArray(day.activities)) {
          console.error(`CleanSchedule: Invalid day data at index ${dayIndex}:`, day);
          return null;
        }
        
        return (
          <GlassCard key={day.day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>Day {day.day}</Text>
              <Text style={styles.dayDate}>{day.date}</Text>
            </View>
            
            {/* Only show scheduled activities - no empty time slots */}
            {day.activities.length > 0 ? (
              day.activities.map((activity, activityIndex) => {
                if (!activity) {
                  console.error(`CleanSchedule: Invalid activity at index ${activityIndex} in day ${dayIndex}`);
                  return null;
                }
                
                // Check if this activity is being edited
                const isEditing = editingActivity?.dayIndex === dayIndex && editingActivity?.activityIndex === activityIndex;
                
                return (
                  <View key={activityIndex} style={styles.scheduledActivityContainer}>
                    <View style={styles.activityTimeHeader}>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                    
                    <View style={styles.activityCard}>
                      {isEditing ? (
                        <ActivityEditForm
                          activity={activity}
                          alternatives={alternativeActivities.all || []}
                          dayIndex={dayIndex}
                          activityIndex={activityIndex}
                          onSave={onActivityEditSave}
                          onCancel={onActivityEditCancel}
                        />
                      ) : (
                        <View style={styles.activityContent}>
                          <TouchableOpacity 
                            style={styles.activityClickable}
                            onPress={() => onEditActivity(dayIndex, activityIndex)}
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
                            <Text style={styles.editHint}>Tap to edit</Text>
                          </TouchableOpacity>
                          
                          {/* Past activity rating */}
                          {(() => {
                            // Determine if this activity time is in the past
                            try {
                              const activityDateTime = new Date(`${day.date} ${activity.time}`);
                              const isPast = !isNaN(activityDateTime.getTime()) && activityDateTime.getTime() < Date.now();
                              if (!isPast) return null;
                              const key = `${day.date}|${activity.time}|${activity.activity}`;
                              const currentRating = activityRatings[key] || 0;
                              const stars = [1, 2, 3, 4, 5];
                              return (
                                <View style={styles.ratingRow}>
                                  {stars.map((star) => (
                                    <TouchableOpacity
                                      key={star}
                                      onPress={() => onRateActivity && onRateActivity(key, star)}
                                      style={styles.starButton}
                                      disabled={!onRateActivity}
                                    >
                                      <Text style={[styles.star, star <= currentRating && styles.starFilled]}>
                                        {star <= currentRating ? '★' : '☆'}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}

                          <View style={styles.activityActions}>
                            <TouchableOpacity 
                              style={styles.editButton}
                              onPress={() => onEditActivity(dayIndex, activityIndex)}
                            >
                              <Text style={styles.editButtonText}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.deleteButton}
                              onPress={() => onDeleteActivity(dayIndex, activityIndex)}
                            >
                              <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyDayContainer}>
                <Text style={styles.emptyDayText}>No activities scheduled for this day</Text>
                <Text style={styles.emptyDaySubtext}>Use the + button below to add activities</Text>
              </View>
            )}
            
            {/* Add Activity Button */}
            <TouchableOpacity 
              style={styles.addActivityButton}
              onPress={() => onAddActivity(dayIndex)}
            >
              <Text style={styles.addActivityButtonText}>+ Add Activity</Text>
            </TouchableOpacity>
          </GlassCard>
        );
      })}
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Activities:</Text>
        <Text style={styles.totalAmount}>${totalActivities}</Text>
      </View>
    </GlassCard>
  );
};

const styles = {
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  scheduleHelpText: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  dayContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dayDate: {
    fontSize: 14,
    color: '#cccccc',
  },
  scheduledActivityContainer: {
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  activityCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  activityTimeHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#3a3a3a',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
  },

  activityContent: {
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
  priceText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginRight: 8,
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
    color: 'white',
  },
  bookableText: {
    color: 'white',
  },
  estimatedText: {
    color: '#ccc',
  },
  editHint: {
    fontSize: 11,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 4,
  },
  activityActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyDayContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 6,
    marginBottom: 2,
  },
  starButton: {
    marginRight: 4,
  },
  star: {
    fontSize: 16,
    color: '#666',
  },
  starFilled: {
    color: '#FFD700',
  },
  // New styles for ActivityEditForm
  activityEditForm: {
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center' as const,
  },
  timeInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  timeInputLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginRight: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginRight: 10,
    width: 60,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  typeSelection: {
    flexDirection: 'row' as const,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center' as const,
  },
  typeOptionSelected: {
    backgroundColor: '#6366f1',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  typeOptionTextSelected: {
    color: '#ffffff',
  },
  alternativesSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  alternativesSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  alternativeItem: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  alternativeItemSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  alternativePrice: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  alternativeDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  editFormActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center' as const,
    flex: 1,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#E1301F',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};
