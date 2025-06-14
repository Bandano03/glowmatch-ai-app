import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { UserContext } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface Recipe {
  id: string;
  title: string;
  category: 'face' | 'hair' | 'body' | 'lips';
  difficulty: 'easy' | 'medium' | 'hard';
  time: number; // in minutes
  ingredients: string[];
  instructions: string[];
  benefits: string[];
  image: string;
  isPremium: boolean;
  rating: number;
  reviews: number;
  isFavorite: boolean;
  videoUrl?: string;
  tips?: string[];
  warnings?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string[];
}

// OPTIMIERTE RECIPE CARD KOMPONENTE - MEMO FÜR PERFORMANCE
const RecipeCard = React.memo(({ 
  item, 
  onPress, 
  onToggleFavorite, 
  isFavorite, 
  isAccessible 
}: {
  item: Recipe;
  onPress: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
  isFavorite: boolean;
  isAccessible: boolean;
}) => {
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFB923';
      case 'hard': return '#FF6B6B';
      default: return '#999';
    }
  }, []);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const handleFavoritePress = useCallback(() => {
    onToggleFavorite(item.id);
  }, [item.id, onToggleFavorite]);

  return (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.recipeImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.recipeImage}
          resizeMode="cover"
          loadingIndicatorSource={require('../../assets/placeholder.png')}
        />
        {!isAccessible && (
          <View style={styles.premiumOverlay}>
            <Ionicons name="lock-closed" size={32} color="#fff" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF6B6B" : "#fff"} 
          />
        </TouchableOpacity>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
          <Text style={styles.difficultyText}>
            {item.difficulty === 'easy' ? 'Einfach' : 
             item.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
          </Text>
        </View>
      </View>
      
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.recipeDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.time} Min</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{item.rating}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.reviews}</Text>
          </View>
        </View>
        
        <View style={styles.benefitsPreview}>
          {item.benefits.slice(0, 2).map((benefit, index) => (
            <View key={index} style={styles.benefitChip}>
              <Text style={styles.benefitText} numberOfLines={1}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export function RecipesScreen() {
  const { user, premiumTier, purchasedRecipes, addPurchasedRecipe } = useContext(UserContext);
  
  // States
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // PERFORMANCE: Debounced Search
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'time'>('newest');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  // PERFORMANCE: Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wartet 500ms nach dem letzten Tastendruck

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // PERFORMANCE: Verwendet debouncedSearchQuery statt searchQuery
  useEffect(() => {
    filterRecipes();
  }, [selectedCategory, debouncedSearchQuery, recipes, selectedDifficulty, sortBy]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const categoriesData: Category[] = [
        { id: 'all', name: 'Alle', icon: 'apps', color: ['#6b46c1', '#8b5cf6'] },
        { id: 'face', name: 'Gesicht', icon: 'happy', color: ['#4ECDC4', '#44A08D'] },
        { id: 'hair', name: 'Haare', icon: 'cut', color: ['#FFB923', '#FF6B6B'] },
        { id: 'body', name: 'Körper', icon: 'body', color: ['#A8E6CF', '#7FD8BE'] },
        { id: 'lips', name: 'Lippen', icon: 'heart', color: ['#FF6B9D', '#FEC8D8'] },
      ];
      setCategories(categoriesData);

      // Load recipes - ERWEITERTE REZEPTE-DATENBANK
      const recipesData: Recipe[] = [
        {
          id: '1',
          title: 'Avocado Honig Gesichtsmaske',
          category: 'face',
          difficulty: 'easy',
          time: 15,
          ingredients: [
            '1/2 reife Avocado',
            '1 EL Bio-Honig',
            '1 TL Joghurt',
            '2 Tropfen Vitamin E Öl (optional)'
          ],
          instructions: [
            'Avocado in einer Schüssel zerdrücken bis eine cremige Masse entsteht',
            'Honig und Joghurt hinzufügen und gut vermischen',
            'Optional: Vitamin E Öl für extra Pflege hinzufügen',
            'Gesicht reinigen und die Maske gleichmäßig auftragen',
            '15-20 Minuten einwirken lassen',
            'Mit lauwarmem Wasser abspülen und Gesicht trocken tupfen',
            'Anschließend Ihre normale Feuchtigkeitscreme auftragen'
          ],
          benefits: [
            'Intensive Feuchtigkeitspflege',
            'Reich an Vitaminen A, D und E',
            'Beruhigt gereizte Haut',
            'Verbessert die Hautelastizität',
            'Natürliche Anti-Aging Wirkung'
          ],
          image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273',
          isPremium: false,
          rating: 4.8,
          reviews: 234,
          isFavorite: false,
          tips: [
            'Verwenden Sie nur reife Avocados für beste Ergebnisse',
            'Testen Sie die Maske erst an einer kleinen Hautstelle',
            'Ideal für trockene und normale Hauttypen'
          ],
          warnings: [
            'Nicht bei Avocado-Allergie verwenden',
            'Vermeiden Sie die Augenpartie'
          ]
        },
        {
          id: '2',
          title: 'Grüntee Matcha Antioxidant Maske',
          category: 'face',
          difficulty: 'easy',
          time: 20,
          ingredients: [
            '2 TL Matcha Pulver',
            '1 EL Honig',
            '1 EL Aloe Vera Gel',
            '1 TL Haferflocken (fein gemahlen)'
          ],
          instructions: [
            'Matcha Pulver mit warmem Wasser zu einer Paste anrühren',
            'Honig und Aloe Vera Gel hinzufügen',
            'Haferflocken unterrühren für sanfte Exfoliation',
            'Auf das gereinigte Gesicht auftragen',
            '15-20 Minuten einwirken lassen',
            'Mit kreisenden Bewegungen und warmem Wasser abmassieren',
            'Feuchtigkeitscreme auftragen'
          ],
          benefits: [
            'Starke Antioxidantien gegen freie Radikale',
            'Beruhigt entzündete Haut',
            'Verfeinert das Hautbild',
            'Verleiht natürlichen Glow',
            'Strafft die Haut'
          ],
          image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
          isPremium: false,
          rating: 4.7,
          reviews: 189,
          isFavorite: false
        },
        {
          id: '3',
          title: 'Kokosöl Protein Haarmaske',
          category: 'hair',
          difficulty: 'easy',
          time: 30,
          ingredients: [
            '3 EL Kokosöl',
            '1 EL Honig',
            '1 Ei (optional für extra Protein)',
            '5 Tropfen Rosmarinöl'
          ],
          instructions: [
            'Kokosöl bei Bedarf leicht erwärmen bis es flüssig ist',
            'Honig und optional das Ei hinzufügen',
            'Rosmarinöl für bessere Durchblutung einrühren',
            'Haare anfeuchten und die Maske vom Ansatz bis in die Spitzen einmassieren',
            '30-45 Minuten einwirken lassen (mit Handtuch umwickeln)',
            'Gründlich mit Shampoo auswaschen (evtl. 2x shampoonieren)'
          ],
          benefits: [
            'Tiefenwirksame Pflege',
            'Repariert geschädigtes Haar',
            'Verleiht Glanz und Geschmeidigkeit',
            'Fördert das Haarwachstum',
            'Reduziert Spliss'
          ],
          image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc',
          isPremium: false,
          rating: 4.9,
          reviews: 456,
          isFavorite: false
        },
        {
          id: '4',
          title: 'Kaffee-Peeling für strahlende Haut',
          category: 'body',
          difficulty: 'easy',
          time: 10,
          ingredients: [
            '1/2 Tasse Kaffeesatz',
            '1/4 Tasse Kokosöl',
            '1/4 Tasse brauner Zucker',
            '1 TL Vanilleextrakt'
          ],
          instructions: [
            'Alle Zutaten in einer Schüssel vermischen',
            'Unter der Dusche auf die feuchte Haut auftragen',
            'In kreisenden Bewegungen einmassieren',
            '5-10 Minuten einwirken lassen',
            'Mit warmem Wasser abspülen'
          ],
          benefits: [
            'Entfernt abgestorbene Hautzellen',
            'Regt die Durchblutung an',
            'Kann Cellulite mindern',
            'Macht die Haut weich und glatt'
          ],
          image: 'https://images.unsplash.com/photo-1570554520913-ce3192c34509',
          isPremium: true,
          rating: 4.7,
          reviews: 189,
          isFavorite: false
        },
        {
          id: '5',
          title: 'Honig-Zimt Lippenpeeling',
          category: 'lips',
          difficulty: 'easy',
          time: 5,
          ingredients: [
            '1 TL Honig',
            '1 TL brauner Zucker',
            '1/2 TL Zimt',
            '1/2 TL Kokosöl'
          ],
          instructions: [
            'Alle Zutaten vermischen',
            'Sanft auf die Lippen auftragen',
            '1-2 Minuten massieren',
            'Mit warmem Wasser abspülen',
            'Lippenbalsam auftragen'
          ],
          benefits: [
            'Entfernt trockene Hautschüppchen',
            'Macht die Lippen weich',
            'Regt die Durchblutung an',
            'Natürliches Volumen'
          ],
          image: 'https://images.unsplash.com/photo-1583248369069-9d91f1640fe6',
          isPremium: false,
          rating: 4.9,
          reviews: 321,
          isFavorite: false
        },
        {
          id: '6',
          title: 'Tonerde Detox Maske',
          category: 'face',
          difficulty: 'medium',
          time: 25,
          ingredients: [
            '2 EL Bentonit Tonerde',
            '1 EL Rosenwasser',
            '1 TL Apfelessig',
            '2 Tropfen Teebaumöl',
            '1 TL Aloe Vera Gel'
          ],
          instructions: [
            'Tonerde in einer Glasschüssel mit Rosenwasser vermischen',
            'Apfelessig tropfenweise hinzufügen bis cremige Konsistenz',
            'Teebaumöl und Aloe Vera Gel einrühren',
            'Auf T-Zone und Problemzonen auftragen',
            '15-20 Minuten trocknen lassen',
            'Mit warmem Wasser und sanften Bewegungen entfernen',
            'Beruhigende Feuchtigkeitscreme auftragen'
          ],
          benefits: [
            'Zieht Unreinheiten und Giftstoffe aus den Poren',
            'Reduziert überschüssigen Talg',
            'Verfeinert vergrößerte Poren',
            'Bekämpft Akne und Mitesser',
            'Mattiert fettige Haut'
          ],
          image: 'https://images.unsplash.com/photo-1570554520606-2bbcaae9a3e1',
          isPremium: true,
          rating: 4.6,
          reviews: 145,
          isFavorite: false
        },
        {
          id: '7',
          title: 'Avocado Bananen Haarmaske',
          category: 'hair',
          difficulty: 'easy',
          time: 25,
          ingredients: [
            '1/2 reife Avocado',
            '1 reife Banane',
            '2 EL Olivenöl',
            '1 EL Honig',
            '1 TL Zitronensaft'
          ],
          instructions: [
            'Avocado und Banane gründlich zerdrücken bis keine Stücke mehr vorhanden',
            'Olivenöl und Honig hinzufügen und gut vermischen',
            'Zitronensaft für Glanz einrühren',
            'Auf das feuchte Haar auftragen, besonders in die Längen und Spitzen',
            '20-30 Minuten unter einer Duschhaube einwirken lassen',
            'Gründlich mit warmem Wasser und Shampoo ausspülen'
          ],
          benefits: [
            'Intensive Feuchtigkeitspflege für trockenes Haar',
            'Reich an Vitaminen und Mineralien',
            'Macht das Haar weich und geschmeidig',
            'Repariert strapaziertes Haar',
            'Verleiht natürlichen Glanz'
          ],
          image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b',
          isPremium: false,
          rating: 4.7,
          reviews: 321,
          isFavorite: false
        },
        {
          id: '8',
          title: 'Meersalz Detox Peeling',
          category: 'body',
          difficulty: 'easy',
          time: 15,
          ingredients: [
            '1/2 Tasse grobes Meersalz',
            '1/4 Tasse Olivenöl',
            '2 EL Honig',
            '10 Tropfen Zitronenöl',
            '1 TL getrockneter Rosmarin'
          ],
          instructions: [
            'Meersalz und getrockneten Rosmarin vermischen',
            'Olivenöl und Honig hinzufügen',
            'Zitronenöl einrühren',
            'Auf die feuchte Haut auftragen',
            'Mit kreisenden Bewegungen 3-5 Minuten massieren',
            'Gründlich mit warmem Wasser abspülen',
            'Feuchtigkeitscreme auftragen'
          ],
          benefits: [
            'Entgiftet und reinigt die Haut porentief',
            'Entfernt abgestorbene Hautzellen',
            'Stimuliert die Durchblutung',
            'Macht die Haut samtig weich',
            'Belebt müde Haut'
          ],
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
          isPremium: false,
          rating: 4.5,
          reviews: 156,
          isFavorite: false
        },
        {
          id: '9',
          title: 'Vanille-Zucker Lippenpeeling',
          category: 'lips',
          difficulty: 'easy',
          time: 8,
          ingredients: [
            '2 TL feiner Zucker',
            '1 TL Honig',
            '1/2 TL Vanilleextrakt',
            '1 TL Kokosöl',
            '2 Tropfen Vitamin E Öl'
          ],
          instructions: [
            'Zucker und Kokosöl vermischen',
            'Honig und Vanilleextrakt hinzufügen',
            'Vitamin E Öl einrühren',
            'Mit dem Finger sanft auf die Lippen auftragen',
            'In kreisenden Bewegungen 1-2 Minuten massieren',
            'Mit einem feuchten Tuch abnehmen',
            'Lippenbalsam auftragen'
          ],
          benefits: [
            'Sanfte Exfoliation ohne Irritationen',
            'Spendet intensive Feuchtigkeit',
            'Verleiht natürlichen Glanz',
            'Bereitet die Lippen für Lippenstift vor',
            'Angenehmer Vanilleduft'
          ],
          image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273',
          isPremium: false,
          rating: 4.7,
          reviews: 187,
          isFavorite: false
        },
        {
          id: '10',
          title: 'Arganöl Repair Maske',
          category: 'hair',
          difficulty: 'medium',
          time: 45,
          ingredients: [
            '3 EL Arganöl',
            '2 EL Sheabutter',
            '1 EL Aloe Vera Gel',
            '5 Tropfen Lavendelöl',
            '1 TL Vitamin E Öl'
          ],
          instructions: [
            'Sheabutter im Wasserbad schmelzen und abkühlen lassen',
            'Arganöl und Aloe Vera Gel einrühren',
            'Lavendelöl und Vitamin E Öl hinzufügen',
            'Von den Längen zu den Spitzen auftragen, Ansatz aussparen',
            '30-45 Minuten oder über Nacht einwirken lassen',
            'Mit mildem Shampoo gründlich auswaschen',
            'Bei Bedarf Conditioner verwenden'
          ],
          benefits: [
            'Repariert stark geschädigtes und chemisch behandeltes Haar',
            'Intense Feuchtigkeitspflege',
            'Reduziert Haarbruch und Spliss',
            'Macht das Haar elastisch und widerstandsfähig',
            'Beruhigt die Kopfhaut'
          ],
          image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
          isPremium: true,
          rating: 4.8,
          reviews: 187,
          isFavorite: false
        },
        {
          id: '11',
          title: 'Haferflocken Beruhigungs-Maske',
          category: 'face',
          difficulty: 'easy',
          time: 15,
          ingredients: [
            '3 EL feine Haferflocken',
            '2 EL warme Milch',
            '1 TL Honig',
            '1/2 TL Olivenöl'
          ],
          instructions: [
            'Haferflocken in warmem Wasser 5 Minuten einweichen',
            'Milch, Honig und Olivenöl hinzufügen',
            'Zu einer dickflüssigen Paste verrühren',
            'Auf das gereinigte Gesicht auftragen',
            '15 Minuten einwirken lassen',
            'Mit kreisenden Bewegungen sanft abmassieren',
            'Mit lauwarmem Wasser abspülen'
          ],
          benefits: [
            'Beruhigt sensible und gereizte Haut',
            'Sanfte Exfoliation abgestorbener Hautzellen',
            'Spendet Feuchtigkeit',
            'Reduziert Rötungen',
            'Ideal für empfindliche Haut'
          ],
          image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58',
          isPremium: false,
          rating: 4.5,
          reviews: 167,
          isFavorite: false
        },
        {
          id: '12',
          title: 'Bier Volumen Haarmaske',
          category: 'hair',
          difficulty: 'easy',
          time: 20,
          ingredients: [
            '1/2 Tasse warmes Bier (alkoholfrei)',
            '1 Eigelb',
            '1 EL Honig',
            '1 TL Olivenöl'
          ],
          instructions: [
            'Bier offen stehen lassen bis es zimmerwarm und schal ist',
            'Eigelb, Honig und Olivenöl hinzufügen',
            'Alle Zutaten gut vermischen',
            'Auf das feuchte Haar auftragen, besonders am Ansatz',
            '15-20 Minuten einwirken lassen',
            'Mit kühlem Wasser und mildem Shampoo ausspülen'
          ],
          benefits: [
            'Verleiht Volumen und Fülle',
            'Stärkt die Haarstruktur',
            'Verleiht natürlichen Glanz',
            'Reinigt sanft ohne auszutrocknen',
            'Reich an B-Vitaminen'
          ],
          image: 'https://images.unsplash.com/photo-1574263867128-ed78e8151786',
          isPremium: false,
          rating: 4.4,
          reviews: 143,
          isFavorite: false
        },
        {
          id: '13',
          title: 'Zucker-Zimt Körperpeeling',
          category: 'body',
          difficulty: 'easy',
          time: 12,
          ingredients: [
            '3/4 Tasse brauner Zucker',
            '1/3 Tasse Mandelöl',
            '1 TL gemahlener Zimt',
            '1 TL Vanilleextrakt',
            '2 EL Honig'
          ],
          instructions: [
            'Zucker und Zimt in einer Schüssel vermischen',
            'Mandelöl langsam hinzufügen und rühren',
            'Vanilleextrakt und Honig unterrühren',
            'Auf die feuchte Haut auftragen',
            'Sanft in kreisenden Bewegungen einmassieren',
            '2-3 Minuten einwirken lassen',
            'Mit lauwarmem Wasser abspülen'
          ],
          benefits: [
            'Sanfte Exfoliation für empfindliche Haut',
            'Verbessert die Hautdurchblutung',
            'Spendet intensive Feuchtigkeit',
            'Hinterlässt angenehmen Duft',
            'Macht die Haut babyzart'
          ],
          image: 'https://images.unsplash.com/photo-1596957997851-b4de7c4bbf55',
          isPremium: false,
          rating: 4.6,
          reviews: 201,
          isFavorite: false
        },
        {
          id: '14',
          title: 'Kaffee Lippenpeeling',
          category: 'lips',
          difficulty: 'easy',
          time: 6,
          ingredients: [
            '1 TL fein gemahlener Kaffee',
            '1 TL brauner Zucker',
            '1 TL Honig',
            '1/2 TL Olivenöl'
          ],
          instructions: [
            'Kaffee und Zucker mischen',
            'Honig und Olivenöl hinzufügen',
            'Zu einer Paste verrühren',
            'Sanft auf die Lippen auftragen',
            '1 Minute vorsichtig massieren',
            'Mit lauwarmem Wasser abspülen',
            'Pflegenden Lippenbalsam auftragen'
          ],
          benefits: [
            'Entfernt abgestorbene Hautzellen',
            'Regt die Durchblutung an für vollere Lippen',
            'Macht die Lippen glatt und weich',
            'Bereitet optimal für Lippenpflege vor',
            'Natürliches Koffein belebt'
          ],
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
          isPremium: false,
          rating: 4.6,
          reviews: 143,
          isFavorite: false
        },
        {
          id: '15',
          title: 'Rizinusöl Wachstums-Haarmaske',
          category: 'hair',
          difficulty: 'easy',
          time: 60,
          ingredients: [
            '2 EL Rizinusöl',
            '1 EL Kokosöl',
            '5 Tropfen Rosmarinöl',
            '3 Tropfen Pfefferminzöl',
            '1 TL Honig'
          ],
          instructions: [
            'Rizinusöl und Kokosöl leicht erwärmen',
            'Ätherische Öle und Honig hinzufügen',
            'Gut vermischen und auf Zimmertemperatur abkühlen',
            'In die Kopfhaut einmassieren mit kreisenden Bewegungen',
            'Durch die Längen verteilen',
            '45-60 Minuten oder über Nacht einwirken lassen',
            'Mit Shampoo gründlich auswaschen (2-3x wenn nötig)'
          ],
          benefits: [
            'Stimuliert das Haarwachstum',
            'Stärkt die Haarwurzeln',
            'Verleiht Glanz und Geschmeidigkeit',
            'Reduziert Haarausfall',
            'Nährt die Kopfhaut intensiv'
          ],
          image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
          isPremium: true,
          rating: 4.7,
          reviews: 278,
          isFavorite: false
        }
      ];

      setRecipes(recipesData);

      // Load favorites
      const savedFavorites = await AsyncStorage.getItem('favoriteRecipes');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // PERFORMANCE: Optimierte Filter-Funktion mit useMemo
  const filterRecipes = useCallback(() => {
    let filtered = [...recipes];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    // Search filter - PERFORMANCE: Erweiterte Suche
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.toLowerCase().includes(query)) ||
        r.benefits.some(b => b.toLowerCase().includes(query)) ||
        r.instructions.some(inst => inst.toLowerCase().includes(query))
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(r => r.difficulty === selectedDifficulty);
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'time':
        filtered.sort((a, b) => a.time - b.time);
        break;
      case 'newest':
      default:
        // Keep original order
        break;
    }

    setFilteredRecipes(filtered);
  }, [recipes, selectedCategory, debouncedSearchQuery, selectedDifficulty, sortBy]);

  // PERFORMANCE: Memoized functions
  const toggleFavorite = useCallback(async (recipeId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newFavorites = favorites.includes(recipeId)
      ? favorites.filter(id => id !== recipeId)
      : [...favorites, recipeId];
    
    setFavorites(newFavorites);
    await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(newFavorites));
    
    setRecipes(prev => prev.map(recipe => 
      recipe.id === recipeId 
        ? { ...recipe, isFavorite: !recipe.isFavorite }
        : recipe
    ));
  }, [favorites]);

  const canAccessRecipe = useCallback((recipe: Recipe): boolean => {
    if (!recipe.isPremium) return true;
    if (premiumTier !== 'basic') return true;
    if (purchasedRecipes.includes(recipe.id)) return true;
    return false;
  }, [premiumTier, purchasedRecipes]);

  const handleRecipePress = useCallback(async (recipe: Recipe) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!canAccessRecipe(recipe)) {
      Alert.alert(
        'Premium Rezept',
        'Dieses Rezept ist nur für Premium-Mitglieder verfügbar. Möchten Sie es für 0,99€ einzeln kaufen oder Premium werden?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { 
            text: 'Einzeln kaufen (0,99€)', 
            onPress: () => handleSinglePurchase(recipe)
          },
          { 
            text: 'Premium werden', 
            onPress: () => console.log('Navigate to premium')
          }
        ]
      );
      return;
    }
    
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  }, [canAccessRecipe]);

  const handleSinglePurchase = useCallback(async (recipe: Recipe) => {
    // Hier würde die echte Kaufabwicklung stattfinden
    Alert.alert('Kauf erfolgreich!', `Sie haben "${recipe.title}" erfolgreich gekauft.`);
    addPurchasedRecipe(recipe.id);
  }, [addPurchasedRecipe]);

  const shareRecipe = useCallback(async (recipe: Recipe) => {
    try {
      await Share.share({
        message: `Schau dir dieses tolle DIY Beauty-Rezept an: ${recipe.title}\n\nZutaten:\n${recipe.ingredients.join('\n')}\n\nFinde mehr Rezepte in der GlowMatch App!`,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, []);

  // PERFORMANCE: Memoized renderRecipeCard
  const renderRecipeCard = useCallback(({ item }: { item: Recipe }) => {
    const isAccessible = canAccessRecipe(item);
    const isFavorite = favorites.includes(item.id);

    return (
      <RecipeCard
        item={item}
        onPress={handleRecipePress}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        isAccessible={isAccessible}
      />
    );
  }, [favorites, canAccessRecipe, handleRecipePress, toggleFavorite]);

  // PERFORMANCE: Memoized getItemLayout für FlatList
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 280, // Höhe eines Recipe Cards + Margin
    offset: 280 * Math.floor(index / 2), // 2 Spalten
    index,
  }), []);

  // PERFORMANCE: Memoized keyExtractor
  const keyExtractor = useCallback((item: Recipe) => item.id, []);

  const renderRecipeModal = () => {
    if (!selectedRecipe) return null;

    return (
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header Image */}
            <View style={styles.modalImageContainer}>
              <Image 
                source={{ uri: selectedRecipe.image }} 
                style={styles.modalImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.modalImageGradient}
              >
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowRecipeModal(false)}
                >
                  <BlurView intensity={80} style={styles.blurButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </BlurView>
                </TouchableOpacity>
                
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleFavorite(selectedRecipe.id)}
                    >
                      <Ionicons 
                        name={favorites.includes(selectedRecipe.id) ? "heart" : "heart-outline"} 
                        size={24} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => shareRecipe(selectedRecipe)}
                    >
                      <Ionicons name="share-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.modalContent}>
              {/* Quick Info */}
              <View style={styles.quickInfo}>
                <View style={styles.infoBox}>
                  <Ionicons name="time" size={24} color="#6b46c1" />
                  <Text style={styles.infoLabel}>Zeit</Text>
                  <Text style={styles.infoValue}>{selectedRecipe.time} Min</Text>
                </View>
                <View style={styles.infoBox}>
                  <Ionicons name="speedometer" size={24} color="#FFB923" />
                  <Text style={styles.infoLabel}>Schwierigkeit</Text>
                  <Text style={styles.infoValue}>
                    {selectedRecipe.difficulty === 'easy' ? 'Einfach' : 
                     selectedRecipe.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text style={styles.infoLabel}>Bewertung</Text>
                  <Text style={styles.infoValue}>{selectedRecipe.rating}/5</Text>
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vorteile</Text>
                {selectedRecipe.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.benefitItemText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              {/* Ingredients */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Zutaten</Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>

              {/* Instructions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Anleitung</Text>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              {/* Tips */}
              {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tipps</Text>
                  <View style={styles.tipsContainer}>
                    {selectedRecipe.tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <Ionicons name="bulb" size={16} color="#FFB923" />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Warnings */}
              {selectedRecipe.warnings && selectedRecipe.warnings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hinweise</Text>
                  <View style={styles.warningsContainer}>
                    {selectedRecipe.warnings.map((warning, index) => (
                      <View key={index} style={styles.warningItem}>
                        <Ionicons name="warning" size={16} color="#FF6B6B" />
                        <Text style={styles.warningText}>{warning}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Video Tutorial */}
              {selectedRecipe.videoUrl && (
                <TouchableOpacity style={styles.videoButton}>
                  <Ionicons name="play-circle" size={24} color="#fff" />
                  <Text style={styles.videoButtonText}>Video-Tutorial ansehen</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filterModalContainer}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter & Sortierung</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Schwierigkeit</Text>
            <View style={styles.filterOptions}>
              {['all', 'easy', 'medium', 'hard'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterOption,
                    selectedDifficulty === level && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedDifficulty(level)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedDifficulty === level && styles.filterOptionTextActive
                  ]}>
                    {level === 'all' ? 'Alle' :
                     level === 'easy' ? 'Einfach' :
                     level === 'medium' ? 'Mittel' : 'Schwer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sortieren nach</Text>
            <View style={styles.filterOptions}>
              {[
                { id: 'newest', label: 'Neueste' },
                { id: 'popular', label: 'Beliebteste' },
                { id: 'time', label: 'Schnellste' }
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.id}
                  style={[
                    styles.filterOption,
                    sortBy === sort.id && styles.filterOptionActive
                  ]}
                  onPress={() => setSortBy(sort.id as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    sortBy === sort.id && styles.filterOptionTextActive
                  ]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyFiltersText}>Filter anwenden</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b46c1" />
        <Text style={styles.loadingText}>Lade Rezepte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6b46c1', '#8b5cf6']}
        style={styles.header}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.headerTitle}>DIY Beauty Rezepte</Text>
          <Text style={styles.headerSubtitle}>
            {premiumTier === 'basic' 
              ? `${filteredRecipes.filter(r => !r.isPremium).length} kostenlose Rezepte`
              : `${filteredRecipes.length} Rezepte verfügbar`}
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Search Bar - PERFORMANCE: Mit Loading Indicator */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rezepte oder Zutaten suchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {/* PERFORMANCE: Loading Indicator während der Suche */}
          {searchQuery !== debouncedSearchQuery && (
            <ActivityIndicator size="small" color="#6b46c1" />
          )}
          {searchQuery.length > 0 && searchQuery === debouncedSearchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#6b46c1" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <LinearGradient
              colors={selectedCategory === category.id ? category.color : ['#f0f0f0', '#f0f0f0']}
              style={styles.categoryGradient}
            >
              <Ionicons 
                name={category.icon as any} 
                size={20} 
                color={selectedCategory === category.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipes List - PERFORMANCE OPTIMIERT */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.recipeRow}
        contentContainerStyle={styles.recipesList}
        showsVerticalScrollIndicator={false}
        // PERFORMANCE OPTIMIERUNGEN:
        removeClippedSubviews={true}        // Entfernt nicht sichtbare Items
        maxToRenderPerBatch={6}             // Rendert nur 6 Items gleichzeitig  
        updateCellsBatchingPeriod={50}      // Update-Intervall
        initialNumToRender={6}              // Startet mit 6 Items
        windowSize={10}                     // Anzahl der gerenderten Screens
        getItemLayout={getItemLayout}       // Optimiert Scroll-Performance
        onEndReachedThreshold={0.5}         // Lädt weitere Items bei 50% Scroll
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Keine Rezepte gefunden</Text>
            <Text style={styles.emptySubtext}>
              Versuchen Sie eine andere Suche oder Kategorie
            </Text>
          </View>
        }
      />

      {renderRecipeModal()}
      {renderFiltersModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b46c1',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryChip: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryChipActive: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  recipesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  recipeRow: {
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  recipeImageContainer: {
    position: 'relative',
    height: 150,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  premiumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 40,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  benefitsPreview: {
    gap: 4,
  },
  benefitChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  benefitText: {
    fontSize: 11,
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalImageContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
  },
  blurButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6b46c1',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6b46c1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  warningsContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  videoButton: {
    backgroundColor: '#6b46c1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  videoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    backgroundColor: '#6b46c1',
    borderColor: '#6b46c1',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  applyFiltersButton: {
    backgroundColor: '#6b46c1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyFiltersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecipesScreen;