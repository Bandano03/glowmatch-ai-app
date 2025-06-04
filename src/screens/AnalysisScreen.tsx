import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../App';

export function AnalysisScreen() {
  const { user } = useContext(UserContext);
  const [step, setStep] = useState('choice');
  const [analysisType, setAnalysisType] = useState('skin');
  const [inputMethod, setInputMethod] = useState('');
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisTypes = [
    {
      id: 'skin',
      title: 'Hautanalyse',
      description: 'KI-Analyse deiner Gesichtshaut',
      icon: '✨',
      features: ['Hauttyp-Bestimmung', 'Feuchtigkeits-Level', 'Porengröße-Analyse']
    },
    {
      id: 'hair',
      title: 'Haaranalyse',
      description: 'Struktur und Gesundheit deiner Haare',
      icon: '💇‍♀️',
      features: ['Haartyp-Erkennung', 'Dichte-Messung', 'Glanz & Gesundheit']
    },
    {
      id: 'combined',
      title: 'Komplettanalyse',
      description: 'Vollständige Analyse von Haut und Haaren',
      icon: '🌟',
      features: ['Haut + Haar', 'Ganzheitliche Beratung', 'Premium Empfehlungen'],
      premium: true
    }
  ];

  const inputMethods = [
    {
      id: 'camera',
      title: 'Live-Kamera',
      description: 'Verwende deine Kamera für eine Live-Analyse',
      icon: 'camera'
    },
    {
      id: 'upload',
      title: 'Bild hochladen',
      description: 'Wähle ein vorhandenes Bild aus deiner Galerie',
      icon: 'image'
    }
  ];

  const mockAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockResults = {
      analysisType,
      skinAnalysis: analysisType === 'skin' || analysisType === 'combined' ? {
        skinType: ['Normal', 'Trocken', 'Fettig', 'Mischhaut', 'Sensibel'][Math.floor(Math.random() * 5)],
        hydration: Math.floor(Math.random() * 5) + 1,
        elasticity: Math.floor(Math.random() * 5) + 1,
        evenness: Math.floor(Math.random() * 5) + 1,
        poreSize: Math.floor(Math.random() * 5) + 1,
        score: Math.floor(Math.random() * 40) + 60,
        recommendations: [
          'Sanfte Reinigung morgens und abends',
          'Feuchtigkeitscreme mit Hyaluronsäure',
          'Vitamin C Serum für Strahlkraft',
          'Sonnenschutz LSF 30+ täglich'
        ]
      } : null,
      hairAnalysis: analysisType === 'hair' || analysisType === 'combined' ? {
        hairType: ['Glatt', 'Wellig', 'Lockig', 'Kraus'][Math.floor(Math.random() * 4)],
        hairDensity: ['Dünn', 'Normal', 'Dick'][Math.floor(Math.random() * 3)],
        shineLevel: Math.floor(Math.random() * 5) + 1,
        healthScore: Math.floor(Math.random() * 30) + 70,
        recommendations: [
          'Feuchtigkeitsspendendes Shampoo',
          'Protein-reiches Conditioner',
          'Leave-in Behandlung für Spitzen',
          'Hitzeschutz vor Styling'
        ]
      } : null,
      timestamp: new Date().toISOString()
    };

    setResults(mockResults);
    setStep('results');
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = () => {
    if (inputMethod === 'camera') {
      Alert.alert(
        'Kamera-Zugriff',
        'In der echten App würde jetzt die Kamera geöffnet werden.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Simulieren', onPress: mockAnalysis }
        ]
      );
    } else {
      Alert.alert(
        'Bild hochladen',
        'In der echten App würde jetzt die Galerie geöffnet werden.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Simulieren', onPress: mockAnalysis }
        ]
      );
    }
  };

  const resetAnalysis = () => {
    setStep('choice');
    setAnalysisType('skin');
    setInputMethod('');
    setResults(null);
  };

  const saveAnalysis = () => {
    Alert.alert('Erfolg!', 'Analyse wurde erfolgreich gespeichert! ✨');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b46c1" />
        <Text style={styles.loadingTitle}>KI-Analyse läuft...</Text>
        <Text style={styles.loadingSubtitle}>Bitte warten Sie einen Moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beauty-Analyse</Text>
        <Text style={styles.headerSubtitle}>Entdecke deinen einzigartigen Beauty-Typ mit KI-Technologie</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'choice' && (
          <View style={styles.analysisCard}>
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Was möchtest du analysieren?</Text>
              
              <View style={styles.optionsGrid}>
                {analysisTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionCard,
                      analysisType === type.id && styles.optionCardSelected,
                      type.premium && !user?.isPremium && styles.optionCardDisabled
                    ]}
                    onPress={() => {
                      if (type.premium && !user?.isPremium) {
                        Alert.alert('Premium Feature', 'Diese Funktion ist nur für Premium-Nutzer verfügbar.');
                        return;
                      }
                      setAnalysisType(type.id);
                    }}
                    disabled={type.premium && !user?.isPremium}
                  >
                    <Text style={styles.optionIcon}>{type.icon}</Text>
                    <View style={styles.optionHeader}>
                      <Text style={styles.optionTitle}>{type.title}</Text>
                      {type.premium && <Ionicons name="crown" size={16} color="#6b46c1" />}
                    </View>
                    <Text style={styles.optionDescription}>{type.description}</Text>
                    <View style={styles.featuresList}>
                      {type.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {type.premium && !user?.isPremium && (
                      <View style={styles.premiumOverlay}>
                        <Ionicons name="lock-closed" size={32} color="#6b7280" />
                        <Text style={styles.premiumOverlayText}>Premium Feature</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {analysisType && (
              <View style={styles.stepSection}>
                <Text style={styles.stepTitle}>Wie möchtest du das Bild aufnehmen?</Text>
                
                <View style={styles.inputMethodsGrid}>
                  {inputMethods.map(method => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.inputMethodCard,
                        inputMethod === method.id && styles.inputMethodCardSelected
                      ]}
                      onPress={() => setInputMethod(method.id)}
                    >
                      <View style={styles.inputMethodIcon}>
                        <Ionicons name={method.icon} size={32} color="#6b46c1" />
                      </View>
                      <Text style={styles.inputMethodTitle}>{method.title}</Text>
                      <Text style={styles.inputMethodDescription}>{method.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {analysisType && inputMethod && (
              <View style={styles.stepSection}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleAnalysisStart}
                >
                  <Text style={styles.startButtonText}>Analyse starten</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {step === 'results' && results && (
          <View style={styles.analysisCard}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Analyse abgeschlossen ✨</Text>
              <Text style={styles.resultsSubtitle}>Hier sind deine personalisierten Ergebnisse</Text>
            </View>

            {results.skinAnalysis && (
              <View style={styles.resultSection}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultSectionTitle}>✨ Hautanalyse</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreText, { color: getScoreColor(results.skinAnalysis.score) }]}>
                      {results.skinAnalysis.score}
                    </Text>
                    <Text style={styles.scoreMax}>/100</Text>
                    <Ionicons name="star" size={20} color="#fbbf24" />
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Hauttyp</Text>
                    <Text style={styles.metricValue}>{results.skinAnalysis.skinType}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Feuchtigkeit</Text>
                    <Text style={styles.metricValue}>{results.skinAnalysis.hydration}/5</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Elastizität</Text>
                    <Text style={styles.metricValue}>{results.skinAnalysis.elasticity}/5</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Ebenmäßigkeit</Text>
                    <Text style={styles.metricValue}>{results.skinAnalysis.evenness}/5</Text>
                  </View>
                </View>

                <View style={styles.recommendationsCard}>
                  <Text style={styles.recommendationsTitle}>✨ Hautpflege-Empfehlungen</Text>
                  {results.skinAnalysis.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {results.hairAnalysis && (
              <View style={styles.resultSection}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultSectionTitle}>💇‍♀️ Haaranalyse</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreText, { color: getScoreColor(results.hairAnalysis.healthScore) }]}>
                      {results.hairAnalysis.healthScore}
                    </Text>
                    <Text style={styles.scoreMax}>/100</Text>
                    <Ionicons name="star" size={20} color="#fbbf24" />
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Haartyp</Text>
                    <Text style={styles.metricValue}>{results.hairAnalysis.hairType}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Dichte</Text>
                    <Text style={styles.metricValue}>{results.hairAnalysis.hairDensity}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Glanz</Text>
                    <Text style={styles.metricValue}>{results.hairAnalysis.shineLevel}/5</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Gesundheit</Text>
                    <Text style={styles.metricValue}>{Math.round(results.hairAnalysis.healthScore/20)}/5</Text>
                  </View>
                </View>

                <View style={styles.recommendationsCard}>
                  <Text style={styles.recommendationsTitle}>🌿 Haarpflege-Empfehlungen</Text>
                  {results.hairAnalysis.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetAnalysis}>
                <Text style={styles.secondaryButtonText}>Neue Analyse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveAnalysis}>
                <Ionicons name="archive" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Analyse speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stepSection: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#6b46c1',
    backgroundColor: '#faf5ff',
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresList: {
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  inputMethodsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  inputMethodCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  inputMethodCardSelected: {
    borderColor: '#6b46c1',
    backgroundColor: '#faf5ff',
  },
  inputMethodIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputMethodDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#6b46c1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultSection: {
    marginBottom: 32,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 16,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  recommendationsCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});