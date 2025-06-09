import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { Community } from '../lib/types';
import { useAuth } from '../lib/auth';

export default function CommunitiesScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    try {
      const data = await api.getCommunities();
      setCommunities(data);
      setError(null);
    } catch (err) {
      setError('Failed to load communities. Please try again.');
      console.error('Error fetching communities:', err);
    }
  }, []);

  useEffect(() => {
    fetchCommunities().finally(() => setIsLoading(false));
  }, [fetchCommunities]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCommunities();
    setIsRefreshing(false);
  }, [fetchCommunities]);

  const handleJoinCommunity = useCallback(async (communityId: string) => {
    if (!user) {
      // TODO: Show sign in prompt
      return;
    }

    try {
      await api.joinCommunity(communityId);
      // Refresh communities to update member counts
      fetchCommunities();
    } catch (err) {
      console.error('Error joining community:', err);
      // TODO: Show error toast
    }
  }, [user, fetchCommunities]);

  const renderCommunityCard = ({ item }: { item: Community }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant="titleLarge">{item.name}</Text>
          <Button
            mode="contained"
            onPress={() => handleJoinCommunity(item.id)}
            style={styles.joinButton}
          >
            Join
          </Button>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium">{item._count?.members || 0} members</Text>
          </View>
        </View>

        {item.parent && (
          <View style={styles.parentCommunity}>
            <Text variant="bodyMedium" style={styles.parentLabel}>
              Part of: {item.parent.name}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

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
        <Button mode="contained" onPress={fetchCommunities} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={communities}
        renderItem={renderCommunityCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 4,
  },
  parentCommunity: {
    marginTop: 8,
  },
  parentLabel: {
    opacity: 0.7,
  },
  joinButton: {
    borderRadius: 20,
  },
  retryButton: {
    marginTop: 16,
  },
}); 