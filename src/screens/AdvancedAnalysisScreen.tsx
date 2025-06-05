// src/screens/AdvancedAnalysisScreen.tsx

import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Progress from 'react-native-progress';
import { useNavigation, useRoute } from '@react-navigation/native';

// Services & Types
import { AdvancedAnalysisService } from '../services/advancedAnalysisService';
import { UserContext } from '../../App';
import { AdvancedAnalysisResult } from '../types/advancedAnalysis.types';

// Hooks
import { useCamera } from '../hooks/useCamera';

const { width, height } = Dimensions.get('window');

export function AdvancedAnalysisScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, premiumTier } = useContext(UserContext);
  const { selectImage } = useCamera();
  
  // States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [results, setResults] = useState<AdvancedAnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'products' | 'recipes' | 'plan'>('overview');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Überprüfe ob direkt gestartet werden soll
    const params = route.params as any;
    if (params?.startAnalysis) {
      handleStartAnalysis();
    }
  }, [route.params]);

  const handleStartAnalysis = async () => {
    if (premiumTier === 'basic') {
      Alert.alert(
        'Premium Feature',
        'Die erweiterte Analyse ist nur für Premium-Mitglieder verfügbar.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Premium werden', onPress: () => navigation.navigate('Profil' as never) }
        ]
      );
      return;
    }
    
    // Starte die Bildaufnahme
    await captureMultipleImages();
  };

  const captureMultipleImages = async () => {
    try {
      const images: string[] = [];
      const requiredImages = 3; // Reduziert für bessere UX
      
      for (let i = 0; i < requiredImages; i++) {
        Alert.alert(
          `Bild ${i + 1} von ${requiredImages}`,
          i === 0 ? 'Bitte fotografieren Sie Ihr Gesicht von vorne' :
          i === 1 ? 'Bitte drehen Sie Ihr Gesicht nach links' :
          'Bitte drehen Sie Ihr Gesicht nach rechts',
          [
            {
              text: 'Foto aufnehmen',
              onPress: async () => {
                const result = await selectImage();
                if (result.success && result.base64) {
                  images.push(result.base64);
                  
                  if (images.length === requiredImages) {
                    setCapturedImages(images);
                    await performAdvancedAnalysis(images);
                  }
                } else {
                  Alert.alert('Fehler', 'Bild konnte nicht aufgenommen werden');
                  return;
                }
              }
            },
            {
              text: 'Abbrechen',
              style: 'cancel',
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Warte auf Benutzeraktion
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Fehler beim Aufnehmen der Bilder:', error);
      Alert.alert('Fehler', 'Die Bildaufnahme wurde abgebrochen');
    }
  };

  const performAdvancedAnalysis = async (images: string[]) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Starte Analyse-Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Simuliere verschiedene Analyse-Stadien
    const stages = [
      { stage: 'Hautstruktur analysieren...', progress: 0.2 },
      { stage: 'Porengröße bewerten...', progress: 0.35 },
      { stage: 'Feuchtigkeitslevel messen...', progress: 0.5 },
      { stage: 'Alterungszeichen erkennen...', progress: 0.65 },
      { stage: 'Umweltschäden bewerten...', progress: 0.8 },
      { stage: 'Personalisierte Empfehlungen erstellen...', progress: 0.95 },
    ];

    for (const { stage, progress } of stages) {
      setAnalysisStage(stage);
      setAnalysisProgress(progress);
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      // Führe die tiefe Analyse durch
      const analysisResult = await AdvancedAnalysisService.performDeepAnalysis(images);
      
      setResults(analysisResult);
      setAnalysisProgress(1);
      setAnalysisStage('Analyse abgeschlossen!');
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 1000);
      
    } catch (error) {
      console.error('Advanced analysis error:', error);
      Alert.alert(
        'Analysefehler', 
        'Die Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
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
        <Animated.View
          style={[
            styles.analyzingCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#6b46c1', '#8b5cf6']}
            style={styles.analyzingGradient}
          >
            <Text style={styles.analyzingTitle}>Tiefenanalyse läuft</Text>
            
            <View style={styles.progressCircleContainer}>
              <Progress.Circle
                size={150}
                progress={analysisProgress}
                borderWidth={0}
                thickness={8}
                color="#fff"
                unfilledColor="rgba(255,255,255,0.2)"
                showsText={true}
                formatText={() => `${Math.round(analysisProgress * 100)}%`}
                textStyle={styles.progressText}
              />
            </View>
            
            <Text style={styles.analyzingStage}>{analysisStage}</Text>
            
            <View style={styles.analyzingInfo}>
              <Ionicons name="information-circle" size={16} color="#fff" />
              <Text style={styles.analyzingInfoText}>
                Unsere KI analysiert Ihre Bilder für maximale Genauigkeit
              </Text>
            </View>
            
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderResultsModal = () => {
    if (!results) return null;

    return (
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="overFullScreen"
      >
        <View style={styles.resultsContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#6b46c1', '#8b5cf6']}
            style={styles.resultsHeader}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowResults(false);
                navigation.goBack();
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.resultsTitle}>Ihre Hautanalyse</Text>
            <Text style={styles.resultsDate}>
              {new Date().toLocaleDateString('de-DE', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            
            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabContainer}
            >
              {[
                { id: 'overview', label: 'Übersicht', icon: 'grid' },
                { id: 'details', label: 'Details', icon: 'analytics' },
                { id: 'products', label: 'Produkte', icon: 'basket' },
                { id: 'recipes', label: 'Rezepte', icon: 'flask' },
                { id: 'plan', label: 'Plan', icon: 'calendar' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
                  onPress={() => setSelectedTab(tab.id as any)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={20} 
                    color={selectedTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)'} 
                  />
                  <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.resultsContent} showsVerticalScrollIndicator={false}>
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'details' && renderDetailsTab()}
            {selectedTab === 'products' && renderProductsTab()}
            {selectedTab === 'recipes' && renderRecipesTab()}
            {selectedTab === 'plan' && renderPlanTab()}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderOverviewTab = () => {
    if (!results) return null;

    return (
      <View style={styles.tabContent}>
        {/* Health Score Card */}
        <View style={styles.scoreCard}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreLabel}>Hautgesundheit</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{results.skinAnalysis.overallScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreDescription}>
              Ihre Haut ist in {results.skinAnalysis.overallScore >= 80 ? 'ausgezeichnetem' : 
                               results.skinAnalysis.overallScore >= 60 ? 'gutem' : 'verbesserungsfähigem'} Zustand
            </Text>
          </LinearGradient>
        </View>

        {/* Main Concerns */}
        <View style={styles.concernsCard}>
          <Text style={styles.cardTitle}>Erkannte Probleme</Text>
          {results.skinAnalysis.concerns.map((concern, index) => (
            <View key={index} style={styles.concernItem}>
              <View style={styles.concernIcon}>
                <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.concernTitle}>{concern}</Text>
            </View>
          ))}
        </View>

        {/* Quick Recommendations */}
        <View style={styles.quickRecommendations}>
          <Text style={styles.cardTitle}>Sofortmaßnahmen</Text>
          {results.recommendations.immediate.map((action, index) => (
            <View key={index} style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>{action}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDetailsTab = () => {
    if (!results) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Detaillierte Hautmetriken</Text>
        <View style={styles.metricsGrid}>
          {Object.entries(results.skinAnalysis.detailedMetrics).map(([key, value]) => (
            <View key={key} style={styles.metricCard}>
              <Text style={styles.metricName}>{key}</Text>
              <Progress.Circle
                size={80}
                progress={value / 100}
                showsText={true}
                formatText={() => `${value}`}
                color={value >= 70 ? '#4CAF50' : value >= 40 ? '#FFB923' : '#FF6B6B'}
                borderWidth={0}
                thickness={6}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderProductsTab = () => {
    if (!results) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Empfohlene Produkte</Text>
        {results.recommendations.products.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productCategory}>{product.category}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productReason}>{product.reason}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecipesTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>DIY Beauty-Rezepte</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Rezepte' as never)}
        >
          <Text style={styles.viewAllButtonText}>Alle Rezepte ansehen</Text>
          <Ionicons name="arrow-forward" size={20} color="#6b46c1" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPlanTab = () => {
    if (!results) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Ihr persönlicher Pflegeplan</Text>
        
        {/* Immediate Actions */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineDot} />
            <Text style={styles.timelineTitle}>Sofort</Text>
          </View>
          {results.recommendations.immediate.map((action, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={styles.timelineItemTitle}>{action}</Text>
            </View>
          ))}
        </View>

        {/* Long Term */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <View style={[styles.timelineDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.timelineTitle}>Langfristig</Text>
          </View>
          {results.recommendations.longTerm.map((action, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={styles.timelineItemTitle}>{action}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Main Screen */}
      <LinearGradient
        colors={['#6b46c1', '#8b5cf6']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Erweiterte Hautanalyse</Text>
        <Text style={styles.headerSubtitle}>
          Professionelle Tiefenanalyse mit KI
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Ionicons name="sparkles" size={48} color="#6b46c1" />
          <Text style={styles.introTitle}>Next-Level Hautanalyse</Text>
          <Text style={styles.introDescription}>
            Unsere fortschrittliche KI analysiert Ihr Gesicht aus mehreren Winkeln 
            und erstellt eine umfassende Analyse mit personalisierten Empfehlungen.
          </Text>
          
          <View style={styles.features}>
            {[
              'Mehrwinkel-Analyse',
              'Tiefenanalyse aller Hautschichten',
              'Personalisierte Produktempfehlungen',
              'Maßgeschneiderter Pflegeplan',
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartAnalysis}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6b46c1', '#8b5cf6']}
            style={styles.startButtonGradient}
          >
            <Ionicons name="scan" size={32} color="#fff" />
            <Text style={styles.startButtonText}>Analyse starten</Text>
            <Text style={styles.startButtonSubtext}>3 Fotos werden aufgenommen</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.infoTitle}>100% Privat</Text>
            <Text style={styles.infoText}>Ihre Bilder werden nur für die Analyse verwendet</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.infoTitle}>Premium Feature</Text>
            <Text style={styles.infoText}>Exklusiv für Gold & Silver Mitglieder</Text>
          </View>
        </View>
      </ScrollView>

      {renderAnalyzingModal()}
      {renderResultsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  introDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  startButton: {
    marginTop: 30,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  startButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  startButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  analyzingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingCard: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  analyzingGradient: {
    padding: 40,
    alignItems: 'center',
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  progressCircleContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  analyzingStage: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    minHeight: 20,
  },
  analyzingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  analyzingInfoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  resultsHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  resultsDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  tabContainer: {
    marginTop: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContent: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  scoreCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  scoreGradient: {
    padding: 30,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreMax: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
  },
  scoreDescription: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  concernsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  concernIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  concernTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  quickRecommendations: {
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 3,
    marginBottom: 16,
  },
  metricName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  productInfo: {
    gap: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productReason: {
    fontSize: 14,
    color: '#666',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 16,
    color: '#6b46c1',
    fontWeight: '600',
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6b46c1',
    marginRight: 12,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timelineItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginLeft: 28,
  },
  timelineItemTitle: {
    fontSize: 16,
    color: '#333',
  },
});