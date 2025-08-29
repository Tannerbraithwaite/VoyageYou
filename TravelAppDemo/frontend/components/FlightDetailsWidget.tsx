import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface FlightDetailsWidgetProps {
  flight: {
    airline: string;
    flight: string;
    departure: string;
    time: string;
    price: number;
    type: string;
    baggage?: {
      carry_on: string;
      checked_bags: string;
      excess_fees: string;
      special_items?: string;
    };
    cabin_class?: string;
    meals?: string[];
    aircraft?: {
      model: string;
      configuration: string;
      seats: string;
    };
    duration?: string;
    entertainment?: string[];
    terminal_info?: {
      departure_terminal?: string;
      arrival_terminal?: string;
    };
  };
  onClose: () => void;
}

export const FlightDetailsWidget: React.FC<FlightDetailsWidgetProps> = ({
  flight,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoRow}>
        <Ionicons name="airplane" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Airline:</Text>
        <Text style={styles.infoValue}>{flight.airline}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="document-text" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Flight:</Text>
        <Text style={styles.infoValue}>{flight.flight}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="location" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Route:</Text>
        <Text style={styles.infoValue}>{flight.departure}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="time" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Time:</Text>
        <Text style={styles.infoValue}>{flight.time}</Text>
      </View>
      
      {flight.duration && (
        <View style={styles.infoRow}>
          <Ionicons name="hourglass" size={20} color={Colors.light.tint} />
          <Text style={styles.infoLabel}>Duration:</Text>
          <Text style={styles.infoValue}>{flight.duration}</Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Ionicons name="card" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Price:</Text>
        <Text style={styles.infoValue}>${flight.price}</Text>
      </View>
      
      {flight.cabin_class && (
        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color={Colors.light.tint} />
          <Text style={styles.infoLabel}>Cabin:</Text>
          <Text style={styles.infoValue}>{flight.cabin_class}</Text>
        </View>
      )}
    </View>
  );

  const renderBaggage = () => (
    <View style={styles.tabContent}>
      {flight.baggage ? (
        <>
          <View style={styles.baggageItem}>
            <Ionicons name="briefcase" size={24} color={Colors.light.tint} />
            <View style={styles.baggageText}>
              <Text style={styles.baggageTitle}>Carry-on</Text>
              <Text style={styles.baggageDescription}>{flight.baggage.carry_on}</Text>
            </View>
          </View>
          
          <View style={styles.baggageItem}>
            <Ionicons name="bag" size={24} color={Colors.light.tint} />
            <View style={styles.baggageText}>
              <Text style={styles.baggageTitle}>Checked Bags</Text>
              <Text style={styles.baggageDescription}>{flight.baggage.checked_bags}</Text>
            </View>
          </View>
          
          <View style={styles.baggageItem}>
            <Ionicons name="warning" size={24} color="#FF9500" />
            <View style={styles.baggageText}>
              <Text style={styles.baggageTitle}>Excess Fees</Text>
              <Text style={styles.baggageDescription}>{flight.baggage.excess_fees}</Text>
            </View>
          </View>
          
          {flight.baggage.special_items && (
            <View style={styles.baggageItem}>
              <Ionicons name="bicycle" size={24} color={Colors.light.tint} />
              <View style={styles.baggageText}>
                <Text style={styles.baggageTitle}>Special Items</Text>
                <Text style={styles.baggageDescription}>{flight.baggage.special_items}</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noDataText}>Baggage information not available</Text>
      )}
    </View>
  );

  const renderAmenities = () => (
    <View style={styles.tabContent}>
      {flight.meals && flight.meals.length > 0 && (
        <View style={styles.amenitySection}>
          <Text style={styles.amenitySectionTitle}>Meals & Refreshments</Text>
          {flight.meals.map((meal, index) => (
            <View key={index} style={styles.amenityItem}>
              <Ionicons name="restaurant" size={20} color={Colors.light.tint} />
              <Text style={styles.amenityText}>{meal}</Text>
            </View>
          ))}
        </View>
      )}
      
      {flight.entertainment && flight.entertainment.length > 0 && (
        <View style={styles.amenitySection}>
          <Text style={styles.amenitySectionTitle}>Entertainment</Text>
          {flight.entertainment.map((item, index) => (
            <View key={index} style={styles.amenityItem}>
              <Ionicons name="tv" size={20} color={Colors.light.tint} />
              <Text style={styles.amenityText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
      
      {flight.aircraft && (
        <View style={styles.amenitySection}>
          <Text style={styles.amenitySectionTitle}>Aircraft Information</Text>
          <View style={styles.amenityItem}>
            <Ionicons name="airplane" size={20} color={Colors.light.tint} />
            <Text style={styles.amenityText}>Model: {flight.aircraft.model}</Text>
          </View>
          <View style={styles.amenityItem}>
            <Ionicons name="settings" size={20} color={Colors.light.tint} />
            <Text style={styles.amenityText}>Configuration: {flight.aircraft.configuration}</Text>
          </View>
          <View style={styles.amenityItem}>
            <Ionicons name="people" size={20} color={Colors.light.tint} />
            <Text style={styles.amenityText}>Total Seats: {flight.aircraft.seats}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderTerminals = () => (
    <View style={styles.tabContent}>
      {flight.terminal_info ? (
        <>
          {flight.terminal_info.departure_terminal && (
            <View style={styles.terminalItem}>
              <Ionicons name="airplane-outline" size={24} color={Colors.light.tint} />
              <View style={styles.terminalText}>
                <Text style={styles.terminalTitle}>Departure Terminal</Text>
                <Text style={styles.terminalValue}>{flight.terminal_info.departure_terminal}</Text>
              </View>
            </View>
          )}
          
          {flight.terminal_info.arrival_terminal && (
            <View style={styles.terminalItem}>
              <Ionicons name="airplane" size={24} color={Colors.light.tint} />
              <View style={styles.terminalText}>
                <Text style={styles.terminalTitle}>Arrival Terminal</Text>
                <Text style={styles.terminalValue}>{flight.terminal_info.arrival_terminal}</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noDataText}>Terminal information not available</Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'baggage':
        return renderBaggage();
      case 'amenities':
        return renderAmenities();
      case 'terminals':
        return renderTerminals();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flight Details</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'baggage' && styles.activeTab]}
          onPress={() => setActiveTab('baggage')}
        >
          <Text style={[styles.tabText, activeTab === 'baggage' && styles.activeTabText]}>
            Baggage
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amenities' && styles.activeTab]}
          onPress={() => setActiveTab('amenities')}
        >
          <Text style={[styles.tabText, activeTab === 'amenities' && styles.activeTabText]}>
            Amenities
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terminals' && styles.activeTab]}
          onPress={() => setActiveTab('terminals')}
        >
          <Text style={[styles.tabText, activeTab === 'terminals' && styles.activeTabText]}>
            Terminals
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 10,
    marginRight: 10,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  baggageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  baggageText: {
    marginLeft: 15,
    flex: 1,
  },
  baggageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
  },
  baggageDescription: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  amenitySection: {
    marginBottom: 25,
  },
  amenitySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  amenityText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 15,
    flex: 1,
  },
  terminalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  terminalText: {
    marginLeft: 15,
    flex: 1,
  },
  terminalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
  },
  terminalValue: {
    fontSize: 16,
    color: Colors.light.text,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
