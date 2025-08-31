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
  formatPrice: (price: number) => string;
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
  formatPrice
}) => {
  const [expandedAlternatives, setExpandedAlternatives] = React.useState<Record<string, boolean>>({});
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
    const [customTime, setCustomTime] = React.useState(activity.time);

    const handleSave = () => {
      console.log('🔄 ActivityEditForm: Saving activity...');
      console.log('   Original activity:', activity);
      console.log('   Custom time:', customTime);
      
      // Only update the time, keep everything else the same
      const finalActivity = { ...activity, time: customTime };
      
      console.log('   Final activity to save:', finalActivity);
      console.log('   Calling onSave with dayIndex:', dayIndex, 'activityIndex:', activityIndex);
      
      onSave(dayIndex, activityIndex, finalActivity);
    };

    return (
      <View style={styles.activityEditForm}>
        <Text style={styles.editFormTitle}>Edit Activity Time</Text>
        
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

        {/* Activity Details (Read-only) */}
        <View style={styles.readOnlySection}>
          <Text style={styles.sectionLabel}>Activity Details</Text>
          
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Name:</Text>
            <Text style={styles.readOnlyValue}>{activity.name}</Text>
          </View>
          
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Price:</Text>
            <Text style={styles.readOnlyValue}>{formatPrice(activity.price)}</Text>
          </View>
          
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Type:</Text>
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
          
          {activity.description && (
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Description:</Text>
              <Text style={styles.readOnlyValue}>{activity.description}</Text>
            </View>
          )}
        </View>

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
                          alternatives={[]}
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
                                                          <View style={styles.activityHeader}>
                                <Text style={styles.activityText}>{activity.name}</Text>
                              </View>
                            {activity.description && (
                              <Text style={styles.activityDescription}>{activity.description}</Text>
                            )}
                            <View style={styles.activityDetails}>
                                                          {activity.price > 0 && (
                              <Text style={styles.priceText}>{formatPrice(activity.price)}</Text>
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
                              // Get alternatives for this specific activity (excluding bookable ones)
                              const specificAlternatives = (alternativeActivities[activity.name] || []).filter(
                                (alt: AlternativeActivity) => alt.type !== 'bookable'
                              );
                              
                              // Get alternatives from other activities that could be good substitutes
                              const allAlternatives = Object.values(alternativeActivities).flat();
                              const relevantAlternatives = allAlternatives.filter((alt: AlternativeActivity) => 
                                alt.name !== activity.name && // Don't show the current activity as an alternative
                                alt.type !== 'bookable' && // Don't show bookable activities in regular alternatives
                                !schedule.some(day => 
                                  day.activities.some(act => act.name === alt.name) // Don't show already scheduled activities
                                )
                              );
                              
                              // Combine specific alternatives with relevant ones, prioritizing specific ones
                              const combinedAlternatives = [...specificAlternatives, ...relevantAlternatives.slice(0, 3)];
                              
                              // Separate bookable alternatives for dedicated section
                              const bookableAlternatives = allAlternatives.filter((alt: AlternativeActivity) =>
                                alt.type === 'bookable' &&
                                alt.name !== activity.name &&
                                !schedule.some(day =>
                                  day.activities.some(act => act.name === alt.name)
                                )
                              );
                              
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
                                    {combinedAlternatives.slice(0, expandedAlternatives[`${dayIndex}-${activityIndex}`] ? combinedAlternatives.length : 2).map((alternative, altIndex) => (
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
                                        <View style={styles.alternativePreviewHeader}>
                                          <Text style={styles.alternativePreviewName}>{alternative.name}</Text>
                                          <Text style={styles.alternativePreviewPrice}>${alternative.price}</Text>
                                        </View>
                                        {alternative.description && (
                                          <Text style={styles.alternativePreviewDescription}>{alternative.description}</Text>
                                        )}
                                      </TouchableOpacity>
                                    ))}
                                    
                                    {combinedAlternatives.length > 2 && (
                                      <TouchableOpacity
                                        style={styles.alternativesPreviewMoreButton}
                                        onPress={() => {
                                          const key = `${dayIndex}-${activityIndex}`;
                                          setExpandedAlternatives(prev => ({
                                            ...prev,
                                            [key]: !prev[key]
                                          }));
                                        }}
                                      >
                                        <Text style={styles.alternativesPreviewMore}>
                                          {expandedAlternatives[`${dayIndex}-${activityIndex}`] ? 'Show Less' : `+${combinedAlternatives.length - 2} more`}
                                        </Text>
                                      </TouchableOpacity>
                                    )}
                                
                                {/* Bookable Activities Section */}
                                {bookableAlternatives.length > 0 && (
                                  <View style={styles.bookableSection}>
                                    <Text style={styles.bookableSectionTitle}>🎫 Bookable Activities Available</Text>
                                    <Text style={styles.bookableSectionSubtitle}>
                                      These are real bookable experiences you can reserve
                                    </Text>
                                    <View style={styles.bookableAlternativesList}>
                                      {bookableAlternatives.map((bookable: AlternativeActivity, bookableIndex) => (
                                        <TouchableOpacity
                                          key={bookableIndex}
                                          style={styles.bookableAlternativeItem}
                                          onPress={() => {
                                            console.log('🎫 Adding bookable activity:', bookable);
                                            
                                            // Add the bookable activity to the schedule
                                            const newActivity = {
                                              time: activity.time,
                                              name: bookable.name,
                                              price: bookable.price,
                                              type: 'bookable' as const,
                                              description: bookable.description || ''
                                            };
                                            
                                            onActivityEditSave(dayIndex, activityIndex, newActivity);
                                          }}
                                        >
                                          <View style={styles.bookableAlternativeHeader}>
                                            <Text style={styles.bookableAlternativeName}>{bookable.name}</Text>
                                            <View style={styles.bookableBadge}>
                                              <Text style={styles.bookableBadgeText}>🎫</Text>
                                            </View>
                                          </View>
                                          {bookable.description && (
                                            <Text style={styles.bookableAlternativeDescription}>{bookable.description}</Text>
                                          )}
                                          <Text style={styles.bookableAlternativePrice}>${bookable.price}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  </View>
                                )}
                                  </View>
                                </View>
                              ) : null;
                            })()}
                            
                            <Text style={styles.editHint}>Tap to edit</Text>
                          </TouchableOpacity>
                          
                          <View style={styles.activityActions}>
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
        <Text style={styles.totalAmount}>{formatPrice(totalActivities)}</Text>
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
    overflow: 'hidden' as const,
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
  activityHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  bookableSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bookableSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
    marginBottom: 4,
  },
  bookableSectionSubtitle: {
    fontSize: 11,
    color: '#999',
    marginBottom: 10,
    fontStyle: 'italic' as const,
  },
  bookableAlternativesList: {
    gap: 8,
  },
  bookableAlternativeItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  bookableAlternativeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  bookableAlternativeName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffff',
    flex: 1,
  },
  bookableBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookableBadgeText: {
    fontSize: 10,
    color: '#ffffff',
  },

  bookableAlternativeDescription: {
    fontSize: 11,
    color: '#ccc',
    marginBottom: 6,
    lineHeight: 14,
  },
  bookableAlternativePrice: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
    textAlign: 'right' as const,
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
  alternativePreviewDescription: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic' as const,
    marginTop: 2,
    lineHeight: 12,
  },
  alternativePreviewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  alternativesPreviewMore: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center' as const,
    marginTop: 4,
  },
  alternativesPreviewMoreButton: {
    padding: 4,
    borderRadius: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#cccccc',
    fontStyle: 'italic' as const,
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 16,
  },
  readOnlySection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  readOnlyRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 5,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: '#999',
  },
  readOnlyValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
};
