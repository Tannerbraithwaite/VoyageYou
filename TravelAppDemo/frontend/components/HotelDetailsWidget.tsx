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
import { LinearGradient } from 'expo-linear-gradient';

interface HotelDetailsWidgetProps {
  hotel: {
    name: string;
    address: string;
    check_in: string;
    check_out: string;
    room_type: string;
    price: number;
    total_nights: number;
    amenities: string[];
    services: string[];
    location: {
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    policies: any;
    images: Array<{
      url: string;
      caption: string;
      category: string;
    }>;
    rating: any;
    reviews: any[];
  };
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function HotelDetailsWidget({ hotel, onClose }: HotelDetailsWidgetProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'information-circle' },
    { id: 'amenities', label: 'Amenities', icon: 'star' },
    { id: 'location', label: 'Location', icon: 'location' },
    { id: 'policies', label: 'Policies', icon: 'document-text' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <View style={styles.overviewCard}>
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Total Price</Text>
                <Text style={styles.priceValue}>${hotel.price * hotel.total_nights}</Text>
                <Text style={styles.pricePerNight}>${hotel.price}/night</Text>
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Check-in</Text>
                  <Text style={styles.detailValue}>{hotel.check_in}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Check-out</Text>
                  <Text style={styles.detailValue}>{hotel.check_out}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="bed" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Room Type</Text>
                  <Text style={styles.detailValue}>{hotel.room_type}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="moon" size={20} color="#007AFF" />
                  <Text style={styles.detailLabel}>Nights</Text>
                  <Text style={styles.detailValue}>{hotel.total_nights}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'amenities':
        return (
          <View style={styles.tabContent}>
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Hotel Amenities</Text>
              {hotel.amenities.length > 0 ? (
                <View style={styles.amenitiesGrid}>
                  {hotel.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>Amenities information not available</Text>
              )}
              
              <Text style={styles.sectionTitle}>Services</Text>
              {hotel.services.length > 0 ? (
                <View style={styles.amenitiesGrid}>
                  {hotel.services.map((service, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.amenityText}>{service}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>Services information not available</Text>
              )}
            </View>
          </View>
        );

      case 'location':
        return (
          <View style={styles.tabContent}>
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.addressCard}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={styles.addressText}>{hotel.address}</Text>
              </View>
              
              {hotel.location.coordinates && (
                <>
                  <Text style={styles.sectionTitle}>Coordinates</Text>
                  <View style={styles.coordinatesCard}>
                    <Ionicons name="map" size={20} color="#007AFF" />
                    <Text style={styles.coordinatesText}>
                      {hotel.location.coordinates.lat.toFixed(4)}, {hotel.location.coordinates.lng.toFixed(4)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        );

      case 'policies':
        return (
          <View style={styles.tabContent}>
            <View style={styles.policiesSection}>
              <Text style={styles.sectionTitle}>Hotel Policies</Text>
              {Object.keys(hotel.policies).length > 0 ? (
                Object.entries(hotel.policies).map(([key, value]) => (
                  <View key={key} style={styles.policyItem}>
                    <Text style={styles.policyKey}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.policyValue}>
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Policy information not available</Text>
              )}
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
          <Text style={styles.hotelName} numberOfLines={2}>
            {hotel.name}
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
  hotelName: {
    fontSize: 24,
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
  pricePerNight: {
    fontSize: 16,
    color: '#666',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  amenitiesSection: {
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
    marginTop: 8,
  },
  amenitiesGrid: {
    marginBottom: 24,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  locationSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  coordinatesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontFamily: 'monospace',
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
  policyItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  policyKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  policyValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
