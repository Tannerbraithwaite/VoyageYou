import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  EnhancedItinerary, 
  FlightUpgrade, 
  HotelRoomOption, 
  TravelerInfo, 
  PaymentInfo, 
  ContactInfo,
  FlightUpgradeSelection,
  HotelUpgradeSelection,
  BookingConfirmation
} from '@/types';
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

// Mock upgrade options - in real app, these would come from APIs
const mockFlightUpgrades: FlightUpgrade[] = [
  {
    id: 'seat-1',
    name: 'Premium Economy Seat',
    description: 'Extra legroom, wider seat, priority boarding',
    price: 75,
    type: 'seat',
    category: 'Seating',
    available: true
  },
  {
    id: 'meal-1',
    name: 'Premium Meal Service',
    description: 'Gourmet meal with wine selection',
    price: 45,
    type: 'meal',
    category: 'Dining',
    available: true
  },
  {
    id: 'baggage-1',
    name: 'Extra Baggage Allowance',
    description: 'Additional 23kg checked baggage',
    price: 60,
    type: 'baggage',
    category: 'Baggage',
    available: true
  },
  {
    id: 'priority-1',
    name: 'Priority Boarding',
    description: 'Skip the line and board first',
    price: 25,
    type: 'priority',
    category: 'Service',
    available: true
  },
  {
    id: 'lounge-1',
    name: 'Airport Lounge Access',
    description: 'Access to premium lounges with food and drinks',
    price: 85,
    type: 'lounge',
    category: 'Service',
    available: true
  }
];

const mockHotelUpgrades: HotelRoomOption[] = [
  {
    id: 'room-1',
    name: 'Ocean View Room',
    description: 'Upgrade to room with ocean view',
    price: 120,
    type: 'room_upgrade',
    category: 'Room',
    available: true
  },
  {
    id: 'breakfast-1',
    name: 'Breakfast Included',
    description: 'Daily continental breakfast for all guests',
    price: 35,
    type: 'amenity',
    category: 'Dining',
    available: true
  },
  {
    id: 'spa-1',
    name: 'Spa Package',
    description: 'Access to spa facilities and one massage',
    price: 150,
    type: 'package',
    category: 'Wellness',
    available: true
  },
  {
    id: 'late-checkout-1',
    name: 'Late Checkout',
    description: 'Extended checkout until 2 PM',
    price: 50,
    type: 'service',
    category: 'Service',
    available: true
  }
];

