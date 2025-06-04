import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import all screens
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

// Enhanced user context with premium tiers
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [premiumTier, setPremiumTier] = useState<PremiumTier>('basic');
  const [purchasedRecipes, setPurchasedRecipes] = useState<string[]>([]);
  const [nextPackageDate, setNextPackageDate] = useState<Date | null>(null);
  const [packagesSent, setPackagesSent] = useState(0);

  useEffect(() => {
    // Simulate app loading and auto-login for demo
    setTimeout(() => {
      setLoading(false);
      // Auto-login for demo purposes
      setIsLoggedIn(true);
      setUser({
        id: '1',
        name: 'Demo User',
        email: 'demo@glowmatch.ai',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=ec4899&color=fff'
      });
      // Set demo premium tier to gold to show all features
      setPremiumTier('gold');
      // Set next package date for gold members (6 months from now)
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
      // If upgrading to gold, set next package date
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

  if (!isLoggedIn) {
    return (
      <UserContext.Provider value={userContextValue}>
        <SafeAreaProvider>
          <AuthScreen />
        </SafeAreaProvider>
      </UserContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={userContextValue}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </UserContext.Provider>
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