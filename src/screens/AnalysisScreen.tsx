// src/screens/AnalysisScreen.tsx

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Progress from 'react-native-progress';

// Services & Hooks
import { useCamera } from '../hooks/useCamera';
import { AnalysisService } from '../services/analysisService';
import { UserContext } from '../../App';

// Types
import { 
  SkinAnalysisResult, 
  HairAnalysisResult, 
  AnalysisType 
} from '../types/analysis.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Komponente für Analyse-Auswahl
const AnalysisTypeCard = ({ 
  title, 
  icon, 
  gradient, 
  onPress, 
  description 
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.analysisCard}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={gradient}
      style={styles.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardContent}>
        <Ionicons name={icon} size={40} color="#1f2937" />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// Hauptkomponente
export function AnalysisScreen() {
  const { user, premiumTier } = useContext(UserContext);
  const { selectImage, isLoading: cameraLoading } = useCamera();
  
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [results, setResults] = useState<SkinAnalysisResult | HairAnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    // Hier würden Sie normalerweise aus der Datenbank laden
    // Für Demo: Fake History
    setAnalysisHistory([
      {
        id: '1',
        type: 'skin',
        date: new Date(Date.now() - 86400000), // Gestern
        result: { skinType: 'Normal' }
      },
      {
        id: '2',
        type: 'hair',
        date: new Date(Date.now() - 172800000), // Vorgestern
        result: { hairType: '2B' }
      }
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalysisHistory();
    setRefreshing(false);
  };

  const handleAnalysisSelect = async (type: AnalysisType) => {
    // Premium Check
    if (premiumTier === 'basic' && analysisHistory && analysisHistory.length >= 3) {
      Alert.alert(
        'Premium erforderlich',
        'Als Basic-Nutzer können Sie nur 3 Analysen pro Monat durchführen. Upgraden Sie auf Premium für unbegrenzte Analysen!',
        [
          { text: 'Später', style: 'cancel' },
          { text: 'Premium werden', onPress: () => console.log('Navigate to Premium') }
        ]
      );
      return;
    }

    setSelectedType(type);
    
    // Bild aufnehmen
    const imageResult = await selectImage();
    
    if (imageResult.success && imageResult.base64) {
      await performAnalysis(imageResult.base64, type);
    }
  };

  const performAnalysis = async (imageBase64: string, type: AnalysisType) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simuliere Fortschritt
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 0.9) return prev;
        return prev + 0.1;
      });
    }, 500);

    try {
      // KI-Analyse durchführen
      console.log('🤖 Starte KI-Analyse...');
      const analysisResult = await AnalysisService.analyze(imageBase64, type);
      
      clearInterval(progressInterval);
      setAnalysisProgress(1);
      
      if (analysisResult.success && analysisResult.data) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResults(analysisResult.data);
        
        // Zur History hinzufügen
        const newHistoryItem = {
          id: Date.now().toString(),
          type,
          date: new Date(),
          result: analysisResult.data
        };
        setAnalysisHistory(prev => [newHistoryItem, ...(prev || [])]);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setShowResults(true);
        }, 500);
      } else {
        throw new Error(analysisResult.error?.message || 'Analyse fehlgeschlagen');
      }
      
    } catch (error) {
      clearInterval(progressInterval);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Analysefehler',
        'Die Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.',
        [{ text: 'OK' }]
      );
      setIsAnalyzing(false);
    }
  };

  const renderAnalyzingModal = () => (
    <Modal
      visible={isAnalyzing}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.analyzingOverlay}>
        <View style={styles.analyzingContainer}>
          <LinearGradient
            colors={['#fdf2f8', '#fce7f3']}
            style={styles.analyzingGradient}
          >
            <View style={styles.analyzingContent}>
              <Ionicons name="sparkles" size={48} color="#ec4899" />
              <Text style={styles.analyzingTitle}>
                KI-Analyse läuft...
              </Text>
              <View style={styles.progressContainer}>
                <Progress.Bar
                  progress={analysisProgress}
                  width={screenWidth * 0.7}
                  height={8}
                  color="#ec4899"
                  borderWidth={0}
                  borderRadius={4}
                />
                <Text style={styles.progressText}>
                  {Math.round(analysisProgress * 100)}%
                </Text>
              </View>
              <Text style={styles.analyzingSubtext}>
                {analysisProgress < 0.3 && 'Bild wird verarbeitet...'}
                {analysisProgress >= 0.3 && analysisProgress < 0.6 && 'KI analysiert Merkmale...'}
                {analysisProgress >= 0.6 && analysisProgress < 0.9 && 'Erstelle Empfehlungen...'}
                {analysisProgress >= 0.9 && 'Fast fertig...'}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const renderResultsModal = () => {
    if (!results || !selectedType) return null;

    const isSkinResult = selectedType === 'skin';
    const skinResult = results as SkinAnalysisResult;
    const hairResult = results as HairAnalysisResult;

    return (
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResults(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#fdf2f8', '#fce7f3']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>
              {isSkinResult ? 'Hautanalyse' : 'Haaranalyse'} Ergebnisse
            </Text>
            <TouchableOpacity 
              onPress={() => setShowResults(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.resultsContent}>
            {/* Hauptergebnis */}
            <View style={styles.resultSection}>
              <LinearGradient
                colors={isSkinResult ? ['#e0f2f1', '#b2dfdb'] : ['#fff3e0', '#ffcc80']}
                style={styles.resultSectionGradient}
              >
                <Text style={styles.resultSectionTitle}>
                  {isSkinResult ? 'Ihr Hauttyp' : 'Ihr Haartyp'}
                </Text>
                <View style={styles.resultBox}>
                  <Text style={styles.resultMainText}>
                    {isSkinResult ? (skinResult.skinType || 'Normal') : (hairResult.hairType || '2B')}
                  </Text>
                  <Text style={styles.resultSubText}>
                    {isSkinResult 
                      ? `Textur: ${skinResult.texture || 'Glatt'}` 
                      : `${hairResult.structure || 'Wellig'} • ${hairResult.thickness || 'Normal'}`
                    }
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Metriken */}
            <View style={styles.resultSection}>
              <LinearGradient
                colors={['#e8f5e8', '#c8e6c9']}
                style={styles.resultSectionGradient}
              >
                <Text style={styles.resultSectionTitle}>Detailanalyse</Text>
                <View style={styles.metricsContainer}>
                  {isSkinResult ? (
                    <>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Hydration</Text>
                        <Progress.Circle
                          size={80}
                          progress={(skinResult.hydration || 0) / 100}
                          showsText={true}
                          formatText={() => `${skinResult.hydration || 0}%`}
                          color="#10b981"
                          borderWidth={0}
                          thickness={8}
                        />
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Öligkeit</Text>
                        <Progress.Circle
                          size={80}
                          progress={(skinResult.oiliness || 0) / 100}
                          showsText={true}
                          formatText={() => `${skinResult.oiliness || 0}%`}
                          color="#f59e0b"
                          borderWidth={0}
                          thickness={8}
                        />
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Sensitivität</Text>
                        <Progress.Circle
                          size={80}
                          progress={(skinResult.sensitivity || 0) / 100}
                          showsText={true}
                          formatText={() => `${skinResult.sensitivity || 0}%`}
                          color="#ef4444"
                          borderWidth={0}
                          thickness={8}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Schädigung</Text>
                        <Progress.Circle
                          size={80}
                          progress={(hairResult.damage || 0) / 100}
                          showsText={true}
                          formatText={() => `${hairResult.damage || 0}%`}
                          color="#ef4444"
                          borderWidth={0}
                          thickness={8}
                        />
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Porosität</Text>
                        <View style={styles.textMetric}>
                          <Text style={styles.textMetricValue}>{hairResult.porosity || 'Normal'}</Text>
                        </View>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Kopfhaut</Text>
                        <View style={styles.textMetric}>
                          <Text style={styles.textMetricValue}>{hairResult.scalp || 'Normal'}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* Probleme */}
            <View style={styles.resultSection}>
              <LinearGradient
                colors={['#fff8e1', '#ffecb3']}
                style={styles.resultSectionGradient}
              >
                <Text style={styles.resultSectionTitle}>Erkannte Probleme</Text>
                <View style={styles.concernsContainer}>
                  {((isSkinResult ? skinResult.concerns : hairResult.concerns) || []).map((concern, index) => (
                    <View key={index} style={styles.concernChip}>
                      <Text style={styles.concernText}>{concern}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>

            {/* Empfehlungen */}
            <View style={styles.resultSection}>
              <LinearGradient
                colors={['#e8eaf6', '#c5cae9']}
                style={styles.resultSectionGradient}
              >
                <Text style={styles.resultSectionTitle}>Ihre persönliche Routine</Text>
                
                {isSkinResult ? (
                  <>
                    <View style={styles.routineSection}>
                      <View style={styles.routineHeader}>
                        <Ionicons name="sunny" size={24} color="#ffb74d" />
                        <Text style={styles.routineTitle}>Morgenroutine</Text>
                      </View>
                      {(skinResult.recommendations?.morning || []).map((step, index) => (
                        <View key={index} style={styles.routineStep}>
                          <Text style={styles.stepNumber}>{index + 1}.</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.routineSection}>
                      <View style={styles.routineHeader}>
                        <Ionicons name="moon" size={24} color="#7986cb" />
                        <Text style={styles.routineTitle}>Abendroutine</Text>
                      </View>
                      {(skinResult.recommendations?.evening || []).map((step, index) => (
                        <View key={index} style={styles.routineStep}>
                          <Text style={styles.stepNumber}>{index + 1}.</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.routineSection}>
                      <View style={styles.routineHeader}>
                        <Ionicons name="calendar" size={24} color="#66bb6a" />
                        <Text style={styles.routineTitle}>Wöchentliche Treatments</Text>
                      </View>
                      {(skinResult.recommendations?.weekly || []).map((step, index) => (
                        <View key={index} style={styles.routineStep}>
                          <Text style={styles.stepNumber}>•</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.routineSection}>
                      <View style={styles.routineHeader}>
                        <Ionicons name="basket" size={24} color="#66bb6a" />
                        <Text style={styles.routineTitle}>Empfohlene Produkte</Text>
                      </View>
                      {(hairResult.recommendations?.products || []).map((product, index) => (
                        <View key={index} style={styles.routineStep}>
                          <Text style={styles.stepNumber}>•</Text>
                          <Text style={styles.stepText}>{product}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.routineSection}>
                      <View style={styles.routineHeader}>
                        <Ionicons name="medical" size={24} color="#e57373" />
                        <Text style={styles.routineTitle}>Treatments</Text>
                      </View>
                      {(hairResult.recommendations?.treatments || []).map((treatment, index) => (
                        <View key={index} style={styles.routineStep}>
                          <Text style={styles.stepNumber}>•</Text>
                          <Text style={styles.stepText}>{treatment}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.routineSection}>
                      <View style={styles.routineHeader}>
                        <Ionicons name="brush" size={24} color="#ffb74d" />
                        <Text style={styles.routineTitle}>Styling-Tipps</Text>
                      </View>
                      {(hairResult.recommendations?.styling || []).map((tip, index) => (
                        <View key={index} style={styles.routineStep}>
                          <Text style={styles.stepNumber}>•</Text>
                          <Text style={styles.stepText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </LinearGradient>
            </View>

            {/* Inhaltsstoffe */}
            <View style={styles.resultSection}>
              <LinearGradient
                colors={['#f3e5f5', '#e1bee7']}
                style={styles.resultSectionGradient}
              >
                <Text style={styles.resultSectionTitle}>Inhaltsstoffe</Text>
                
                <View style={styles.ingredientsSection}>
                  <Text style={styles.ingredientsLabel}>
                    <Ionicons name="checkmark-circle" size={20} color="#66bb6a" /> 
                    {' '}Empfohlen
                  </Text>
                  <View style={styles.ingredientsGrid}>
                    {((isSkinResult ? skinResult.ingredients?.recommended : hairResult.ingredients?.recommended) || []).map((ing, index) => (
                      <View key={index} style={styles.ingredientChipGood}>
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.ingredientsSection}>
                  <Text style={styles.ingredientsLabel}>
                    <Ionicons name="close-circle" size={20} color="#e57373" /> 
                    {' '}Vermeiden
                  </Text>
                  <View style={styles.ingredientsGrid}>
                    {((isSkinResult ? skinResult.ingredients?.avoid : hairResult.ingredients?.avoid) || []).map((ing, index) => (
                      <View key={index} style={styles.ingredientChipBad}>
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Konfidenz */}
            <View style={styles.confidenceSection}>
              <Text style={styles.confidenceText}>
                Analyse-Konfidenz: {results.confidence || 0}%
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => {
                Alert.alert('Gespeichert!', 'Die Analyse wurde gespeichert.');
                setShowResults(false);
              }}
            >
              <LinearGradient
                colors={['#ec4899', '#f472b6']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Analyse speichern</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
          />
        }
      >
        <LinearGradient
          colors={['#fdf2f8', '#fce7f3']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Beauty-Analyse</Text>
          <Text style={styles.headerSubtitle}>
            Entdecken Sie Ihre perfekte Pflegeroutine mit KI
          </Text>
        </LinearGradient>

        <View style={styles.analysisOptions}>
          <AnalysisTypeCard
            title="Hautanalyse"
            icon="scan"
            gradient={['#e0f2f1', '#b2dfdb']}
            description="Hauttyp, Zustand & personalisierte Pflege"
            onPress={() => handleAnalysisSelect('skin')}
          />
          
          <AnalysisTypeCard
            title="Haaranalyse"
            icon="cut"
            gradient={['#fff3e0', '#ffcc80']}
            description="Haartyp, Struktur & optimale Pflege"
            onPress={() => handleAnalysisSelect('hair')}
          />
        </View>

        {/* Analyse Historie */}
        {analysisHistory && analysisHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Letzte Analysen</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.historyScroll}
            >
              {(analysisHistory || []).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => {
                    setResults(item.result);
                    setSelectedType(item.type);
                    setShowResults(true);
                  }}
                >
                  <LinearGradient
                    colors={item.type === 'skin' ? ['#e0f2f1', '#b2dfdb'] : ['#fff3e0', '#ffcc80']}
                    style={styles.historyCardGradient}
                  >
                    <Ionicons
                      name={item.type === 'skin' ? 'scan' : 'cut'}
                      size={24}
                      color={item.type === 'skin' ? '#4db6ac' : '#ffb74d'}
                    />
                    <Text style={styles.historyCardTitle}>
                      {item.type === 'skin' ? 'Haut' : 'Haar'}
                    </Text>
                    <Text style={styles.historyCardDate}>
                      {item.date?.toLocaleDateString?.('de-DE') || 'Datum'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#e8f5e8', '#c8e6c9']}
              style={styles.infoCardGradient}
            >
              <Ionicons name="shield-checkmark" size={24} color="#66bb6a" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Datenschutz garantiert</Text>
                <Text style={styles.infoText}>
                  Ihre Fotos werden nur für die Analyse verwendet
                </Text>
              </View>
            </LinearGradient>
          </View>
          
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#fff8e1', '#ffecb3']}
              style={styles.infoCardGradient}
            >
              <Ionicons name="sparkles" size={24} color="#ffb74d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>KI-gestützte Präzision</Text>
                <Text style={styles.infoText}>
                  Powered by OpenAI GPT-4 Vision
                </Text>
              </View>
            </LinearGradient>
          </View>

          {premiumTier === 'basic' && (
            <TouchableOpacity style={styles.infoCard}>
              <LinearGradient
                colors={['#e8eaf6', '#c5cae9']}
                style={styles.infoCardGradient}
              >
                <Ionicons name="star" size={24} color="#7986cb" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Upgrade auf Premium</Text>
                  <Text style={styles.infoText}>
                    Unbegrenzte Analysen & exklusive Features
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6366f1" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {renderAnalyzingModal()}
      {renderResultsModal()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  analysisOptions: {
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 20,
  },
  analysisCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 30,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  historySection: {
    marginBottom: 30,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  historyScroll: {
    paddingHorizontal: 20,
  },
  historyCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  historyCardGradient: {
    padding: 20,
    alignItems: 'center',
    minWidth: 100,
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  infoCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoCardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  analyzingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    margin: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  analyzingGradient: {
    padding: 40,
    alignItems: 'center',
  },
  analyzingContent: {
    alignItems: 'center',
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    marginTop: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#ec4899',
    marginTop: 8,
    fontWeight: '600',
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(31,41,55,0.1)',
  },
  resultsContent: {
    flex: 1,
  },
  resultSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultSectionGradient: {
    padding: 20,
  },
  resultSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  resultBox: {
    alignItems: 'center',
  },
  resultMainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ec4899',
    marginBottom: 8,
  },
  resultSubText: {
    fontSize: 16,
    color: '#6b7280',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  textMetric: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  textMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  concernsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  concernChip: {
    backgroundColor: 'rgba(229,115,115,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  concernText: {
    fontSize: 14,
    color: '#d32f2f',
  },
  routineSection: {
    marginBottom: 20,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  routineStep: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 32,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
    marginRight: 12,
    width: 20,
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  ingredientsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientChipGood: {
    backgroundColor: 'rgba(102,187,106,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientChipBad: {
    backgroundColor: 'rgba(229,115,115,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 12,
    color: '#374151',
  },
  confidenceSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

// Export für Navigation
export default AnalysisScreen;