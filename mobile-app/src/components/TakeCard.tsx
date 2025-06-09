import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Button } from 'react-native-paper';
import { Take } from '../types';

interface TakeCardProps {
  take: Take;
  onUpvote?: () => void;
  onDownvote?: () => void;
}

export default function TakeCard({ take, onUpvote, onDownvote }: TakeCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Title
        title={take.author.name}
        subtitle={`@${take.author.username}`}
        left={(props) => (
          <Avatar.Image
            {...props}
            source={{ uri: take.author.image || 'https://ui-avatars.com/api/?name=' + take.author.name }}
          />
        )}
      />
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>{take.title}</Text>
        <Text variant="bodyMedium">{take.content}</Text>
        <View style={styles.communityInfo}>
          <Text variant="labelMedium">in {take.community.name}</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={onUpvote}>👍 {take._count?.upvotes || 0}</Button>
        <Button onPress={onDownvote}>👎 {take._count?.downvotes || 0}</Button>
        <Button>💬 {take._count?.comments || 0}</Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    marginBottom: 8,
  },
  communityInfo: {
    marginTop: 8,
  },
}); 