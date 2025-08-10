import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TravelChatbot } from '@/components';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <TravelChatbot userId={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});

