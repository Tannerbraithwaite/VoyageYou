import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { EnhancedItinerary } from '@/types';
import { 
  validateEmail, 
  validatePhone, 
  validateName, 
  validateCreditCard, 
  validateExpiryDate, 
  validateCVV, 
  validatePassportNumber, 
  validateDate,
  formatCreditCard,
  formatExpiryDate,
  ValidationResult 
} from '@/utils';

interface TravelerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
}

interface FlightInfo {
  seatClass: string;
  seatNumber: string;
  mealPreference: string;
  specialAssistance: string;
}

interface HotelInfo {
  roomType: string;
  roomNumber: string;
  breakfastIncluded: boolean;
  lateCheckout: boolean;
  specialRequests: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<EnhancedItinerary | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [enabledSteps, setEnabledSteps] = useState<{ flights: boolean; hotel: boolean; activities: boolean }>({
    flights: true,
    hotel: true,
    activities: true,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [showSeatClassPicker, setShowSeatClassPicker] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showRoomTypePicker, setShowRoomTypePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  const [currentTravelerIndex, setCurrentTravelerIndex] = useState(0);
  const [tempDateInput, setTempDateInput] = useState('');
  const [travelers, setTravelers] = useState<TravelerInfo[]>([
    {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: ''
    }
  ]);
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({
    seatClass: '',
    seatNumber: '',
    mealPreference: '',
    specialAssistance: ''
  });
  const [hotelInfo, setHotelInfo] = useState<HotelInfo>({
    roomType: '',
    roomNumber: '',
    breakfastIncluded: false,
    lateCheckout: false,
    specialRequests: ''
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: ''
  });
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    emergencyContact: ''
  });
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});

  useEffect(() => {
    // Load itinerary data from session storage
    if (typeof window !== 'undefined') {
      const storedItinerary = sessionStorage.getItem('currentItinerary');
      const storedOptions = sessionStorage.getItem('purchaseOptions');
      if (storedItinerary) {
        try {
          const itineraryData = JSON.parse(storedItinerary);
          setItinerary(itineraryData);
          // Determine enabled steps based on itinerary availability and user options
          const hasFlights = Array.isArray(itineraryData.flights) && itineraryData.flights.length > 0;
          const hasHotel = !!itineraryData.hotel;
          const hasActivities = Array.isArray(itineraryData.schedule) && itineraryData.schedule.some((d: any) => (d.activities || []).length > 0);
          let include = { flights: true, hotel: true, activities: true };
          if (storedOptions) {
            try {
              const parsed = JSON.parse(storedOptions);
              include = {
                flights: (parsed.flights ?? parsed.includeFlights) ?? true,
                hotel: (parsed.hotel ?? parsed.includeHotel) ?? true,
                activities: (parsed.activities ?? parsed.includeActivities) ?? true,
              };
            } catch {}
          }
          setEnabledSteps({
            flights: include.flights && hasFlights,
            hotel: include.hotel && hasHotel,
            activities: include.activities && hasActivities,
          });
        } catch (error) {
          console.error('Error parsing itinerary:', error);
        }
      }
    }
  }, []);

  const addTraveler = () => {
    setTravelers([...travelers, {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: ''
    }]);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  };

  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
    const updatedTravelers = [...travelers];
    updatedTravelers[index] = { ...updatedTravelers[index], [field]: value };
    setTravelers(updatedTravelers);
  };

  const updatePaymentInfo = (field: keyof PaymentInfo, value: string) => {
    let formattedValue = value;
    
    // Format and validate input
    if (field === 'cardNumber') {
      formattedValue = formatCreditCard(value);
      const validation = validateCreditCard(formattedValue);
      setValidationErrors(prev => ({
        ...prev,
        cardNumber: validation.isValid ? [] : validation.errors
      }));
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
      const validation = validateExpiryDate(formattedValue);
      setValidationErrors(prev => ({
        ...prev,
        expiryDate: validation.isValid ? [] : validation.errors
      }));
    } else if (field === 'cvv') {
      const validation = validateCVV(value);
      setValidationErrors(prev => ({
        ...prev,
        cvv: validation.isValid ? [] : validation.errors
      }));
    } else if (field === 'cardholderName') {
      const validation = validateName(value);
      setValidationErrors(prev => ({
        ...prev,
        cardholderName: validation.isValid ? [] : validation.errors
      }));
    }
    
    setPaymentInfo({ ...paymentInfo, [field]: formattedValue });
  };

  const updateContactInfo = (field: string, value: string) => {
    // Validate contact info
    if (field === 'email') {
      const validation = validateEmail(value);
      setValidationErrors(prev => ({
        ...prev,
        email: validation.isValid ? [] : validation.errors
      }));
    } else if (field === 'phone') {
      const validation = validatePhone(value);
      setValidationErrors(prev => ({
        ...prev,
        phone: validation.isValid ? [] : validation.errors
      }));
    }
    
    setContactInfo({ ...contactInfo, [field]: value });
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1: // Contact Info
        return contactInfo.email && contactInfo.phone;
      case 2: // Traveler Info
        return travelers.every(t => 
          t.firstName && t.lastName && t.dateOfBirth && 
          t.passportNumber && t.passportExpiry && t.nationality
        );
      case 3: // Flight Info
        return enabledSteps.flights ? (flightInfo.seatClass && flightInfo.mealPreference) : true;
      case 4: // Hotel Info
        return enabledSteps.hotel ? !!hotelInfo.roomType : true;
      case 5: // Payment Info
        return paymentInfo.cardNumber && paymentInfo.cardholderName && 
               paymentInfo.expiryDate && paymentInfo.cvv && paymentInfo.billingAddress;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(activeStep)) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before continuing.');
      return;
    }
    // Determine the next enabled step
    let next = activeStep + 1;
    while (next <= 6) {
      const isEnabled = (next === 3 && enabledSteps.flights) || (next === 4 && enabledSteps.hotel) || next === 1 || next === 2 || next === 5 || next === 6;
      if (isEnabled) break;
      next += 1;
    }
    setActiveStep(Math.min(next, 6));
  };

  const prevStep = () => {
    let prev = activeStep - 1;
    while (prev >= 1) {
      const isEnabled = (prev === 3 && enabledSteps.flights) || (prev === 4 && enabledSteps.hotel) || prev === 1 || prev === 2 || prev === 5 || prev === 6;
      if (isEnabled) break;
      prev -= 1;
    }
    setActiveStep(Math.max(prev, 1));
  };

  const handleSubmit = () => {
    if (validateStep(activeStep)) {
      // Mark the trip as booked in localStorage
      if (typeof window !== 'undefined') {
        try {
          const storedItinerary = sessionStorage.getItem('currentItinerary');
          if (storedItinerary) {
            const itineraryData = JSON.parse(storedItinerary);
            
            // Find the saved schedule and update its status
            const existingSchedules = JSON.parse(localStorage.getItem('savedSchedules') || '[]');
            const updatedSchedules = existingSchedules.map((schedule: any) => {
              // Match by destination and duration to find the right schedule
              if (schedule.destination === itineraryData.destination && 
                  schedule.duration === itineraryData.duration) {
                return {
                  ...schedule,
                  status: 'booked',
                  checkoutDate: new Date().toISOString()
                };
              }
              return schedule;
            });
            
            localStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
            console.log('✅ Trip marked as booked:', itineraryData.destination);
          }
        } catch (error) {
          console.error('Error updating trip status:', error);
        }
      }

      Alert.alert(
        'Booking Confirmed!',
        'Your trip has been successfully booked. You will receive a confirmation email shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear session storage and navigate to home
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('currentItinerary');
              }
              router.push('/(tabs)/');
            }
          }
        ]
      );
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (match) {
      const parts = [match[1], match[2], match[3], match[4]].filter(Boolean);
      return parts.join(' ');
    }
    return text;
  };

  const nationalityOptions = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
    'Australia', 'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'India'
  ];

  const seatClassOptions = ['Economy', 'Premium Economy', 'Business Class', 'First Class'];
  const mealOptions = ['Standard', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free'];
  const roomTypeOptions = ['Standard Room', 'Deluxe Room', 'Suite', 'Executive Suite', 'Presidential Suite'];

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleDateSelect = (date: string) => {
    const updatedTravelers = [...travelers];
    updatedTravelers[currentTravelerIndex] = {
      ...updatedTravelers[currentTravelerIndex],
      [currentDateField]: date
    };
    setTravelers(updatedTravelers);
    setShowDatePicker(false);
    setTempDateInput('');
  };

  const confirmDateInput = () => {
    if (tempDateInput.trim()) {
      handleDateSelect(tempDateInput);
    }
  };

  const openDatePicker = (field: string, travelerIndex: number) => {
    setCurrentDateField(field);
    setCurrentTravelerIndex(travelerIndex);
    setTempDateInput('');
    setShowDatePicker(true);
  };

  const handleNationalitySelect = (nationality: string) => {
    const updatedTravelers = [...travelers];
    updatedTravelers[currentTravelerIndex] = {
      ...updatedTravelers[currentTravelerIndex],
      nationality
    };
    setTravelers(updatedTravelers);
    setShowNationalityPicker(false);
  };



  const openNationalityPicker = (travelerIndex: number) => {
    setCurrentTravelerIndex(travelerIndex);
    setShowNationalityPicker(true);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            step <= activeStep ? styles.activeStep : styles.inactiveStep,
            (step === 3 && !enabledSteps.flights) && styles.disabledStep,
            (step === 4 && !enabledSteps.hotel) && styles.disabledStep
          ]}>
            <Text style={[
              styles.stepNumber,
              step <= activeStep ? styles.activeStepText : styles.inactiveStepText,
              (step === 3 && !enabledSteps.flights) && styles.disabledStepText,
              (step === 4 && !enabledSteps.hotel) && styles.disabledStepText
            ]}>
              {step}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            step <= activeStep ? styles.activeStepText : styles.inactiveStepText,
            (step === 3 && !enabledSteps.flights) && styles.disabledStepText,
            (step === 4 && !enabledSteps.hotel) && styles.disabledStepText
          ]}>
            {step === 1 ? 'Contact' : step === 2 ? 'Travelers' : step === 3 ? 'Flights' : step === 4 ? 'Hotels' : step === 5 ? 'Payment' : 'Confirm'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>
      <TextInput
        style={[
          styles.input,
          validationErrors.email?.length > 0 && styles.inputError,
          contactInfo.email.length > 0 && validationErrors.email?.length === 0 && styles.inputSuccess
        ]}
        placeholder="Email Address"
        placeholderTextColor="#666"
        value={contactInfo.email}
        onChangeText={(text) => updateContactInfo('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {validationErrors.email?.map((error, index) => (
        <Text key={index} style={styles.errorText}>{error}</Text>
      ))}
      
      <TextInput
        style={[
          styles.input,
          validationErrors.phone?.length > 0 && styles.inputError,
          contactInfo.phone.length > 0 && validationErrors.phone?.length === 0 && styles.inputSuccess
        ]}
        placeholder="Phone Number"
        placeholderTextColor="#666"
        value={contactInfo.phone}
        onChangeText={(text) => updateContactInfo('phone', text)}
        keyboardType="phone-pad"
      />
      {validationErrors.phone?.map((error, index) => (
        <Text key={index} style={styles.errorText}>{error}</Text>
      ))}
      <TextInput
        style={styles.input}
        placeholder="Emergency Contact"
        placeholderTextColor="#666"
        value={contactInfo.emergencyContact}
        onChangeText={(text) => updateContactInfo('emergencyContact', text)}
      />
    </View>
  );

  const renderTravelerInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Traveler Information</Text>
        <TouchableOpacity style={styles.addButton} onPress={addTraveler}>
          <Text style={styles.addButtonText}>+ Add Traveler</Text>
        </TouchableOpacity>
      </View>
      
      {travelers.map((traveler, index) => (
        <View key={index} style={styles.travelerCard}>
          <View style={styles.travelerHeader}>
            <Text style={styles.travelerTitle}>Traveler {index + 1}</Text>
            {travelers.length > 1 && (
              <TouchableOpacity onPress={() => removeTraveler(index)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={traveler.firstName}
              onChangeText={(text) => updateTraveler(index, 'firstName', text)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              placeholderTextColor="#666"
              value={traveler.lastName}
              onChangeText={(text) => updateTraveler(index, 'lastName', text)}
            />
          </View>
          
          <TouchableOpacity
            style={styles.input}
            onPress={() => openDatePicker('dateOfBirth', index)}
          >
            <Text style={traveler.dateOfBirth ? styles.inputText : styles.placeholderText}>
              {traveler.dateOfBirth || 'Date of Birth (MM/DD/YYYY)'}
            </Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Passport Number"
            placeholderTextColor="#666"
            value={traveler.passportNumber}
            onChangeText={(text) => updateTraveler(index, 'passportNumber', text)}
            autoCapitalize="characters"
          />
          
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => openDatePicker('passportExpiry', index)}
            >
              <Text style={traveler.passportExpiry ? styles.inputText : styles.placeholderText}>
                {traveler.passportExpiry || 'Passport Expiry'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => openNationalityPicker(index)}
            >
              <Text style={traveler.nationality ? styles.inputText : styles.placeholderText}>
                {traveler.nationality || 'Nationality'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFlightInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Flight Preferences</Text>
      
      <View style={styles.flightCard}>
        <Text style={styles.flightTitle}>Flight Preferences</Text>
        
        <View style={styles.row}>
          <Text style={styles.flightLabel}>Seat Class:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowSeatClassPicker(true)}
          >
            <Text style={flightInfo.seatClass ? styles.dropdownText : styles.placeholderText}>
              {flightInfo.seatClass || 'Select Seat Class'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Preferred Seat Number (e.g., 12A)"
          placeholderTextColor="#666"
          value={flightInfo.seatNumber}
          onChangeText={(text) => setFlightInfo({...flightInfo, seatNumber: text})}
        />
        
        <View style={styles.row}>
          <Text style={styles.flightLabel}>Meal Preference:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowMealPicker(true)}
          >
            <Text style={flightInfo.mealPreference ? styles.dropdownText : styles.placeholderText}>
              {flightInfo.mealPreference || 'Select Meal'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Special Assistance Requirements (optional)"
          placeholderTextColor="#666"
          value={flightInfo.specialAssistance}
          onChangeText={(text) => setFlightInfo({...flightInfo, specialAssistance: text})}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderHotelInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hotel Preferences</Text>
      
      <View style={styles.hotelCard}>
        <Text style={styles.hotelTitle}>Hotel Preferences</Text>
        
        <View style={styles.row}>
          <Text style={styles.hotelLabel}>Room Type:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowRoomTypePicker(true)}
          >
            <Text style={hotelInfo.roomType ? styles.dropdownText : styles.placeholderText}>
              {hotelInfo.roomType || 'Select Room Type'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Preferred Room Number (optional)"
          placeholderTextColor="#666"
          value={hotelInfo.roomNumber}
          onChangeText={(text) => setHotelInfo({...hotelInfo, roomNumber: text})}
        />
        
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, hotelInfo.breakfastIncluded && styles.checkboxChecked]}
            onPress={() => setHotelInfo({...hotelInfo, breakfastIncluded: !hotelInfo.breakfastIncluded})}
          >
            {hotelInfo.breakfastIncluded && <Text style={styles.checkboxText}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Breakfast Included</Text>
        </View>
        
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, hotelInfo.lateCheckout && styles.checkboxChecked]}
            onPress={() => setHotelInfo({...hotelInfo, lateCheckout: !hotelInfo.lateCheckout})}
          >
            {hotelInfo.lateCheckout && <Text style={styles.checkboxText}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Late Checkout (2 PM)</Text>
        </View>
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Special Requests (optional)"
          placeholderTextColor="#666"
          value={hotelInfo.specialRequests}
          onChangeText={(text) => setHotelInfo({...hotelInfo, specialRequests: text})}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderPaymentInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Information</Text>
      
      <TextInput
        style={[
          styles.input,
          validationErrors.cardNumber?.length > 0 && styles.inputError,
          paymentInfo.cardNumber.length > 0 && validationErrors.cardNumber?.length === 0 && styles.inputSuccess
        ]}
        placeholder="Card Number"
        placeholderTextColor="#666"
        value={paymentInfo.cardNumber}
        onChangeText={(text) => updatePaymentInfo('cardNumber', text)}
        keyboardType="numeric"
        maxLength={19}
      />
      {validationErrors.cardNumber?.map((error, index) => (
        <Text key={index} style={styles.errorText}>{error}</Text>
      ))}
      
      <TextInput
        style={[
          styles.input,
          validationErrors.cardholderName?.length > 0 && styles.inputError,
          paymentInfo.cardholderName.length > 0 && validationErrors.cardholderName?.length === 0 && styles.inputSuccess
        ]}
        placeholder="Cardholder Name"
        placeholderTextColor="#666"
        value={paymentInfo.cardholderName}
        onChangeText={(text) => updatePaymentInfo('cardholderName', text)}
        autoCapitalize="words"
      />
      {validationErrors.cardholderName?.map((error, index) => (
        <Text key={index} style={styles.errorText}>{error}</Text>
      ))}
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <TextInput
            style={[
              styles.input,
              validationErrors.expiryDate?.length > 0 && styles.inputError,
              paymentInfo.expiryDate.length > 0 && validationErrors.expiryDate?.length === 0 && styles.inputSuccess
            ]}
            placeholder="Expiry Date (MM/YY)"
            placeholderTextColor="#666"
            value={paymentInfo.expiryDate}
            onChangeText={(text) => updatePaymentInfo('expiryDate', text)}
            keyboardType="numeric"
            maxLength={5}
          />
          {validationErrors.expiryDate?.map((error, index) => (
            <Text key={index} style={styles.errorText}>{error}</Text>
          ))}
        </View>
        
        <View style={styles.halfInput}>
          <TextInput
            style={[
              styles.input,
              validationErrors.cvv?.length > 0 && styles.inputError,
              paymentInfo.cvv.length > 0 && validationErrors.cvv?.length === 0 && styles.inputSuccess
            ]}
            placeholder="CVV"
            placeholderTextColor="#666"
            value={paymentInfo.cvv}
            onChangeText={(text) => updatePaymentInfo('cvv', text)}
            keyboardType="numeric"
            maxLength={4}
          />
          {validationErrors.cvv?.map((error, index) => (
            <Text key={index} style={styles.errorText}>{error}</Text>
          ))}
        </View>
      </View>
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Billing Address"
        placeholderTextColor="#666"
        value={paymentInfo.billingAddress}
        onChangeText={(text) => updatePaymentInfo('billingAddress', text)}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderTripSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trip Summary</Text>
      
      {itinerary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{itinerary.destination}</Text>
          <Text style={styles.summarySubtitle}>{itinerary.duration} • {itinerary.description}</Text>
          
          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Flights:</Text>
              <Text style={styles.summaryValue}>
                ${Array.isArray(itinerary.flights) ? itinerary.flights.reduce((sum, flight) => sum + (flight.price || 0), 0) : 0}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hotel:</Text>
              <Text style={styles.summaryValue}>
                ${(itinerary.hotel?.price || 0) * (itinerary.hotel?.total_nights || 1)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Activities:</Text>
              <Text style={styles.summaryValue}>
                ${itinerary.schedule?.reduce((sum, day) => 
                  sum + (day.activities?.reduce((daySum, activity) => daySum + (activity.price || 0), 0) || 0), 0
                ) || 0}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${itinerary.total_cost}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return renderContactInfo();
      case 2:
        return renderTravelerInfo();
      case 3:
        return enabledSteps.flights ? renderFlightInfo() : null;
      case 4:
        return enabledSteps.hotel ? renderHotelInfo() : null;
      case 5:
        return renderPaymentInfo();
      case 6:
        return renderTripSummary();
      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 50 }} />
        </View>

        {renderStepIndicator()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          {activeStep > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
                  {activeStep < 6 ? (
          <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Confirm Booking</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Date</Text>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerText}>Please enter the date in MM/DD/YYYY format</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#666"
                value={tempDateInput}
                onChangeText={setTempDateInput}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => {
                setShowDatePicker(false);
                setTempDateInput('');
              }}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={confirmDateInput}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Nationality Picker Modal */}
      <Modal
        visible={showNationalityPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Nationality</Text>
            <ScrollView style={styles.pickerList}>
              {nationalityOptions.map((nationality) => (
                <TouchableOpacity
                  key={nationality}
                  style={styles.pickerItem}
                  onPress={() => handleNationalitySelect(nationality)}
                >
                  <Text style={styles.pickerItemText}>{nationality}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowNationalityPicker(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Seat Class Picker Modal */}
      <Modal
        visible={showSeatClassPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Seat Class</Text>
            <ScrollView style={styles.pickerList}>
              {seatClassOptions.map((seatClass) => (
                <TouchableOpacity
                  key={seatClass}
                  style={styles.pickerItem}
                  onPress={() => {
                    setFlightInfo({...flightInfo, seatClass});
                    setShowSeatClassPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{seatClass}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSeatClassPicker(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Meal Preference Picker Modal */}
      <Modal
        visible={showMealPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Meal Preference</Text>
            <ScrollView style={styles.pickerList}>
              {mealOptions.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  style={styles.pickerItem}
                  onPress={() => {
                    setFlightInfo({...flightInfo, mealPreference: meal});
                    setShowMealPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{meal}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowMealPicker(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Room Type Picker Modal */}
      <Modal
        visible={showRoomTypePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Room Type</Text>
            <ScrollView style={styles.pickerList}>
              {roomTypeOptions.map((roomType) => (
                <TouchableOpacity
                  key={roomType}
                  style={styles.pickerItem}
                  onPress={() => {
                    setHotelInfo({...hotelInfo, roomType});
                    setShowRoomTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{roomType}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowRoomTypePicker(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: '#6366f1',
  },
  inactiveStep: {
    backgroundColor: '#333',
  },
  disabledStep: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeStepText: {
    color: '#6366f1',
  },
  inactiveStepText: {
    color: '#666',
  },
  disabledStepText: {
    color: '#444',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: -12,
    marginBottom: 8,
    fontWeight: '500',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  travelerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  travelerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  travelerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  removeButton: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  summaryDetails: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  summaryValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    flex: 1,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputText: {
    color: 'white',
    fontSize: 16,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  flightCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  flightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  flightLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
    flex: 1,
  },
  hotelCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  hotelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  hotelLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkboxText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginLeft: 8,
  },
  dropdownText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    width: 150,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pickerItemText: {
    color: 'white',
    fontSize: 16,
  },
}); 