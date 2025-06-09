import React from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Card, Text, Button, Avatar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Take } from '../lib/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

interface SwipeableTakeCardProps {
  take: Take;
  onVote: (takeId: string, type: 'UP' | 'DOWN') => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
}

export default function SwipeableTakeCard({
  take,
  onVote,
  onNext,
  onPrevious,
  hasPrevious,
}: SwipeableTakeCardProps) {
  const theme = useTheme();
  const position = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gesture) => {
      position.setValue({ x: gesture.dx, y: 0 });
    },
    onPanResponderRelease: (event, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD && hasPrevious) {
        forceSwipe('right');
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        forceSwipe('left');
      } else {
        resetPosition();
      }
    },
  });

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    position.setValue({ x: 0, y: 0 });
    if (direction === 'right') {
      onPrevious();
    } else {
      onNext();
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-30deg', '0deg', '30deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  const formatTimeAgo = (date: string) => {
    // TODO: Implement proper time formatting
    return 'Just now';
  };

  return (
    <Animated.View
      style={[styles.container, getCardStyle()]}
      {...panResponder.panHandlers}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.authorInfo}>
              <Avatar.Text
                size={40}
                label={take.author.name?.[0] || 'U'}
                style={styles.avatar}
              />
              <View style={styles.authorText}>
                <Text variant="titleMedium">{take.author.name}</Text>
                <View style={styles.subHeader}>
                  <Text variant="bodySmall">@{take.author.username}</Text>
                  <Text variant="bodySmall"> • </Text>
                  <Text variant="bodySmall">{formatTimeAgo(take.createdAt)}</Text>
                </View>
              </View>
            </View>
            {take.author.verified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </View>

          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.title}>
              {take.title}
            </Text>
            {take.content && (
              <Text variant="bodyLarge" style={styles.bodyText}>
                {take.content}
              </Text>
            )}
          </View>

          <View style={styles.communityInfo}>
            <Text variant="bodyMedium">
              in {take.community.name}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => onVote(take.id, 'UP')}
              icon="thumb-up"
            >
              {take.votes.filter(v => v.type === 'UP').length}
            </Button>
            <Button
              mode="outlined"
              onPress={() => onVote(take.id, 'DOWN')}
              icon="thumb-down"
            >
              {take.votes.filter(v => v.type === 'DOWN').length}
            </Button>
            <Button
              mode="outlined"
              icon="comment"
            >
              {take._count.comments}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    flex: 1,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  authorText: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  bodyText: {
    marginBottom: 16,
  },
  communityInfo: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
}); 