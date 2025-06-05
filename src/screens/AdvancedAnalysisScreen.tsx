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

  const handleScanComplete = async (images: string[]) => {
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
                <Text style={styles.recipeMatchText}>{recipe.matchScore