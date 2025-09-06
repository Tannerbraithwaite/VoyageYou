import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TripDates {
  startDate: Date | null;
  endDate: Date | null;
  isFlexible: boolean;
}

interface DatePickerProps {
  tripDates: TripDates;
  onDatesChange: (dates: TripDates) => void;
}

export default function DatePicker({ tripDates, onDatesChange }: DatePickerProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() + 2); // Allow booking up to 2 years in advance

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDateChange = (selectedDate: Date) => {
    if (pickerMode === 'start') {
      // If end date is before new start date, clear end date
      if (tripDates.endDate && selectedDate > tripDates.endDate) {
        onDatesChange({
          ...tripDates,
          startDate: selectedDate,
          endDate: null,
        });
      } else {
        onDatesChange({
          ...tripDates,
          startDate: selectedDate,
        });
      }
    } else {
      // Ensure end date is after start date
      if (tripDates.startDate && selectedDate < tripDates.startDate) {
        Alert.alert('Invalid Date', 'End date must be after start date');
        return;
      }
      onDatesChange({
        ...tripDates,
        endDate: selectedDate,
      });
    }
  };

  const showDatePicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    if (mode === 'start') {
      setShowStartPicker(true);
    } else {
      setShowEndPicker(true);
    }
  };

  const getDateDisplayText = (date: Date | null, label: string): string => {
    if (!date) return `Select ${label}`;
    return `${label}: ${formatDate(date)}`;
  };

  const clearDates = () => {
    onDatesChange({ startDate: null, endDate: null, isFlexible: false });
  };

  const toggleFlexible = () => {
    onDatesChange({
      ...tripDates,
      isFlexible: !tripDates.isFlexible,
    });
  };

  const generateDateOptions = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const getMonthOptions = (): { year: number; month: number; label: string }[] => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      options.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
    }
    
    return options;
  };

  const getDayOptions = (year: number, month: number): number[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const CustomDatePicker = ({ visible, onClose, onSelect, isEndDate = false }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    isEndDate?: boolean;
  }) => {
    // Initialize with start date if selecting end date, otherwise today
    const initialDate = isEndDate && tripDates.startDate ? tripDates.startDate : new Date();
    
    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
    const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

    const monthOptions = getMonthOptions();
    const dayOptions = getDayOptions(selectedYear, selectedMonth);

    // Filter month options for end date to only show months after start date
    const filteredMonthOptions = isEndDate && tripDates.startDate 
      ? monthOptions.filter(option => {
          const optionDate = new Date(option.year, option.month, 1);
          const startDate = new Date(tripDates.startDate!.getFullYear(), tripDates.startDate!.getMonth(), 1);
          return optionDate >= startDate;
        })
      : monthOptions;

    const handleConfirm = () => {
      const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
      
      // Validation for start date
      if (!isEndDate && selectedDate < today) {
        Alert.alert('Invalid Date', 'Please select a future date');
        return;
      }
      
      // Validation for end date
      if (isEndDate && tripDates.startDate && selectedDate <= tripDates.startDate) {
        Alert.alert('Invalid Date', 'End date must be after start date');
        return;
      }
      
      onSelect(selectedDate);
      onClose();
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Select {pickerMode === 'start' ? 'Start' : 'End'} Date
              </Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.pickerContainer}>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Month & Year</Text>
                                 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                   <View style={styles.monthContainer}>
                     {filteredMonthOptions.map((option, index) => (
                       <TouchableOpacity
                         key={index}
                         style={[
                           styles.monthOption,
                           selectedYear === option.year && selectedMonth === option.month && styles.selectedOption
                         ]}
                         onPress={() => {
                           setSelectedYear(option.year);
                           setSelectedMonth(option.month);
                         }}
                       >
                         <Text style={[
                           styles.monthOptionText,
                           selectedYear === option.year && selectedMonth === option.month && styles.selectedOptionText
                         ]}>
                           {option.label}
                         </Text>
                       </TouchableOpacity>
                     ))}
                   </View>
                 </ScrollView>
              </View>

                             <View style={styles.pickerSection}>
                 <Text style={styles.pickerLabel}>Day</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                   <View style={styles.dayContainer}>
                     {dayOptions.map((day) => {
                       const currentDate = new Date(selectedYear, selectedMonth, day);
                       const isDisabled = isEndDate && tripDates.startDate && currentDate <= tripDates.startDate;
                       
                       return (
                         <TouchableOpacity
                           key={day}
                           style={[
                             styles.dayOption,
                             selectedDay === day && styles.selectedOption,
                             isDisabled && styles.disabledOption
                           ]}
                           onPress={() => !isDisabled && setSelectedDay(day)}
                           disabled={isDisabled}
                         >
                           <Text style={[
                             styles.dayOptionText,
                             selectedDay === day && styles.selectedOptionText,
                             isDisabled && styles.disabledOptionText
                           ]}>
                             {day}
                           </Text>
                         </TouchableOpacity>
                       );
                     })}
                   </View>
                 </ScrollView>
               </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip Dates</Text>
        <TouchableOpacity onPress={clearDates} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={[styles.dateButton, tripDates.startDate && styles.dateButtonSelected]}
          onPress={() => showDatePicker('start')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={tripDates.startDate ? '#6366f1' : '#666'}
          />
          <Text style={[styles.dateText, tripDates.startDate && styles.dateTextSelected]}>
            {getDateDisplayText(tripDates.startDate, 'Start')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={tripDates.startDate ? '#6366f1' : '#666'}
          />
        </TouchableOpacity>

        <View style={styles.dateDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>to</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[
            styles.dateButton,
            tripDates.endDate && styles.dateButtonSelected,
            !tripDates.startDate && styles.dateButtonDisabled,
          ]}
          onPress={() => showDatePicker('end')}
          disabled={!tripDates.startDate}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={
              tripDates.endDate
                ? '#6366f1'
                : !tripDates.startDate
                ? '#444'
                : '#666'
            }
          />
          <Text
            style={[
              styles.dateText,
              tripDates.endDate && styles.dateTextSelected,
              !tripDates.startDate && styles.dateTextDisabled,
            ]}
          >
            {getDateDisplayText(tripDates.endDate, 'End')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={
              tripDates.endDate
                ? '#6366f1'
                : !tripDates.startDate
                ? '#444'
                : '#666'
            }
          />
        </TouchableOpacity>
      </View>

      {/* Flexible Option */}
      <TouchableOpacity
        style={[styles.flexibleButton, tripDates.isFlexible && styles.flexibleButtonSelected]}
        onPress={toggleFlexible}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={tripDates.isFlexible ? '#6366f1' : '#666'}
        />
        <Text style={[styles.flexibleText, tripDates.isFlexible && styles.flexibleTextSelected]}>
          Flexible with dates
        </Text>
        <View style={[styles.checkbox, tripDates.isFlexible && styles.checkboxSelected]}>
          {tripDates.isFlexible && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>

      {tripDates.startDate && tripDates.endDate && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            Duration: {Math.ceil((tripDates.endDate.getTime() - tripDates.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            {tripDates.isFlexible && ' (flexible)'}
          </Text>
        </View>
      )}

      <CustomDatePicker
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onSelect={handleDateChange}
        isEndDate={false}
      />

      <CustomDatePicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onSelect={handleDateChange}
        isEndDate={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  clearButtonText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  dateButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#0f0f23',
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  dateTextDisabled: {
    color: '#444',
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  flexibleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 12,
    gap: 12,
  },
  flexibleButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#0f0f23',
  },
  flexibleText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  flexibleTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  durationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  durationText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    padding: 20,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  monthContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  monthOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedOption: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  monthOptionText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  dayContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOptionText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledOption: {
    opacity: 0.3,
    backgroundColor: '#333',
  },
  disabledOptionText: {
    color: '#666',
  },
}); 