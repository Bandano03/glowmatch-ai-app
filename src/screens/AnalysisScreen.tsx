// src/screens/AdvancedAnalysisScreen.tsx

import React, { useState, useContext, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import { FaceScanner } from '../components/FaceScanner';
import { AdvancedAnalysisService } from '../services/advancedAnalysisService';
import { UserContext } from '../../App';
import { AdvancedAnalysisResult } from '../types/advancedAnalysis.types';

const { width, height } = Dimensions.get('window');

export function AdvancedAnalysisScreen() {
  const navigation = useNavigation();
  const { user, premiumTier } = useContext(UserContext);
  
  // States
  const [showScanner, setShowScanner] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [results, setResults] = useState<AdvancedAnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'products' | 'recipes' | 'plan'>('overview');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handleStartAnalysis = () => {
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
    
    setShowScanner(true);
  };

  const handleScanComplete = async (images: { uri: string; base64?: string }[]) => {
    setShowScanner(false);
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
      // Führe die tiefe Analyse durch - mit korrektem Datenformat
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
      console.error('Analysis error:', error);
      Alert.alert('Fehler', 'Die Analyse konnte nicht durchgeführt werden.');
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
                Unsere KI analysiert 10 Bilder für maximale Genauigkeit
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
              onPress={() => setShowResults(false)}
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
              <Text style={styles.scoreValue}>{results.skinAnalysis.healthScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreDescription}>
              Ihre Haut ist {results.skinAnalysis.healthScore >= 80 ? 'in ausgezeichnetem' : 
                            results.skinAnalysis.healthScore >= 60 ? 'in gutem' : 'in verbesserungsfähigem'} Zustand
            </Text>
          </LinearGradient>
        </View>

        {/* Age Analysis */}
        <View style={styles.ageCard}>
          <Text style={styles.cardTitle}>Altersanalyse</Text>
          <View style={styles.ageInfo}>
            <View style={styles.ageItem}>
              <Text style={styles.ageLabel}>Chronologisches Alter</Text>
              <Text style={styles.ageValue}>{results.skinAnalysis.age}</Text>
            </View>
            <View style={styles.ageDivider} />
            <View style={styles.ageItem}>
              <Text style={styles.ageLabel}>Biologisches Hautalter</Text>
              <Text style={[styles.ageValue, styles.ageBiological]}>
                {results.skinAnalysis.biologicalAge}
              </Text>
            </View>
          </View>
          {results.skinAnalysis.biologicalAge < results.skinAnalysis.age && (
            <View style={styles.ageSuccess}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ageSuccessText}>
                Ihre Haut ist {results.skinAnalysis.age - results.skinAnalysis.biologicalAge} Jahre jünger!
              </Text>
            </View>
          )}
        </View>

        {/* Main Concerns */}
        <View style={styles.concernsCard}>
          <Text style={styles.cardTitle}>Hauptprobleme</Text>
          {results.skinAnalysis.concerns.primary.map((concern, index) => (
            <View key={index} style={styles.concernItem}>
              <View style={styles.concernIcon}>
                <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.concernContent}>
                <Text style={styles.concernTitle}>{concern}</Text>
                <TouchableOpacity style={styles.concernAction}>
                  <Text style={styles.concernActionText}>Lösung ansehen</Text>
                  <Ionicons name="arrow-forward" size={16} color="#6b46c1" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Recommendations */}
        <View style={styles.quickRecommendations}>
          <Text style={styles.cardTitle}>Sofortmaßnahmen</Text>
          {results.recommendations.immediate.map((action, index) => (
            <TouchableOpacity key={index} style={styles.recommendationCard}>
              <LinearGradient
                colors={['#FFE5E5', '#FFF0F0']}
                style={styles.recommendationGradient}
              >
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationTitle}>{action.title}</Text>
                  <View style={[styles.priorityBadge, styles[`priority${action.priority}`]]}>
                    <Text style={styles.priorityText}>{action.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.recommendationDescription}>{action.description}</Text>
                <View style={styles.recommendationFooter}>
                  <Text style={styles.recommendationDuration}>{action.duration}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#6b46c1" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDetailsTab = () => {
    if (!results) return null;

    return (
      <View style={styles.tabContent}>
        {/* Metrics Grid */}
        <Text style={styles.sectionTitle}>Detaillierte Hautmetriken</Text>
        <View style={styles.metricsGrid}>
          {Object.entries(results.skinAnalysis.metrics).map(([key, metric]) => (
            <View key={key} style={styles.metricCard}>
              <Text style={styles.metricName}>{getMetricName(key)}</Text>
              <Progress.Circle
                size={80}
                progress={metric.value / 100}
                showsText={true}
                formatText={() => `${metric.value}`}
                color={getMetricColor(metric.value)}
                borderWidth={0}
                thickness={6}
              />
              <View style={styles.metricTrend}>
                <Ionicons 
                  name={
                    metric.trend === 'improving' ? 'trending-up' : 
                    metric.trend === 'declining' ? 'trending-down' : 'remove'
                  } 
                  size={16} 
                  color={
                    metric.trend === 'improving' ? '#4CAF50' : 
                    metric.trend === 'declining' ? '#FF6B6B' : '#999'
                  } 
                />
                <Text style={[
                  styles.metricTrendText,
                  { color: metric.trend === 'improving' ? '#4CAF50' : 
                           metric.trend === 'declining' ? '#FF6B6B' : '#999' }
                ]}>
                  {metric.trend === 'improving' ? 'Verbesserung' : 
                   metric.trend === 'declining' ? 'Verschlechterung' : 'Stabil'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Environmental Factors */}
        <Text style={styles.sectionTitle}>Umweltfaktoren</Text>
        <View style={styles.environmentCard}>
          {Object.entries(results.skinAnalysis.environmental).map(([key, value]) => (
            <View key={key} style={styles.environmentItem}>
              <View style={styles.environmentInfo}>
                <Ionicons name={getEnvironmentIcon(key) as any} size={24} color="#666" />
                <Text style={styles.environmentLabel}>{getEnvironmentName(key)}</Text>
              </View>
              <View style={styles.environmentBar}>
                <View style={[styles.environmentFill, { width: `${value}%` }]} />
              </View>
              <Text style={styles.environmentValue}>{value}%</Text>
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
        
        {/* Essential Products */}
        <View style={styles.productSection}>
          <Text style={styles.productSectionTitle}>Essenzielle Produkte</Text>
          {results.recommendations.products.essential.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <View style={styles.productImage}>
                <Ionicons name="cube" size={40} color="#6b46c1" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productType}>{product.type}</Text>
                <View style={styles.productIngredients}>
                  {product.keyIngredients.slice(0, 3).map((ing, i) => (
                    <View key={i} style={styles.ingredientChip}>
                      <Text style={styles.ingredientText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.productRight}>
                <Text style={styles.productPrice}>€{product.price}</Text>
                <View style={styles.matchScore}>
                  <Text style={styles.matchScoreText}>{product.matchScore}%</Text>
                  <Text style={styles.matchLabel}>Match</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.shopButton}>
          <LinearGradient
            colors={['#6b46c1', '#8b5cf6']}
            style={styles.shopButtonGradient}
          >
            <Ionicons name="cart" size={24} color="#fff" />
            <Text style={styles.shopButtonText}>Alle Produkte ansehen</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecipesTab = () => {
    if (!results) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>DIY Beauty-Rezepte</Text>
        
        {results.recommendations.recipes.daily.map((recipe) => (
          <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <View style={[styles.difficultyBadge, styles[`difficulty_${recipe.difficulty}`]]}>
                <Text style={styles.difficultyText}>
                  {recipe.difficulty === 'easy' ? 'Einfach' : 
                   recipe.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                </Text>
              </View>
            </View>
            <View style={styles.recipeInfo}>
              <View style={styles.recipeTime}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.recipeTimeText}>{recipe.prepTime} Min</Text>
              </View>
              <View style={styles.recipeMatch}>
                <Text style={styles.recipeMatchText}>{recipe.matchScore}% Match</Text>
              </View>
            </View>
            <View style={styles.recipeBenefits}>
              {recipe.benefits.slice(0, 2).map((benefit, i) => (
                <Text key={i} style={styles.recipeBenefit}>• {benefit}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
        
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
        
        {/* Timeline */}
        <View style={styles.timeline}>
          {/* Immediate Actions */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineTitle}>Sofort (24-48h)</Text>
            </View>
            {results.recommendations.immediate.map((action, index) => (
              <View key={index} style={styles.timelineItem}>
                <Text style={styles.timelineItemTitle}>{action.title}</Text>
                <Text style={styles.timelineItemDescription}>{action.description}</Text>
                <View style={styles.timelineSteps}>
                  {action.steps.map((step, i) => (
                    <Text key={i} style={styles.timelineStep}>{i + 1}. {step}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Short Term */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <View style={[styles.timelineDot, { backgroundColor: '#FFB923' }]} />
              <Text style={styles.timelineTitle}>Kurzfristig (2 Wochen)</Text>
            </View>
            {results.recommendations.shortTerm.map((action, index) => (
              <View key={index} style={styles.timelineItem}>
                <Text style={styles.timelineItemTitle}>{action.title}</Text>
                <Text style={styles.timelineItemDescription}>{action.description}</Text>
              </View>
            ))}
          </View>

          {/* Long Term */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <View style={[styles.timelineDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.timelineTitle}>Langfristig (3 Monate)</Text>
            </View>
            {results.recommendations.longTerm.map((action, index) => (
              <View key={index} style={styles.timelineItem}>
                <Text style={styles.timelineItemTitle}>{action.title}</Text>
                <Text style={styles.timelineItemDescription}>{action.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lifestyle Recommendations */}
        <View style={styles.lifestyleSection}>
          <Text style={styles.sectionTitle}>Lifestyle-Empfehlungen</Text>
          
          <View style={styles.lifestyleGrid}>
            <View style={styles.lifestyleCard}>
              <Ionicons name="nutrition" size={32} color="#4CAF50" />
              <Text style={styles.lifestyleTitle}>Ernährung</Text>
              {results.recommendations.lifestyle.diet.slice(0, 3).map((item, i) => (
                <Text key={i} style={styles.lifestyleItem}>• {item}</Text>
              ))}
            </View>

            <View style={styles.lifestyleCard}>
              <Ionicons name="medical" size={32} color="#FF6B6B" />
              <Text style={styles.lifestyleTitle}>Supplements</Text>
              {results.recommendations.lifestyle.supplements.slice(0, 3).map((item, i) => (
                <Text key={i} style={styles.lifestyleItem}>• {item}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Save Plan Button */}
        <TouchableOpacity style={styles.savePlanButton}>
          <LinearGradient
            colors={['#6b46c1', '#8b5cf6']}
            style={styles.savePlanGradient}
          >
            <Ionicons name="download" size={24} color="#fff" />
            <Text style={styles.savePlanText}>Plan speichern</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Helper functions
  const getMetricName = (key: string): string => {
    const names: Record<string, string> = {
      hydration: 'Feuchtigkeit',
      elasticity: 'Elastizität',
      firmness: 'Festigkeit',
      radiance: 'Ausstrahlung',
      evenness: 'Ebenmäßigkeit',
      poreSize: 'Porengröße',
      oilBalance: 'Öl-Balance',
    };
    return names[key] || key;
  };

  const getMetricColor = (value: number): string => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#FFB923';
    return '#FF6B6B';
  };

  const getEnvironmentIcon = (key: string): string => {
    const icons: Record<string, string> = {
      uvDamage: 'sunny',
      pollutionImpact: 'cloud',
      stressLevel: 'pulse',
      dehydration: 'water',
    };
    return icons[key] || 'help';
  };

  const getEnvironmentName = (key: string): string => {
    const names: Record<string, string> = {
      uvDamage: 'UV-Schäden',
      pollutionImpact: 'Umweltverschmutzung',
      stressLevel: 'Stress-Level',
      dehydration: 'Dehydration',
    };
    return names[key] || key;
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
            Unsere fortschrittliche KI scannt Ihr Gesicht aus mehreren Winkeln 
            und erstellt eine umfassende Analyse mit personalisierten Empfehlungen.
          </Text>
          
          <View style={styles.features}>
            {[
              '10 hochauflösende Scans',
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
            <Text style={styles.startButtonSubtext}>Dauert etwa 1 Minute</Text>
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

      {/* Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <FaceScanner
          onScanComplete={handleScanComplete}
          onProgress={(progress) => console.log('Scan progress:', progress)}
        />
        <TouchableOpacity
          style={styles.cancelScanButton}
          onPress={() => setShowScanner(false)}
        >
          <Text style={styles.cancelScanText}>Abbrechen</Text>
        </TouchableOpacity>
      </Modal>

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
  cancelScanButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelScanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  ageCard: {
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
  ageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ageItem: {
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  ageBiological: {
    color: '#4CAF50',
  },
  ageDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e0e0e0',
  },
  ageSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ageSuccessText: {
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '600',
  },
  concernsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  concernIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  concernContent: {
    flex: 1,
    marginLeft: 16,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  concernAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  concernActionText: {
    fontSize: 14,
    color: '#6b46c1',
    marginRight: 4,
  },
  quickRecommendations: {
    marginBottom: 20,
  },
  recommendationCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recommendationGradient: {
    padding: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityhigh: {
    backgroundColor: '#FF3B30',
  },
  prioritymedium: {
    backgroundColor: '#FFB923',
  },
  prioritylow: {
    backgroundColor: '#4CAF50',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationDuration: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metricTrendText: {
    fontSize: 11,
    marginLeft: 4,
  },
  environmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  environmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  environmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  environmentLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  environmentBar: {
    flex: 2,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  environmentFill: {
    height: '100%',
    backgroundColor: '#FFB923',
    borderRadius: 3,
  },
  environmentValue: {
    fontSize: 14,
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  productSection: {
    marginBottom: 24,
  },
  productSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  productType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productIngredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  ingredientChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ingredientText: {
    fontSize: 10,
    color: '#4CAF50',
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  matchScore: {
    alignItems: 'center',
    marginTop: 8,
  },
  matchScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b46c1',
  },
  matchLabel: {
    fontSize: 10,
    color: '#999',
  },
  shopButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficulty_easy: {
    backgroundColor: '#E8F5E9',
  },
  difficulty_medium: {
    backgroundColor: '#FFF3E0',
  },
  difficulty_hard: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipeTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeTimeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  recipeMatch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeMatchText: {
    fontSize: 14,
    color: '#6b46c1',
    fontWeight: '600',
  },
  recipeBenefits: {
    gap: 4,
  },
  recipeBenefit: {
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
  timeline: {
    marginBottom: 24,
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
    padding: 20,
    marginBottom: 12,
    marginLeft: 28,
  },
  timelineItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timelineItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  timelineSteps: {
    gap: 6,
  },
  timelineStep: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  lifestyleSection: {
    marginBottom: 24,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  lifestyleCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  lifestyleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },
  lifestyleItem: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  savePlanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  savePlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  savePlanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdvancedAnalysisScreen;