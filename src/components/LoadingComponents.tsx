// src/components/LoadingComponents.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type: 'text' | 'image' | 'card';
  lines?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type, 
  lines = 3 
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <View>
            {Array.from({ length: lines }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.skeletonText,
                  { 
                    opacity: pulseAnim,
                    width: index === lines - 1 ? '70%' : '100%'
                  }
                ]}
              />
            ))}
          </View>
        );
      case 'image':
        return (
          <Animated.View
            style={[styles.skeletonImage, { opacity: pulseAnim }]}
          />
        );
      case 'card':
        return (
          <View style={styles.skeletonCard}>
            <Animated.View
              style={[styles.skeletonImage, { opacity: pulseAnim, height: 150 }]}
            />
            <View style={styles.skeletonContent}>
              <Animated.View
                style={[styles.skeletonText, { opacity: pulseAnim, width: '80%' }]}
              />
              <Animated.View
                style={[styles.skeletonText, { opacity: pulseAnim, width: '60%' }]}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderSkeleton()}</View>;
};

interface AnalysisLoadingProps {
  progress: number;
  message: string;
}

export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({ 
  progress, 
  message 
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={['#6b46c1', '#8b5cf6']}
        style={styles.loadingGradient}
      >
        <Animated.View
          style={[
            styles.loadingIcon,
            {
              transform: [
                { rotate: rotation },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Ionicons name="sparkles" size={48} color="#fff" />
        </Animated.View>
        
        <Text style={styles.loadingTitle}>KI-Analyse läuft...</Text>
        <Text style={styles.loadingMessage}>{message}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  skeletonContent: {
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: width * 0.8,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
});