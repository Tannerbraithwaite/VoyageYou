import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface HotelDetailsWidgetProps {
  hotel: {
    name: string;
    address: string;
    check_in: string;
    check_out: string;
    room_type: string;
    price: number;
    total_nights: number;
    amenities?: string[];
    services?: string[];
    location?: {
      coordinates?: { lat: number; lng: number };
      distance_to_airport?: string;
      distance_to_center?: string;
      nearby_attractions?: string[];
    };
    policies?: {
      check_in_time?: string;
      check_out_time?: string;
      cancellation_policy?: string;
      taxes?: string;
      fees?: string[];
    };
    images?: Array<{
      url: string;
      caption: string;
      category: string;
    }>;
    rating?: {
      overall?: number;
      cleanliness?: number;
      comfort?: number;
      location?: number;
      service?: number;
    };
    reviews?: Array<{
      rating: number;
      comment: string;
      date: string;
    }>;
  };
  onClose: () => void;
}

export const HotelDetailsWidget: React.FC<HotelDetailsWidgetProps> = ({
  hotel,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoRow}>
        <Ionicons name="business" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Hotel:</Text>
        <Text style={styles.infoValue}>{hotel.name}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="location" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Address:</Text>
        <Text style={styles.infoValue}>{hotel.address}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="bed" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Room Type:</Text>
        <Text style={styles.infoValue}>{hotel.room_type}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="calendar" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Check-in:</Text>
        <Text style={styles.infoValue}>{hotel.check_in}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Check-out:</Text>
        <Text style={styles.infoValue}>{hotel.check_out}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="moon" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Nights:</Text>
        <Text style={styles.infoValue}>{hotel.total_nights}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="card" size={20} color={Colors.light.tint} />
        <Text style={styles.infoLabel}>Price:</Text>
        <Text style={styles.infoValue}>${hotel.price}/night</Text>
      </View>
      
      {hotel.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Overall Rating</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>{hotel.rating.overall}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (hotel.rating?.overall || 0) ? "star" : "star-outline"}
                  size={20}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderImages = () => (
    <View style={styles.tabContent}>
      {hotel.images && hotel.images.length > 0 ? (
        <>
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: hotel.images[selectedImageIndex].url }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            <Text style={styles.imageCaption}>{hotel.images[selectedImageIndex].caption}</Text>
          </View>
          
          <FlatList
            data={hotel.images}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailList}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnailContainer,
                  selectedImageIndex === index && styles.selectedThumbnail
                ]}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <Text style={styles.thumbnailCaption}>{item.category}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </>
      ) : (
        <Text style={styles.noDataText}>No images available</Text>
      )}
    </View>
  );

  const renderAmenities = () => (
    <View style={styles.tabContent}>
      {hotel.amenities && hotel.amenities.length > 0 && (
        <View style={styles.amenitySection}>
          <Text style={styles.amenitySectionTitle}>Room Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.tint} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {hotel.services && hotel.services.length > 0 && (
        <View style={styles.amenitySection}>
          <Text style={styles.amenitySectionTitle}>Hotel Services</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.services.map((service, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="star" size={20} color={Colors.light.tint} />
                <Text style={styles.amenityText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderLocation = () => (
    <View style={styles.tabContent}>
      {hotel.location ? (
        <>
          {hotel.location.distance_to_airport && (
            <View style={styles.locationItem}>
              <Ionicons name="airplane" size={24} color={Colors.light.tint} />
              <View style={styles.locationText}>
                <Text style={styles.locationTitle}>Distance to Airport</Text>
                <Text style={styles.locationValue}>{hotel.location.distance_to_airport}</Text>
              </View>
            </View>
          )}
          
          {hotel.location.distance_to_center && (
            <View style={styles.locationItem}>
              <Ionicons name="location" size={24} color={Colors.light.tint} />
              <View style={styles.locationText}>
                <Text style={styles.locationTitle}>Distance to City Center</Text>
                <Text style={styles.locationValue}>{hotel.location.distance_to_center}</Text>
              </View>
            </View>
          )}
          
          {hotel.location.nearby_attractions && hotel.location.nearby_attractions.length > 0 && (
            <View style={styles.attractionsSection}>
              <Text style={styles.attractionsTitle}>Nearby Attractions</Text>
              {hotel.location.nearby_attractions.map((attraction, index) => (
                <View key={index} style={styles.attractionItem}>
                  <Ionicons name="camera" size={20} color={Colors.light.tint} />
                  <Text style={styles.attractionText}>{attraction}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noDataText}>Location information not available</Text>
      )}
    </View>
  );

  const renderPolicies = () => (
    <View style={styles.tabContent}>
      {hotel.policies ? (
        <>
          {hotel.policies.check_in_time && (
            <View style={styles.policyItem}>
              <Ionicons name="time" size={24} color={Colors.light.tint} />
              <View style={styles.policyText}>
                <Text style={styles.policyTitle}>Check-in Time</Text>
                <Text style={styles.policyValue}>{hotel.policies.check_in_time}</Text>
              </View>
            </View>
          )}
          
          {hotel.policies.check_out_time && (
            <View style={styles.policyItem}>
              <Ionicons name="time-outline" size={24} color={Colors.light.tint} />
              <View style={styles.policyText}>
                <Text style={styles.policyTitle}>Check-out Time</Text>
                <Text style={styles.policyValue}>{hotel.policies.check_out_time}</Text>
              </View>
            </View>
          )}
          
          {hotel.policies.cancellation_policy && (
            <View style={styles.policyItem}>
              <Ionicons name="close-circle" size={24} color={Colors.light.tint} />
              <View style={styles.policyText}>
                <Text style={styles.policyTitle}>Cancellation Policy</Text>
                <Text style={styles.policyValue}>{hotel.policies.cancellation_policy}</Text>
              </View>
            </View>
          )}
          
          {hotel.policies.taxes && (
            <View style={styles.policyItem}>
              <Ionicons name="calculator" size={24} color={Colors.light.tint} />
              <View style={styles.policyText}>
                <Text style={styles.policyTitle}>Taxes</Text>
                <Text style={styles.policyValue}>{hotel.policies.taxes}</Text>
              </View>
            </View>
          )}
          
          {hotel.policies.fees && hotel.policies.fees.length > 0 && (
            <View style={styles.feesSection}>
              <Text style={styles.feesTitle}>Additional Fees</Text>
              {hotel.policies.fees.map((fee, index) => (
                <View key={index} style={styles.feeItem}>
                  <Ionicons name="card" size={20} color="#FF9500" />
                  <Text style={styles.feeText}>{fee}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noDataText}>Policy information not available</Text>
      )}
    </View>
  );

  const renderReviews = () => (
    <View style={styles.tabContent}>
      {hotel.reviews && hotel.reviews.length > 0 ? (
        <>
          {hotel.reviews.map((review, index) => (
            <View key={index} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.noDataText}>No reviews available</Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'images':
        return renderImages();
      case 'amenities':
        return renderAmenities();
      case 'location':
        return renderLocation();
      case 'policies':
        return renderPolicies();
      case 'reviews':
        return renderReviews();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hotel Details</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'images' && styles.activeTab]}
            onPress={() => setActiveTab('images')}
          >
            <Text style={[styles.tabText, activeTab === 'images' && styles.activeTabText]}>
              Images
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
            style={[styles.tab, activeTab === 'location' && styles.activeTab]}
            onPress={() => setActiveTab('location')}
          >
            <Text style={[styles.tabText, activeTab === 'location' && styles.activeTabText]}>
              Location
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'policies' && styles.activeTab]}
            onPress={() => setActiveTab('policies')}
          >
            <Text style={[styles.tabText, activeTab === 'policies' && styles.activeTabText]}>
              Policies
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
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
  ratingContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginRight: 10,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  mainImageContainer: {
    marginBottom: 20,
  },
  mainImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageCaption: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  thumbnailList: {
    marginBottom: 20,
  },
  thumbnailContainer: {
    marginRight: 15,
    alignItems: 'center',
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 8,
    padding: 2,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginBottom: 5,
  },
  thumbnailCaption: {
    fontSize: 12,
    color: Colors.light.text,
    textAlign: 'center',
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  amenityText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 10,
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locationText: {
    marginLeft: 15,
    flex: 1,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
  },
  locationValue: {
    fontSize: 16,
    color: Colors.light.text,
  },
  attractionsSection: {
    marginTop: 20,
  },
  attractionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  attractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  attractionText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 15,
    flex: 1,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  policyText: {
    marginLeft: 15,
    flex: 1,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
  },
  policyValue: {
    fontSize: 16,
    color: Colors.light.text,
  },
  feesSection: {
    marginTop: 20,
  },
  feesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  feeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  feeText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 15,
    flex: 1,
  },
  reviewItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  reviewComment: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
