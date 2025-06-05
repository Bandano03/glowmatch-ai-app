
import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { UserContext } from '../../App';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Interfaces
interface DailyTip {
  id: string;
  category: 'skin' | 'hair' | 'wellness' | 'nutrition';
  title: string;
  content: string;
  icon: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  uv: number;
  condition: string;
}

interface RoutineTask {
  id: string;
  title: string;
  completed: boolean;
  time: 'morning' | 'evening';
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  rating: number;
}

export function HomeScreen() {
  const navigation = useNavigation();
  const { user, premiumTier } = useContext(UserContext);
  
  // States
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTip, setCurrentTip] = useState<DailyTip | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [stats, setStats] = useState({
    analysisCount: 12,
    savedProducts: 24,
    recipesTried: 8,
    streakDays: 5,
    skinScore: 85,
    hairScore: 78,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAllData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for loading states
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Parallel loading für bessere Performance
      await Promise.all([
        loadDailyTip(),
        loadWeather(),
        loadRoutineTasks(),
        loadAchievements(),
        loadRecommendedProducts(),
        loadUserStats(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyTip = async () => {
    const tips: DailyTip[] = [
      {
        id: '1',
        category: 'skin',
        title: 'Sonnenschutz ist essentiell',
        content: 'Tragen Sie täglich LSF 30+ auf, auch bei bewölktem Himmel. 80% der UV-Strahlen durchdringen Wolken!',
        icon: 'sunny',
      },
      {
        id: '2',
        category: 'hair',
        title: 'Seidenkissenbezug verwenden',
        content: 'Seide reduziert Haarbruch und Frizz während Sie schlafen. Ihre Haare werden es Ihnen danken!',
        icon: 'moon',
      },
      {
        id: '3',
        category: 'wellness',
        title: 'Hydration von innen',
        content: 'Trinken Sie mindestens 2L Wasser täglich für strahlende Haut und gesundes Haar.',
        icon: 'water',
      },
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setCurrentTip(randomTip);
  };

  const loadWeather = async () => {
    // Simulierte Wetterdaten - in echter App würde man eine Weather API nutzen
    setWeather({
      temp: 22,
      humidity: 65,
      uv: 6,
      condition: 'Teilweise bewölkt',
    });
  };

  const loadRoutineTasks = async () => {
    const tasks: RoutineTask[] = [
      { id: '1', title: 'Gesichtsreinigung', completed: true, time: 'morning', icon: 'water' },
      { id: '2', title: 'Serum auftragen', completed: true, time: 'morning', icon: 'color-fill' },
      { id: '3', title: 'Sonnenschutz', completed: false, time: 'morning', icon: 'sunny' },
      { id: '4', title: 'Make-up entfernen', completed: false, time: 'evening', icon: 'sparkles' },
      { id: '5', title: 'Nachtcreme', completed: false, time: 'evening', icon: 'moon' },
    ];
    setRoutineTasks(tasks);
  };

  const loadAchievements = async () => {
    const achievementsList: Achievement[] = [
      {
        id: '1',
        title: 'Analyse-Profi',
        description: '10 Analysen durchgeführt',
        icon: 'trophy',
        progress: 8,
        total: 10,
        unlocked: false,
      },
      {
        id: '2',
        title: 'Routine-Meister',
        description: '7 Tage Streak',
        icon: 'flame',
        progress: 5,
        total: 7,
        unlocked: false,
      },
      {
        id: '3',
        title: 'DIY-Experte',
        description: '5 Rezepte ausprobiert',
        icon: 'flask',
        progress: 5,
        total: 5,
        unlocked: true,
      },
    ];
    setAchievements(achievementsList);
  };

  const loadRecommendedProducts = async () => {
    const products: Product[] = [
      {
        id: '1',
        name: 'Vitamin C Serum',
        brand: 'The Ordinary',
        image: 'https://via.placeholder.com/150',
        rating: 4.5,
      },
      {
        id: '2',
        name: 'Retinol 0.5%',
        brand: 'Paula\'s Choice',
        image: 'https://via.placeholder.com/150',
        rating: 4.8,
      },
      {
        id: '3',
        name: 'Hyaluronic Acid',
        brand: 'CeraVe',
        image: 'https://via.placeholder.com/150',
        rating: 4.3,
      },
    ];
    setRecommendedProducts(products);
  };

  const loadUserStats = async () => {
    // Hier würden Sie echte Statistiken aus der Datenbank laden
    const savedStats = await AsyncStorage.getItem('userStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAllData();
    setRefreshing(false);
  };

  const toggleRoutineTask = async (taskId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoutineTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    
    // Update streak wenn alle Tasks erledigt
    const allCompleted = routineTasks.every(task => task.completed || task.id === taskId);
    if (allCompleted) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Glückwunsch!', 'Sie haben Ihre heutige Routine abgeschlossen! 🎉');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const getWeatherAdvice = () => {
    if (!weather) return null;
    
    if (weather.uv >= 6) {
      return 'Hoher UV-Index! Vergessen Sie nicht den Sonnenschutz.';
    } else if (weather.humidity < 40) {
      return 'Niedrige Luftfeuchtigkeit - Extra Feuchtigkeitspflege empfohlen.';
    } else if (weather.temp < 10) {
      return 'Kaltes Wetter - Schützen Sie Ihre Haut vor dem Austrocknen.';
    }
    return 'Perfektes Wetter für Ihre Haut!';
  };

  const renderHeader = () => (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={['#FFB6C1', '#FFC0CB']}  // Pastellpink statt Violett
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Beauty Lover'}!</Text>
            {/* Wetter-Container entfernt - keine Temperaturanzeige mehr */}
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profil' as never)}
            style={styles.avatarContainer}
          >
            <Image
              source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=fff&color=FFB6C1' }}
              style={styles.avatar}
            />
            {premiumTier !== 'basic' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Beauty Score */}
        <View style={styles.beautyScoreContainer}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Skin Score</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{stats.skinScore}</Text>
            </View>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Hair Score</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{stats.hairScore}</Text>
            </View>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Streak</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{stats.streakDays}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderDailyRoutine = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tägliche Routine</Text>
        <TouchableOpacity onPress={() => setShowRoutineModal(true)}>
          <Text style={styles.sectionAction}>Alle anzeigen</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.routineContainer}>
        {routineTasks.slice(0, 3).map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.routineTask, task.completed && styles.routineTaskCompleted]}
            onPress={() => toggleRoutineTask(task.id)}
          >
            <View style={[styles.routineCheckbox, task.completed && styles.routineCheckboxCompleted]}>
              {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.routineTaskText, task.completed && styles.routineTaskTextCompleted]}>
              {task.title}
            </Text>
            <Ionicons name={task.icon as any} size={20} color={task.completed ? '#4CAF50' : '#999'} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(routineTasks.filter(t => t.completed).length / routineTasks.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {routineTasks.filter(t => t.completed).length} von {routineTasks.length} erledigt
        </Text>
      </View>
    </Animated.View>
  );

  const renderQuickActions = () => {
    const actions = [
      {
        id: 'skin-analysis',
        title: 'Hautanalyse',
        subtitle: 'KI-gestützt',
        icon: 'scan',
        color: ['#B3E5D1', '#A8D8C1'],  // Pastell Mint
        onPress: () => navigation.navigate('Analyse' as never),
      },
      {
        id: 'hair-analysis',
        title: 'Haaranalyse',
        subtitle: 'Personalisiert',
        icon: 'cut',
        color: ['#FFD4A3', '#FFBF9B'],  // Pastell Pfirsich
        onPress: () => navigation.navigate('Analyse' as never),
      },
      {
        id: 'recipes',
        title: 'DIY Rezepte',
        subtitle: `${premiumTier === 'basic' ? '3 kostenlos' : 'Alle freigeschaltet'}`,
        icon: 'flask',
        color: ['#E6E6FA', '#D8BFD8'],  // Pastell Lavendel
        onPress: () => navigation.navigate('Rezepte' as never),
      },
      {
        id: 'products',
        title: 'Produkte',
        subtitle: 'Empfehlungen',
        icon: 'basket',
        color: ['#FFDAB9', '#FFE4B5'],  // Pastell Apricot
        onPress: () => navigation.navigate('Produkte' as never),
      },
    ];

    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                action.onPress();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={action.color}
                style={styles.quickActionGradient}
              >
                <Ionicons name={action.icon as any} size={32} color="#fff" />
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderDailyTip = () => {
    if (!currentTip) return null;

    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={styles.tipCard}>
          <LinearGradient
            colors={['#FFF0E5', '#FFE4CC']}  // Pastell Creme
            style={styles.tipGradient}
          >
            <View style={styles.tipHeader}>
              <Ionicons name={currentTip.icon as any} size={24} color="#FFA07A" />
              <Text style={styles.tipTitle}>Tipp des Tages</Text>
              <View style={styles.tipBadge}>
                <Text style={styles.tipBadgeText}>{currentTip.category.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.tipSubtitle}>{currentTip.title}</Text>
            <Text style={styles.tipContent}>{currentTip.content}</Text>
            {weather && getWeatherAdvice() && (
              <View style={styles.weatherAdvice}>
                <Ionicons name="information-circle" size={16} color="#F08080" />
                <Text style={styles.weatherAdviceText}>{getWeatherAdvice()}</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  const renderAchievements = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <TouchableOpacity onPress={() => setShowAchievementModal(true)}>
          <Text style={styles.sectionAction}>Alle ({achievements.length})</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {achievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            style={[styles.achievementCard, achievement.unlocked && styles.achievementCardUnlocked]}
            onPress={() => {
              setSelectedAchievement(achievement);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[styles.achievementIcon, achievement.unlocked && styles.achievementIconUnlocked]}>
              <Ionicons 
                name={achievement.icon as any} 
                size={32} 
                color={achievement.unlocked ? '#FFD700' : '#ccc'} 
              />
            </View>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <View style={styles.achievementProgress}>
              <View style={styles.achievementProgressBar}>
                <View 
                  style={[
                    styles.achievementProgressFill,
                    { width: `${(achievement.progress / achievement.total) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.achievementProgressText}>
                {achievement.progress}/{achievement.total}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderRecommendedProducts = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Für Sie empfohlen</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Produkte' as never)}>
          <Text style={styles.sectionAction}>Mehr</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {recommendedProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Produkte' as never);
            }}
          >
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.productRating}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons 
                    key={i} 
                    name="star" 
                    size={12} 
                    color={i < Math.floor(product.rating) ? '#FFD700' : '#e0e0e0'} 
                  />
                ))}
                <Text style={styles.productRatingText}>{product.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderPremiumBanner = () => {
    if (premiumTier !== 'basic') return null;

    return (
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.premiumBanner}
          onPress={() => navigation.navigate('Profil' as never)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#F0E68C', '#FFFFE0']}  // Pastell Gelb
            style={styles.premiumGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumLeft}>
                <Ionicons name="star" size={32} color="#fff" />
              </View>
              <View style={styles.premiumCenter}>
                <Text style={styles.premiumTitle}>Upgrade auf Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unbegrenzte Analysen, exklusive Rezepte & mehr!
                </Text>
                <View style={styles.premiumFeatures}>
                  <View style={styles.premiumFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.premiumFeatureText}>Unbegrenzte Analysen</Text>
                  </View>
                  <View style={styles.premiumFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.premiumFeatureText}>50+ Premium Rezepte</Text>
                  </View>
                  <View style={styles.premiumFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.premiumFeatureText}>Persönliche Beratung</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Modals
  const renderRoutineModal = () => (
    <Modal
      visible={showRoutineModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRoutineModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tägliche Routine</Text>
          <TouchableOpacity onPress={() => setShowRoutineModal(false)}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.routineSection}>
            <Text style={styles.routineSectionTitle}>
              <Ionicons name="sunny" size={20} color="#FFB923" /> Morgenroutine
            </Text>
            {routineTasks.filter(t => t.time === 'morning').map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.routineModalTask, task.completed && styles.routineModalTaskCompleted]}
                onPress={() => toggleRoutineTask(task.id)}
              >
                <View style={[styles.routineCheckbox, task.completed && styles.routineCheckboxCompleted]}>
                  {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={[styles.routineModalTaskText, task.completed && styles.routineModalTaskTextCompleted]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.routineSection}>
            <Text style={styles.routineSectionTitle}>
              <Ionicons name="moon" size={20} color="#6C5CE7" /> Abendroutine
            </Text>
            {routineTasks.filter(t => t.time === 'evening').map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.routineModalTask, task.completed && styles.routineModalTaskCompleted]}
                onPress={() => toggleRoutineTask(task.id)}
              >
                <View style={[styles.routineCheckbox, task.completed && styles.routineCheckboxCompleted]}>
                  {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={[styles.routineModalTaskText, task.completed && styles.routineModalTaskTextCompleted]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View
          style={{
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          }}
        >
          <Ionicons name="refresh" size={48} color="#FFB6C1" />
        </Animated.View>
        <Text style={styles.loadingText}>Lade Ihre Beauty-Daten...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFB6C1"
          />
        }
      >
        {renderHeader()}
        {renderDailyRoutine()}
        {renderQuickActions()}
        {renderDailyTip()}
        {renderAchievements()}
        {renderRecommendedProducts()}
        {renderPremiumBanner()}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {renderRoutineModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFB6C1',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  weatherText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  beautyScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionAction: {
    fontSize: 14,
    color: '#FFB6C1',
    fontWeight: '500',
  },
  routineContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  routineTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routineTaskCompleted: {
    opacity: 0.6,
  },
  routineCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineCheckboxCompleted: {
    backgroundColor: '#98D8C8',  // Pastell Mint
    borderColor: '#98D8C8',
  },
  routineTaskText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  routineTaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 50) / 2,
    height: 120,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  quickActionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  tipCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tipGradient: {
    padding: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
    marginLeft: 8,
    flex: 1,
  },
  tipBadge: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  tipSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  weatherAdvice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE4B5',
  },
  weatherAdviceText: {
    fontSize: 13,
    color: '#FF6347',
    marginLeft: 6,
    flex: 1,
  },
  achievementCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  achievementCardUnlocked: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIconUnlocked: {
    backgroundColor: '#FFE4B5',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementProgress: {
    width: '100%',
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  achievementProgressText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  productCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
    height: 36,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  premiumBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  premiumGradient: {
    padding: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumLeft: {
    marginRight: 16,
  },
  premiumCenter: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  premiumFeatures: {
    gap: 6,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumFeatureText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  routineSection: {
    marginBottom: 30,
  },
  routineSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  routineModalTask: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  routineModalTaskCompleted: {
    backgroundColor: '#E8F5E9',
  },
  routineModalTaskText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  routineModalTaskTextCompleted: {
    color: '#4CAF50',
  },
});

export default HomeScreen;