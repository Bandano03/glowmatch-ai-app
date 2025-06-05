// src/components/GlassComponents.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  style?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  intensity = 20, 
  style 
}) => (
  <View style={[styles.glassCardContainer, style]}>
    <BlurView intensity={intensity} style={styles.glassCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
        style={styles.glassGradient}
      >
        {children}
      </LinearGradient>
    </BlurView>
  </View>
);

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  gradient?: string[];
  icon?: string;
  style?: any;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  gradient = ['#6b46c1', '#8b5cf6'],
  icon,
  style
}) => (
  <TouchableOpacity onPress={onPress} style={[styles.modernButtonContainer, style]}>
    <LinearGradient colors={gradient} style={styles.modernButton}>
      <View style={styles.buttonContent}>
        {icon && <Ionicons name={icon as any} size={20} color="#fff" style={styles.buttonIcon} />}
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

interface FloatingCardProps {
  children: React.ReactNode;
  elevated?: boolean;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({ 
  children, 
  elevated = true 
}) => (
  <View style={[styles.floatingCard, elevated && styles.elevated]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  glassCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glassCard: {
    borderRadius: 20,
  },
  glassGradient: {
    padding: 20,
    borderRadius: 20,
  },
  modernButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
  },
  elevated: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
});