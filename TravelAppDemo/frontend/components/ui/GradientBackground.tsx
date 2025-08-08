import React, { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientBackgroundProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
}>;

export default function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={["#0a0a0a", "#111827", "#0b1020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, styles.gradient, style as any]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    zIndex: -1,
  },
});