export default function CheckoutScreen() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<EnhancedItinerary | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [totalCost, setTotalCost] = useState(0);
  const [selectedFlightUpgrades, setSelectedFlightUpgrades] = useState<FlightUpgradeSelection[]>([]);
  const [selectedHotelUpgrades, setSelectedHotelUpgrades] = useState<HotelUpgradeSelection[]>([]);
  
  // Form states
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
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    savePayment: false
  });
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    address: ''
  });

  // UI states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  const [currentTravelerIndex, setCurrentTravelerIndex] = useState(0);
  const [tempDateInput, setTempDateInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nationalityOptions = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
    'Australia', 'New Zealand', 'Japan', 'South Korea', 'China', 'India', 'Brazil',
    'Mexico', 'Argentina', 'South Africa', 'Egypt', 'Morocco', 'Turkey', 'Russia'
  ];

  useEffect(() => {
    loadItinerary();
  }, []);

  useEffect(() => {
    calculateTotalCost();
  }, [itinerary, selectedFlightUpgrades, selectedHotelUpgrades]);

  const loadItinerary = () => {
    try {
      const storedItinerary = sessionStorage.getItem('selectedItinerary');
      if (storedItinerary) {
        const parsed = JSON.parse(storedItinerary);
        setItinerary(parsed);
        setTotalCost(parsed.total_cost || 0);
      }
    } catch (error) {
      console.error('Error loading itinerary:', error);
      Alert.alert('Error', 'Failed to load itinerary data');
    }
  };

  const calculateTotalCost = () => {
    if (!itinerary) return;
    
    let baseCost = itinerary.total_cost || 0;
    let upgradeCost = 0;

    // Add flight upgrade costs
    selectedFlightUpgrades.forEach(selection => {
      selection.upgrades.forEach(upgradeId => {
        const upgrade = mockFlightUpgrades.find(u => u.id === upgradeId);
        if (upgrade) upgradeCost += upgrade.price;
      });
    });

    // Add hotel upgrade costs
    selectedHotelUpgrades.forEach(selection => {
      selection.upgrades.forEach(upgradeId => {
        const upgrade = mockHotelUpgrades.find(u => u.id === upgradeId);
        if (upgrade) upgradeCost += upgrade.price;
      });
    });

    setTotalCost(baseCost + upgradeCost);
  };

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
      const newTravelers = travelers.filter((_, i) => i !== index);
      setTravelers(newTravelers);
    }
  };

  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
    const newTravelers = [...travelers];
    newTravelers[index] = { ...newTravelers[index], [field]: value };
    setTravelers(newTravelers);
  };

  const toggleFlightUpgrade = (flightId: string, upgradeId: string) => {
    setSelectedFlightUpgrades(prev => {
      const existing = prev.find(s => s.flight_id === flightId);
      if (existing) {
        const newSelection = { ...existing };
        if (newSelection.upgrades.includes(upgradeId)) {
          newSelection.upgrades = newSelection.upgrades.filter(id => id !== upgradeId);
        } else {
          newSelection.upgrades = [...newSelection.upgrades, upgradeId];
        }
        return prev.map(s => s.flight_id === flightId ? newSelection : s);
      } else {
        return [...prev, { flight_id: flightId, upgrades: [upgradeId] }];
      }
    });
  };

  const toggleHotelUpgrade = (hotelId: string, upgradeId: string) => {
    setSelectedHotelUpgrades(prev => {
      const existing = prev.find(s => s.hotel_id === hotelId);
      if (existing) {
        const newSelection = { ...existing };
        if (newSelection.upgrades.includes(upgradeId)) {
          newSelection.upgrades = newSelection.upgrades.filter(id => id !== upgradeId);
        } else {
          newSelection.upgrades = [...newSelection.upgrades, upgradeId];
        }
        return prev.map(s => s.hotel_id === hotelId ? newSelection : s);
      } else {
        return [...prev, { hotel_id: hotelId, upgrades: [upgradeId] }];
      }
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Traveler Info
        return travelers.every(traveler => 
          traveler.firstName && traveler.lastName && traveler.dateOfBirth && 
          traveler.passportNumber && traveler.passportExpiry && traveler.nationality
        );
      case 2: // Flight Upgrades
        return true; // Optional step
      case 3: // Hotel Upgrades
        return true; // Optional step
      case 4: // Payment Info
        return !!(paymentInfo.cardNumber && paymentInfo.cardholderName && 
                 paymentInfo.expiryDate && paymentInfo.cvv && paymentInfo.billingAddress);
      case 5: // Contact Info
        return !!(contactInfo.email && contactInfo.phone && contactInfo.address);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create booking request
      const bookingRequest = {
        itinerary_id: itinerary?.trip_type || 'unknown',
        traveler_info: travelers,
        flight_upgrades: selectedFlightUpgrades,
        hotel_upgrades: selectedHotelUpgrades,
        payment_info: paymentInfo,
        contact_info: contactInfo,
        total_cost: totalCost,
        booking_notes: ''
      };

      // In real app, this would be sent to the backend
      console.log('Booking request:', bookingRequest);

      // Show success message
      Alert.alert(
        'Booking Complete! 🎉',
        'Your travel booking has been confirmed. You will receive a confirmation email shortly.',
        [
          {
            text: 'View Itinerary',
            onPress: () => router.push('/(tabs)/explore')
          }
        ]
      );

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle, 
            activeStep >= step ? styles.stepActive : styles.stepInactive
          ]}>
            <Text style={[
              styles.stepNumber, 
              activeStep >= step ? styles.stepNumberActive : styles.stepNumberInactive
            ]}>
              {step}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel, 
            activeStep >= step ? styles.stepLabelActive : styles.stepLabelInactive
          ]}>
            {step === 1 ? 'Travelers' : 
             step === 2 ? 'Flights' : 
             step === 3 ? 'Hotels' : 
             step === 4 ? 'Payment' : 'Contact'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTravelerInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Traveler Information</Text>
      <Text style={styles.stepSubtitle}>Enter details for all travelers</Text>
      
      {travelers.map((traveler, index) => (
        <View key={index} style={styles.travelerCard}>
          <View style={styles.travelerHeader}>
            <Text style={styles.travelerNumber}>Traveler {index + 1}</Text>
            {travelers.length > 1 && (
              <TouchableOpacity 
                style={styles.removeTravelerButton}
                onPress={() => removeTraveler(index)}
              >
                <Text style={styles.removeTravelerText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.textInput}
                value={traveler.firstName}
                onChangeText={(value) => updateTraveler(index, 'firstName', value)}
                placeholder="First Name"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.textInput}
                value={traveler.lastName}
                onChangeText={(value) => updateTraveler(index, 'lastName', value)}
                placeholder="Last Name"
              />
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setCurrentDateField('dateOfBirth');
                  setCurrentTravelerIndex(index);
                  setShowDatePicker(true);
                }}
              >
                <Text style={traveler.dateOfBirth ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {traveler.dateOfBirth || 'MM/DD/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Nationality *</Text>
              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => {
                  setCurrentTravelerIndex(index);
                  setShowNationalityPicker(true);
                }}
              >
                <Text style={traveler.nationality ? styles.pickerInputText : styles.pickerInputPlaceholder}>
                  {traveler.nationality || 'Select Nationality'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Passport Number *</Text>
              <TextInput
                style={styles.textInput}
                value={traveler.passportNumber}
                onChangeText={(value) => updateTraveler(index, 'passportNumber', value)}
                placeholder="Passport Number"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Passport Expiry *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setCurrentDateField('passportExpiry');
                  setCurrentTravelerIndex(index);
                  setShowDatePicker(true);
                }}
              >
                <Text style={traveler.passportExpiry ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {traveler.passportExpiry || 'MM/DD/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addTravelerButton} onPress={addTraveler}>
        <Text style={styles.addTravelerText}>+ Add Another Traveler</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFlightUpgrades = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Flight Upgrades & Add-ons</Text>
      <Text style={styles.stepSubtitle}>Enhance your flight experience with premium options</Text>
      
      {itinerary?.flights?.map((flight, flightIndex) => (
        <View key={flightIndex} style={styles.flightCard}>
          <View style={styles.flightHeader}>
            <Text style={styles.flightRoute}>
              {flight.departure} → {flight.departure.includes('Airport') ? 'Destination' : 'Arrival'}
            </Text>
            <Text style={styles.flightDetails}>
              {flight.airline} {flight.flight} • {flight.time}
            </Text>
          </View>
          
          <View style={styles.upgradesContainer}>
            {mockFlightUpgrades.map(upgrade => (
              <TouchableOpacity
                key={upgrade.id}
                style={[
                  styles.upgradeOption,
                  selectedFlightUpgrades.some(s => 
                    s.flight_id === flight.flight && s.upgrades.includes(upgrade.id)
                  ) && styles.upgradeSelected
                ]}
                onPress={() => toggleFlightUpgrade(flight.flight, upgrade.id)}
              >
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{upgrade.name}</Text>
                  <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                  <Text style={styles.upgradeCategory}>{upgrade.category}</Text>
                </View>
                <View style={styles.upgradePrice}>
                  <Text style={styles.upgradePriceText}>${upgrade.price}</Text>
                  <View style={[
                    styles.upgradeCheckbox,
                    selectedFlightUpgrades.some(s => 
                      s.flight_id === flight.flight && s.upgrades.includes(upgrade.id)
                    ) && styles.upgradeCheckboxSelected
                  ]}>
                    <Text style={styles.upgradeCheckmark}>✓</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      
      <View style={styles.skipSection}>
        <Text style={styles.skipText}>No upgrades needed? You can skip this step</Text>
      </View>
    </View>
  );

  const renderHotelUpgrades = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Hotel Upgrades & Amenities</Text>
      <Text style={styles.stepSubtitle}>Customize your hotel stay with premium options</Text>
      
      {itinerary?.trip_type === 'single_city' ? (
        <View style={styles.hotelCard}>
          <View style={styles.hotelHeader}>
            <Text style={styles.hotelName}>{itinerary.hotel.name}</Text>
            <Text style={styles.hotelDetails}>
              {itinerary.hotel.room_type} • {itinerary.hotel.total_nights} nights
            </Text>
          </View>
          
          <View style={styles.upgradesContainer}>
            {mockHotelUpgrades.map(upgrade => (
              <TouchableOpacity
                key={upgrade.id}
                style={[
                  styles.upgradeOption,
                  selectedHotelUpgrades.some(s => 
                    s.hotel_id === itinerary.hotel.name && s.upgrades.includes(upgrade.id)
                  ) && styles.upgradeSelected
                ]}
                onPress={() => toggleHotelUpgrade(itinerary.hotel.name, upgrade.id)}
              >
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{upgrade.name}</Text>
                  <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                  <Text style={styles.upgradeCategory}>{upgrade.category}</Text>
                </View>
                <View style={styles.upgradePrice}>
                  <Text style={styles.upgradePriceText}>${upgrade.price}</Text>
                  <View style={[
                    styles.upgradeCheckbox,
                    selectedHotelUpgrades.some(s => 
                      s.hotel_id === itinerary.hotel.name && s.upgrades.includes(upgrade.id)
                    ) && styles.upgradeCheckboxSelected
                  ]}>
                    <Text style={styles.upgradeCheckmark}>✓</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.multiHotelSection}>
          {itinerary?.hotels?.map((hotel, hotelIndex) => (
            <View key={hotelIndex} style={styles.hotelCard}>
              <View style={styles.hotelHeader}>
                <Text style={styles.hotelName}>{hotel.name}</Text>
                <Text style={styles.hotelDetails}>
                  {hotel.city} • {hotel.room_type} • {hotel.total_nights} nights
                </Text>
              </View>
              
              <View style={styles.upgradesContainer}>
                {mockHotelUpgrades.map(upgrade => (
                  <TouchableOpacity
                    key={upgrade.id}
                    style={[
                      styles.upgradeOption,
                      selectedHotelUpgrades.some(s => 
                        s.hotel_id === hotel.name && s.upgrades.includes(upgrade.id)
                      ) && styles.upgradeSelected
                    ]}
                    onPress={() => toggleHotelUpgrade(hotel.name, upgrade.id)}
                  >
                    <View style={styles.upgradeInfo}>
                      <Text style={styles.upgradeName}>{upgrade.name}</Text>
                      <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                      <Text style={styles.upgradeCategory}>{upgrade.category}</Text>
                    </View>
                    <View style={styles.upgradePrice}>
                      <Text style={styles.upgradePriceText}>${upgrade.price}</Text>
                      <View style={[
                        styles.upgradeCheckbox,
                        selectedHotelUpgrades.some(s => 
                          s.hotel_id === hotel.name && s.upgrades.includes(upgrade.id)
                        ) && styles.upgradeCheckboxSelected
                      ]}>
                        <Text style={styles.upgradeCheckmark}>✓</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.skipSection}>
        <Text style={styles.skipText}>No upgrades needed? You can skip this step</Text>
      </View>
    </View>
  );

  const renderPaymentInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment Information</Text>
      <Text style={styles.stepSubtitle}>Secure payment processing</Text>
      
      <View style={styles.paymentCard}>
        <Text style={styles.inputLabel}>Card Number *</Text>
        <TextInput
          style={styles.textInput}
          value={paymentInfo.cardNumber}
          onChangeText={(value) => setPaymentInfo({...paymentInfo, cardNumber: value})}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          maxLength={19}
        />
        
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Cardholder Name *</Text>
            <TextInput
              style={styles.textInput}
              value={paymentInfo.cardholderName}
              onChangeText={(value) => setPaymentInfo({...paymentInfo, cardholderName: value})}
              placeholder="John Doe"
            />
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Expiry Date *</Text>
            <TextInput
              style={styles.textInput}
              value={paymentInfo.expiryDate}
              onChangeText={(value) => setPaymentInfo({...paymentInfo, expiryDate: value})}
              placeholder="MM/YY"
              maxLength={5}
            />
          </View>
        </View>
        
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>CVV *</Text>
            <TextInput
              style={styles.textInput}
              value={paymentInfo.cvv}
              onChangeText={(value) => setPaymentInfo({...paymentInfo, cvv: value})}
              placeholder="123"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Billing Address *</Text>
            <TextInput
              style={styles.textInput}
              value={paymentInfo.billingAddress}
              onChangeText={(value) => setPaymentInfo({...paymentInfo, billingAddress: value})}
              placeholder="123 Main St, City, State"
            />
          </View>
        </View>
        
        <View style={styles.savePaymentRow}>
          <Switch
            value={paymentInfo.savePayment}
            onValueChange={(value) => setPaymentInfo({...paymentInfo, savePayment: value})}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={paymentInfo.savePayment ? '#f5dd4b' : '#f4f3f4'}
          />
          <Text style={styles.savePaymentText}>Save payment method for future use</Text>
        </View>
      </View>
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepSubtitle}>How we can reach you about your booking</Text>
      
      <View style={styles.contactCard}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={styles.textInput}
          value={contactInfo.email}
          onChangeText={(value) => setContactInfo({...contactInfo, email: value})}
          placeholder="your.email@example.com"
          keyboardType="email-address"
        />
        
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={styles.textInput}
          value={contactInfo.phone}
          onChangeText={(value) => setContactInfo({...contactInfo, phone: value})}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />
        
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput
          style={styles.textInput}
          value={contactInfo.address}
          onChangeText={(value) => setContactInfo({...contactInfo, address: value})}
          placeholder="123 Main Street, City, State, ZIP"
          multiline
          numberOfLines={3}
        />
        
                 <View style={styles.emergencySection}>
           <Text style={styles.emergencyTitle}>Emergency Contact (Optional)</Text>
           <TextInput
             style={styles.textInput}
             value={contactInfo.emergencyContact?.name || ''}
             onChangeText={(value) => setContactInfo({
               ...contactInfo, 
               emergencyContact: { 
                 name: value, 
                 phone: contactInfo.emergencyContact?.phone || '', 
                 relationship: contactInfo.emergencyContact?.relationship || '' 
               }
             })}
             placeholder="Emergency Contact Name"
           />
           <TextInput
             style={styles.textInput}
             value={contactInfo.emergencyContact?.phone || ''}
             onChangeText={(value) => setContactInfo({
               ...contactInfo, 
               emergencyContact: { 
                 name: contactInfo.emergencyContact?.name || '', 
                 phone: value, 
                 relationship: contactInfo.emergencyContact?.relationship || '' 
               }
             })}
             placeholder="Emergency Contact Phone"
             keyboardType="phone-pad"
           />
           <TextInput
             style={styles.textInput}
             value={contactInfo.emergencyContact?.relationship || ''}
             onChangeText={(value) => setContactInfo({
               ...contactInfo, 
               emergencyContact: { 
                 name: contactInfo.emergencyContact?.name || '', 
                 phone: contactInfo.emergencyContact?.phone || '', 
                 relationship: value 
               }
             })}
             placeholder="Relationship (e.g., Spouse, Parent)"
           />
         </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return renderTravelerInfo();
      case 2:
        return renderFlightUpgrades();
      case 3:
        return renderHotelUpgrades();
      case 4:
        return renderPaymentInfo();
      case 5:
        return renderContactInfo();
      default:
        return null;
    }
  };

  const confirmDateInput = () => {
    if (tempDateInput) {
      updateTraveler(currentTravelerIndex, currentDateField as keyof TravelerInfo, tempDateInput);
      setShowDatePicker(false);
      setTempDateInput('');
    }
  };

  const handleNationalitySelect = (nationality: string) => {
    updateTraveler(currentTravelerIndex, 'nationality', nationality);
    setShowNationalityPicker(false);
  };

  if (!itinerary) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading itinerary...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/')}>
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
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Cost:</Text>
            <Text style={styles.totalAmount}>${totalCost.toFixed(2)}</Text>
          </View>
          
          <View style={styles.buttonRow}>
            {activeStep > 1 && (
              <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            {activeStep < 5 ? (
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={nextStep}
                disabled={!validateStep(activeStep)}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleSubmit}
                disabled={!validateStep(activeStep) || isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Processing...' : 'Confirm Booking'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
  stepContent: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
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
  travelerNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  removeTravelerButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeTravelerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },

}); 