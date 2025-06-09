import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import TakeFeed from '../components/TakeFeed';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search takes and communities..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          elevation={1}
        />
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
  searchBar: {
    margin: 16,
    borderRadius: 12,
  },
}); 