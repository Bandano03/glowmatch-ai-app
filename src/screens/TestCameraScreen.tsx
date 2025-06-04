// src/screens/TestCameraScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useCamera } from '../hooks/useCamera';
import { Ionicons } from '@expo/vector-icons';

export default function TestCameraScreen() {
  const { 
    isLoading, 
    error, 
    lastImage, 
    selectImage, 
    clearError, 
    clearImage 
  } = useCamera();

  const handleTestCamera = async () => {
    const result = await selectImage();
    if (result.success) {
      Alert.alert('Erfolg', 'Bild erfolgreich aufgenommen!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Camera Service Test</Text>

      {/* Fehleranzeige */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleTestCamera}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.buttonText}>Foto aufnehmen</Text>
            </>
          )}
        </TouchableOpacity>

        {lastImage && (
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={clearImage}
          >
            <Text style={styles.buttonText}>Bild löschen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bildvorschau */}
      {lastImage?.uri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageTitle}>Aufgenommenes Bild:</Text>
          <Image 
            source={{ uri: lastImage.uri }} 
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.imageInfo}>
            Größe: {lastImage.width} x {lastImage.height}
          </Text>
          {lastImage.base64 && (
            <Text style={styles.imageInfo}>
              Base64 Länge: {lastImage.base64.length} Zeichen
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 50,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    flex: 1,
  },
  errorDismiss: {
    fontSize: 20,
    color: '#c62828',
    padding: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSecondary: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});