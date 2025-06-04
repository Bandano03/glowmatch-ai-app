import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export function AuthScreen() {
  const handleMockLogin = () => {
    Alert.alert('Info', 'Mock-Login wird in Phase 3 implementiert!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GlowMatch AI</Text>
      <Text style={styles.subtitle}>Deine persönliche Beauty-KI</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleMockLogin}>
        <Text style={styles.buttonText}>Anmelden (Demo)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleMockLogin}>
        <Text style={styles.buttonText}>Registrieren (Demo)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6b46c1',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});