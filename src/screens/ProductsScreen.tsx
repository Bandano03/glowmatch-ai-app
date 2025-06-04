import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProductsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products Screen</Text>
      <Text>Product recommendations coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});