import React from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import GlassCard from './ui/GlassCard';

interface Activity {
  time: string;
  name: string;
  price: number;
  type: 'bookable' | 'estimated' | 'transport';
  description?: string;
  transport_details?: {
    type: 'flight' | 'train' | 'bus';
    carrier: string;
    departure: string;
    time: string;
  };
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
  alternativeActivities: Record<string, AlternativeActivity[]>;
  onActivityEditSave: (dayIndex: number, activityIndex: number, updatedActivity: Activity) => void;
  onActivityEditCancel: () => void;
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
  onActivityEditCancel
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
            value={editedActivity.name}
            onChangeText={(text) => setEditedActivity(prev => ({ ...prev, name: text }))}
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
                            <Text style={styles.activityText}>{activity.name}</Text>
                            <View style={styles.activityDetails}>
                              {activity.price > 0 && (
                                <Text style={styles.priceText}>${activity.price}</Text>
                              )}
                              <View style={[
                                styles.typeBadge,
                                activity.type === 'bookable' ? styles.bookableBadge : 
                                activity.type === 'transport' ? styles.transportBadge : styles.estimatedBadge
                              ]}>
                                <Text style={[
                                  styles.typeText,
                                  activity.type === 'bookable' ? styles.bookableText : 
                                  activity.type === 'transport' ? styles.transportText : styles.estimatedText
                                ]}>
                                  {activity.type === 'bookable' ? 'Bookable' : 
                                   activity.type === 'transport' ? 'Transport' : 'Estimated'}
                                </Text>
                              </View>
                            </View>
                            
                            {/* Show transport details for transport activities */}
                            {activity.type === 'transport' && activity.transport_details && (
                              <View style={styles.transportDetails}>
                                <Text style={styles.transportInfo}>
                                  {activity.transport_details.carrier} • {activity.transport_details.departure}
                                </Text>
                                <Text style={styles.transportTime}>{activity.transport_details.time}</Text>
                              </View>
                            )}
                            
                            {/* Show alternatives if available */}
                            {(() => {
                              // Get alternatives for this specific activity
                              const specificAlternatives = alternativeActivities[activity.name] || [];
                              
                              // Get alternatives from other activities that could be good substitutes
                              const allAlternatives = Object.values(alternativeActivities).flat();
                              const relevantAlternatives = allAlternatives.filter(alt => 
                                alt.name !== activity.name && // Don't show the current activity as an alternative
                                !schedule.some(day => 
                                  day.activities.some(act => act.name === alt.name) // Don't show already scheduled activities
                                )
                              );
                              
                              // Combine specific alternatives with relevant ones, prioritizing specific ones
                              const combinedAlternatives = [...specificAlternatives, ...relevantAlternatives.slice(0, 3)];
                              
                              console.log('🔍 Checking alternatives for activity:', {
                                activity: activity,
                                activityName: activity.name,
                                specificAlternatives: specificAlternatives.length,
                                relevantAlternatives: relevantAlternatives.length,
                                combinedAlternatives: combinedAlternatives.length,
                                alternativeActivities: alternativeActivities
                              });
                              
                              return combinedAlternatives.length > 0 ? (
                                <View style={styles.alternativesPreview}>
                                  <Text style={styles.alternativesPreviewTitle}>💡 Alternatives available</Text>
                                  <View style={styles.alternativesPreviewList}>
                                    {combinedAlternatives.slice(0, 2).map((alternative, altIndex) => (
                                      <TouchableOpacity
                                        key={altIndex}
                                        style={styles.alternativePreviewItem}
                                        onPress={() => {
                                          console.log('🔄 Replacing activity with alternative:', {
                                            original: activity,
                                            alternative: alternative,
                                            dayIndex,
                                            activityIndex
                                          });
                                          
                                          // Directly replace the activity with the alternative
                                          const updatedActivity = {
                                            time: activity.time,
                                            name: alternative.name,
                                            price: alternative.price,
                                            type: alternative.type as 'bookable' | 'estimated',
                                            description: alternative.description || ''
                                          };
                                          
                                          console.log('🔄 Updated activity to save:', updatedActivity);
                                          onActivityEditSave(dayIndex, activityIndex, updatedActivity);
                                        }}
                                      >
                                        <Text style={styles.alternativePreviewName}>{alternative.name}</Text>
                                        <Text style={styles.alternativePreviewPrice}>${alternative.price}</Text>
                                      </TouchableOpacity>
                                    ))}
                                    {combinedAlternatives.length > 2 && (
                                      <Text style={styles.alternativesPreviewMore}>
                                        +{combinedAlternatives.length - 2} more
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              ) : null;
                            })()}
                            
                            <Text style={styles.editHint}>Tap to edit</Text>
                          </TouchableOpacity>
                          
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
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 15,
  },
  scheduleHelpText: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center' as const,
  },
  dayContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  dayHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  dayDate: {
    fontSize: 14,
    color: '#cccccc',
  },
  scheduledActivityContainer: {
    marginBottom: 15,
  },
  activityTimeHeader: {
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  activityCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  activityContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  activityClickable: {
    flex: 1,
    padding: 15,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  activityDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  bookableBadge: {
    backgroundColor: '#10b981',
  },
  estimatedBadge: {
    backgroundColor: '#475569',
  },
  transportBadge: {
    backgroundColor: '#FF9800',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  bookableText: {
    color: '#ffffff',
  },
  estimatedText: {
    color: '#ffffff',
  },
  transportText: {
    color: '#ffffff',
  },
  transportDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  transportInfo: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  transportTime: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  editHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic' as const,
  },
  activityActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyDayContainer: {
    alignItems: 'center' as const,
    padding: 20,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptyDaySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
  },
  addActivityButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 15,
  },
  addActivityButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#6366f1',
  },
  editFormContainer: {
    padding: 15,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#333',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  alternativesSection: {
    marginTop: 15,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 10,
  },
  alternativesSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  alternativeItem: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alternativeItemSelected: {
    backgroundColor: '#6366f1',
  },
  alternativeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 5,
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  alternativePrice: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  alternativeDescription: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 8,
  },
  editFormActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  activityEditForm: {
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
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
  typeSelection: {
    flexDirection: 'row' as const,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
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
  alternativesPreview: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  alternativesPreviewTitle: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  alternativesPreviewList: {
    gap: 8,
  },
  alternativePreviewItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  alternativePreviewName: {
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
  alternativePreviewPrice: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  alternativesPreviewMore: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center' as const,
    marginTop: 4,
  },
};
