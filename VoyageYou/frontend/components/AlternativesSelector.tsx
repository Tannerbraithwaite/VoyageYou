import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import GlassCard from './ui/GlassCard';
import { FlightInfo, HotelInfo } from '@/types';

interface AlternativesSelectorProps {
  title: string;
  currentOption: FlightInfo | HotelInfo;
  alternatives: (FlightInfo | HotelInfo)[];
  onSelect: (option: FlightInfo | HotelInfo) => void;
  type: 'flight' | 'hotel';
}

export const AlternativesSelector: React.FC<AlternativesSelectorProps> = ({
  title,
  currentOption,
  alternatives,
  onSelect,
  type
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const renderFlightOption = (option: FlightInfo, isSelected: boolean) => (
    <View style={[styles.optionCard, isSelected && styles.selectedOption]}>
      <View style={styles.optionHeader}>
        <Text style={styles.airlineText}>{option.airline}</Text>
        <Text style={styles.priceText}>${option.price}</Text>
      </View>
      <Text style={styles.flightText}>{option.flight}</Text>
      <Text style={styles.routeText}>{option.departure}</Text>
      <Text style={styles.timeText}>{option.time}</Text>
      <Text style={styles.typeText}>{option.type}</Text>
    </View>
  );

  const renderHotelOption = (option: HotelInfo, isSelected: boolean) => (
    <View style={[styles.optionCard, isSelected && styles.selectedOption]}>
      <View style={styles.optionHeader}>
        <Text style={styles.hotelNameText}>{option.name}</Text>
        <Text style={styles.priceText}>${option.price}/night</Text>
      </View>
      <Text style={styles.addressText}>{option.address}</Text>
      <Text style={styles.roomText}>{option.room_type}</Text>
      {option.city && <Text style={styles.cityText}>{option.city}</Text>}
    </View>
  );

  const isCurrentOption = (option: FlightInfo | HotelInfo) => {
    if (type === 'flight') {
      const flight = option as FlightInfo;
      const current = currentOption as FlightInfo;
      return flight.airline === current.airline && flight.flight === current.flight;
    } else {
      const hotel = option as HotelInfo;
      const current = currentOption as HotelInfo;
      return hotel.name === current.name && hotel.address === current.address;
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selectorButton}>
        <Text style={styles.selectorButtonText}>🔄 View Alternatives</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsContainer}>
              {/* Current Selection */}
              <View style={styles.currentSection}>
                <Text style={styles.currentLabel}>Current Selection:</Text>
                {type === 'flight' 
                  ? renderFlightOption(currentOption as FlightInfo, true)
                  : renderHotelOption(currentOption as HotelInfo, true)
                }
              </View>

              {/* Alternatives */}
              {alternatives.length > 0 && (
                <View style={styles.alternativesSection}>
                  <Text style={styles.alternativesLabel}>Alternative Options:</Text>
                  {alternatives.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        onSelect(option);
                        setModalVisible(false);
                      }}
                      style={styles.alternativeOption}
                    >
                      {type === 'flight' 
                        ? renderFlightOption(option as FlightInfo, false)
                        : renderHotelOption(option as HotelInfo, false)
                      }
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectorButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flex: 1,
  },
  currentSection: {
    marginBottom: 20,
  },
  currentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  alternativesSection: {
    marginBottom: 20,
  },
  alternativesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedOption: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  alternativeOption: {
    marginBottom: 10,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  airlineText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  hotelNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  flightText: {
    fontSize: 14,
    color: '#f3f4f6',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#f3f4f6',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#f3f4f6',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#8b5cf6',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#f3f4f6',
    marginBottom: 4,
  },
  roomText: {
    fontSize: 14,
    color: '#f3f4f6',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
});
