import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { FlightDetailsWidget } from './FlightDetailsWidget';
import { HotelDetailsWidget } from './HotelDetailsWidget';

const { width, height } = Dimensions.get('window');

interface DetailsModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'flight' | 'hotel';
  data: any;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  visible,
  onClose,
  type,
  data,
}) => {
  const renderContent = () => {
    if (type === 'flight') {
      return <FlightDetailsWidget flight={data} onClose={onClose} />;
    } else if (type === 'hotel') {
      return <HotelDetailsWidget hotel={data} onClose={onClose} />;
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
