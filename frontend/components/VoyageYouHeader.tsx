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
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
