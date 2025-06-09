import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import SwipeableTakeCard from './SwipeableTakeCard';
import { Take } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface TakeFeedProps {
  communitySlug?: string;
}

export default function TakeFeed({ communitySlug }: TakeFeedProps) {
  const { user } = useAuth();
  const [takes, setTakes] = useState<Take[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTakes = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedTakes = await api.getTakes(communitySlug);
      setTakes(fetchedTakes);
      setCurrentIndex(0);
      setError(null);
    } catch (err) {
      setError('Failed to load takes. Please try again.');
      console.error('Error fetching takes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [communitySlug]);

  useEffect(() => {
    fetchTakes();
  }, [fetchTakes]);

  const handleVote = useCallback(async (takeId: string, type: 'UP' | 'DOWN') => {
    if (!user) {
      // TODO: Show sign in prompt
      return;
    }

    try {
      await api.voteTake(takeId, type);
      // Refresh takes to get updated vote counts
      fetchTakes();
    } catch (err) {
      console.error('Error voting:', err);
      // TODO: Show error toast
    }
  }, [user, fetchTakes]);

  const handleNext = useCallback(() => {
    if (currentIndex < takes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, takes.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

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
        <Text>{error}</Text>
      </View>
    );
  }

  if (!takes.length) {
    return (
      <View style={styles.centerContainer}>
        <Text>No takes available. Check back later!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {takes[currentIndex] && (
        <SwipeableTakeCard
          take={takes[currentIndex]}
          onVote={handleVote}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasPrevious={currentIndex > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 