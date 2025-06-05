import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<any, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 App Fehler:', error);
    console.error('📍 Fehler Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning" size={64} color="#FF6B6B" />
          <Text style={styles.title}>Ups! Etwas ist schiefgelaufen</Text>
          <Text style={styles.message}>
            Keine Sorge, das passiert manchmal. Versuchen Sie es einfach erneut.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>🔄 Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// SCHRITT 2: Öffnen Sie App.tsx und ERSETZEN Sie den Inhalt mit:

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import ErrorBoundary
import { ErrorBoundary } from './src/components/ErrorBoundary'; // ← NEU HINZUFÜGEN

// Import all screens (bestehender Code...)
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalysisScreen } from './src/screens/AnalysisScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { AuthScreen } from './src/screens/AuthScreen';

// Import types
import { PremiumTier } from './src/types/premium';

const Tab = createBottomTabNavigator();

// Enhanced user context with premium tiers (bestehender Code...)
export const UserContext = React.createContext({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  premiumTier: 'basic' as PremiumTier,
  updatePremiumTier: (tier: PremiumTier) => {},
  purchasedRecipes: [] as string[],
  addPurchasedRecipe: (recipeId: string) => {},
  nextPackageDate: null as Date | null,
  packagesSent: 0,
});

export default function App() {
  // Bestehender Code... (useState, useEffect, etc.)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [premiumTier, setPremiumTier] = useState<PremiumTier>('basic');
  const [purchasedRecipes, setPurchasedRecipes] = useState<string[]>([]);
  const [nextPackageDate, setNextPackageDate] = useState<Date | null>(null);
  const [packagesSent, setPackagesSent] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      setIsLoggedIn(true);
      setUser({
        id: '1',
        name: 'Demo User',
        email: 'demo@glowmatch.ai',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=ec4899&color=fff'
      });
      setPremiumTier('gold');
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 6);
      setNextPackageDate(nextDate);
    }, 2000);
  }, []);

  const userContextValue = {
    user,
    isLoggedIn,
    login: () => setIsLoggedIn(true),
    logout: () => {
      setIsLoggedIn(false);
      setPremiumTier('basic');
      setPurchasedRecipes([]);
    },
    premiumTier,
    updatePremiumTier: (tier: PremiumTier) => {
      setPremiumTier(tier);
      if (tier === 'gold') {
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 6);
        setNextPackageDate(nextDate);
      }
    },
    purchasedRecipes,
    addPurchasedRecipe: (recipeId: string) => {
      setPurchasedRecipes(prev => [...prev, recipeId]);
    },
    nextPackageDate,
    packagesSent,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b46c1" />
        <Text style={styles.loadingText}>GlowMatch AI wird geladen...</Text>
      </View>
    );
  }

  // *** HIER DIE WICHTIGE ÄNDERUNG: ErrorBoundary umhüllt alles ***
  return (
    <ErrorBoundary>
      <UserContext.Provider value={userContextValue}>
        <SafeAreaProvider>
          {!isLoggedIn ? (
            <AuthScreen />
          ) : (
            <NavigationContainer>
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    switch (route.name) {
                      case 'Home':
                        iconName = focused ? 'home' : 'home-outline';
                        break;
                      case 'Analyse':
                        iconName = focused ? 'camera' : 'camera-outline';
                        break;
                      case 'Rezepte':
                        iconName = focused ? 'book' : 'book-outline';
                        break;
                      case 'Verlauf':
                        iconName = focused ? 'time' : 'time-outline';
                        break;
                      case 'Produkte':
                        iconName = focused ? 'bag' : 'bag-outline';
                        break;
                      case 'Profil':
                        iconName = focused ? 'person' : 'person-outline';
                        break;
                      default:
                        iconName = 'circle';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                  },
                  tabBarActiveTintColor: '#6b46c1',
                  tabBarInactiveTintColor: 'gray',
                  tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                  },
                  headerShown: false,
                })}
              >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Analyse" component={AnalysisScreen} />
                <Tab.Screen name="Rezepte" component={RecipesScreen} />
                <Tab.Screen name="Verlauf" component={HistoryScreen} />
                <Tab.Screen name="Produkte" component={ProductsScreen} />
                <Tab.Screen name="Profil" component={ProfileScreen} />
              </Tab.Navigator>
            </NavigationContainer>
          )}
        </SafeAreaProvider>
      </UserContext.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#6b46c1',
    fontWeight: '600',
  },
});