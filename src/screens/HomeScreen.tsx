import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import TakeFeed from '../components/TakeFeed';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TakeFeed />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
}); 