import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import TakeCard from '../components/TakeCard';
import { Take } from '../types';
import { fetchTakes, voteTake } from '../lib/api';

export default function HomeScreen() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTakes = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const fetchedTakes = await fetchTakes();
      setTakes(fetchedTakes);
      setError(null);
    } catch (err) {
      setError('Error loading takes. Please try again.');
      console.error('Error getting takes:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTakes();
  }, []);

  const handleVote = async (takeId: string, voteType: 'UP' | 'DOWN') => {
    try {
      await voteTake(takeId, voteType);
      // Refresh takes after voting
      loadTakes();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={takes}
        renderItem={({ item }) => (
          <TakeCard
            take={item}
            onUpvote={() => handleVote(item.id, 'UP')}
            onDownvote={() => handleVote(item.id, 'DOWN')}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadTakes(true)}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
}); 