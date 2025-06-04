import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.title}>Loading...</Text>
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
    fontSize: 18,
    marginTop: 20,
  },
});