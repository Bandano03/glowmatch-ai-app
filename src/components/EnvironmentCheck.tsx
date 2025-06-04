// src/components/EnvironmentCheck.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ENV } from '../config/environment';
import { AnalysisService } from '../services/analysisService';

export function EnvironmentCheck() {
  const [status, setStatus] = useState({
    apiKey: false,
    apiConnection: false,
    isDemo: true
  });

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    const hasValidKey = ENV.OPENAI_API_KEY && 
                       ENV.OPENAI_API_KEY !== 'sk-proj-IhrOpenAIKeyHier' &&
                       ENV.OPENAI_API_KEY.startsWith('sk-');
    
    let apiWorks = false;
    if (hasValidKey) {
      apiWorks = await AnalysisService.testConnection();
    }

    setStatus({
      apiKey: hasValidKey,
      apiConnection: apiWorks,
      isDemo: !hasValidKey || !apiWorks
    });
  };

  if (status.isDemo) {
    return (
      <View style={styles.container}>
        <Text style={styles.demoText}>
          🎮 Demo-Modus aktiv (Keine echte KI-Analyse)
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  demoText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },
});