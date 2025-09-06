import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HotelDetailsWidget from './HotelDetailsWidget';
import FlightDetailsWidget from './FlightDetailsWidget';

const { width, height } = Dimensions.get('window');

interface DetailsModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'hotel' | 'flight';
  data: any;
}

export default function DetailsModal({ visible, onClose, type, data }: DetailsModalProps) {
  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {type === 'hotel' && (
          <HotelDetailsWidget
            hotel={data}
            onClose={onClose}
          />
        )}
        
        {type === 'flight' && (
          <FlightDetailsWidget
            flight={data}
            onClose={onClose}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
