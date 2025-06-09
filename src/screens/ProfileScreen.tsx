import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Button, Card, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock user data
const MOCK_USER = {
  name: 'John Doe',
  username: '@johndoe',
  bio: 'Passionate about technology and culture',
  verified: true,
  stats: {
    takes: 42,
    communities: 15,
    followers: 128,
    following: 89,
  },
};

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={MOCK_USER.name[0]}
            style={styles.avatar}
          />
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text variant="headlineSmall" style={styles.name}>
                {MOCK_USER.name}
              </Text>
              {MOCK_USER.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={24}
                  color={theme.colors.primary}
                />
              )}
            </View>
            <Text variant="bodyLarge" style={styles.username}>
              {MOCK_USER.username}
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.bio}>
            {MOCK_USER.bio}
          </Text>
          <Button
            mode="contained"
            style={styles.editButton}
            onPress={() => {}}
          >
            Edit Profile
          </Button>
        </View>

        <Divider />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="headlineMedium">{MOCK_USER.stats.takes}</Text>
                <Text variant="bodyMedium">Takes</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="headlineMedium">{MOCK_USER.stats.communities}</Text>
                <Text variant="bodyMedium">Communities</Text>
              </Card.Content>
            </Card>
          </View>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="headlineMedium">{MOCK_USER.stats.followers}</Text>
                <Text variant="bodyMedium">Followers</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="headlineMedium">{MOCK_USER.stats.following}</Text>
                <Text variant="bodyMedium">Following</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="cog"
            style={styles.actionButton}
            onPress={() => {}}
          >
            Settings
          </Button>
          <Button
            mode="outlined"
            icon="help-circle"
            style={styles.actionButton}
            onPress={() => {}}
          >
            Help
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontWeight: 'bold',
  },
  username: {
    opacity: 0.7,
  },
  bio: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  editButton: {
    borderRadius: 20,
    paddingHorizontal: 24,
  },
  statsContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
}); 