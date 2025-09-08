import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface VoyageYouHeaderProps {
  style?: any;
}

export default function VoyageYouHeader({ style }: VoyageYouHeaderProps) {
  const colorScheme = useColorScheme();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.brandText, { color: Colors[colorScheme ?? 'light'].text }]}>
        VoyageYou
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 1, // Lower z-index so it doesn't block interactive elements
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none', // Allow touches to pass through
  },
  brandText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
