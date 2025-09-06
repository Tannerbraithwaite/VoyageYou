import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

type GlassCardProps = PropsWithChildren<
  ViewProps & {
    borderRadius?: number;
  }
>;

export default function GlassCard({
  children,
  style,
  borderRadius = 16,
  ...rest
}: GlassCardProps) {
  const commonStyle = [
    styles.card,
    {
      borderRadius,
    },
    style,
  ];

  if (Platform.OS === 'ios') {
    return (
      <BlurView tint="systemChromeMaterialDark" intensity={80} style={commonStyle} {...rest}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={commonStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
});


