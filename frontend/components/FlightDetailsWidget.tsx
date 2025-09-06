import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FlightDetailsWidgetProps {
  flight: {
    airline: string;
    flight: string;
    departure: string;
    time: string;
    price: number;
    type: 'outbound' | 'return';
  };
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function FlightDetailsWidget({ flight, onClose }: FlightDetailsWidgetProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'information-circle' },
    { id: 'details', label: 'Flight Details', icon: 'airplane' },
    { id: 'baggage', label: 'Baggage', icon: 'briefcase' },
    { id: 'policies', label: 'Policies', icon: 'document-text' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <View style={styles.overviewCard}>
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Flight Price</Text>
                <Text style={styles.priceValue}>${flight.price}</Text>
                <Text style={styles.priceType}>{flight.type === 'outbound' ? 'One Way' : 'Return'}</Text>
              </View>
              
              <View style={styles.flightSummary}>
                <View style={styles.routeContainer}>
                  <View style={styles.routeItem}>
                    <Ionicons name="airplane" size={24} color="#007AFF" />
                    <Text style={styles.routeLabel}>From</Text>
                    <Text style={styles.routeValue}>{flight.departure.split(' → ')[0]}</Text>
                  </View>
                  
                  <View style={styles.routeArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#666" />
                  </View>
                  
                  <View style={styles.routeItem}>
                    <Ionicons name="location" size={24} color="#007AFF" />
                    <Text style={styles.routeLabel}>To</Text>
                    <Text style={styles.routeValue}>{flight.departure.split(' → ')[1]}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case 'details':
        return (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Flight Information</Text>
              
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Airline</Text>
                  <Text style={styles.detailValue}>{flight.airline}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="airplane" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Flight Number</Text>
                  <Text style={styles.detailValue}>{flight.flight}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Departure Time</Text>
                  <Text style={styles.detailValue}>{flight.time.split(' - ')[0]}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Arrival Time</Text>
                  <Text style={styles.detailValue}>{flight.time.split(' - ')[1]}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Flight Type</Text>
                  <Text style={styles.detailValue}>
                    {flight.type === 'outbound' ? 'Outbound' : 'Return'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'baggage':
        return (
          <View style={styles.tabContent}>
            <View style={styles.baggageSection}>
              <Text style={styles.sectionTitle}>Baggage Information</Text>
              
              <View style={styles.baggageCard}>
                <View style={styles.baggageItem}>
                  <Ionicons name="briefcase" size={20} color="#34C759" />
                  <Text style={styles.baggageLabel}>Carry-on</Text>
                  <Text style={styles.baggageValue}>1 piece (7kg)</Text>
                </View>
                
                <View style={styles.baggageItem}>
                  <Ionicons name="bag-handle" size={20} color="#007AFF" />
                  <Text style={styles.baggageLabel}>Checked Baggage</Text>
                  <Text style={styles.baggageValue}>1 piece (23kg)</Text>
                </View>
                
                <View style={styles.baggageItem}>
                  <Ionicons name="cube" size={20} color="#FF9500" />
                  <Text style={styles.baggageLabel}>Dimensions</Text>
                  <Text style={styles.baggageValue}>55 x 40 x 20 cm</Text>
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>Restrictions</Text>
              <View style={styles.restrictionsCard}>
                <Text style={styles.restrictionText}>
                  • Liquids must be in containers of 100ml or less
                </Text>
                <Text style={styles.restrictionText}>
                  • Electronics must be easily accessible
                </Text>
                <Text style={styles.restrictionText}>
                  • No sharp objects in carry-on luggage
                </Text>
              </View>
            </View>
          </View>
        );

      case 'policies':
        return (
          <View style={styles.tabContent}>
            <View style={styles.policiesSection}>
              <Text style={styles.sectionTitle}>Flight Policies</Text>
              
              <View style={styles.policyCard}>
                <View style={styles.policyItem}>
                  <Ionicons name="time" size={20} color="#007AFF" />
                  <Text style={styles.policyLabel}>Check-in Time</Text>
                  <Text style={styles.policyValue}>2 hours before departure</Text>
                </View>
                
                <View style={styles.policyItem}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={styles.policyLabel}>Cancellation</Text>
                  <Text style={styles.policyValue}>Non-refundable ticket</Text>
                </View>
                
                <View style={styles.policyItem}>
                  <Ionicons name="swap-horizontal" size={20} color="#FF9500" />
                  <Text style={styles.policyLabel}>Changes</Text>
                  <Text style={styles.policyValue}>Subject to airline fees</Text>
                </View>
                
                <View style={styles.policyItem}>
                  <Ionicons name="card" size={20} color="#34C759" />
                  <Text style={styles.policyLabel}>Payment</Text>
                  <Text style={styles.policyValue}>Credit card required</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.flightTitle} numberOfLines={2}>
            {flight.airline} - {flight.flight}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? '#007AFF' : '#666'} 
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginRight: 20,
  },
  closeButton: {
    padding: 8,
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    minHeight: 300,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  priceType: {
    fontSize: 16,
    color: '#666',
  },
  flightSummary: {
    marginTop: 20,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeArrow: {
    paddingHorizontal: 20,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  routeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
    marginRight: 12,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  baggageSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  baggageCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  baggageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  baggageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
    marginRight: 12,
    minWidth: 120,
  },
  baggageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  restrictionsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  restrictionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  policiesSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  policyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
    marginRight: 12,
    minWidth: 100,
  },
  policyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});
