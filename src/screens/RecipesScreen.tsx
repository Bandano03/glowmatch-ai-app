import React, { useState, useEffect, useContext, useRef } from 'react';
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

export function RecipesScreen() {
  const { user, premiumTier, purchasedRecipes, addPurchasedRecipe } = useContext(UserContext);
  
  // States
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    filterRecipes();
  }, [selectedCategory, searchQuery, recipes, selectedDifficulty, sortBy]);

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
        { id: 'all', name: 'Alle', icon: 'apps', color: ['#FFB6C1', '#FFC0CB'] },  // Pastellpink
        { id: 'face', name: 'Gesicht', icon: 'happy', color: ['#B3E5D1', '#A8D8C1'] },  // Pastellmint
        { id: 'hair', name: 'Haare', icon: 'cut', color: ['#FFD4A3', '#FFBF9B'] },  // Pastellpfirsich
        { id: 'body', name: 'Körper', icon: 'body', color: ['#E6E6FA', '#D8BFD8'] },  // Pastelllavendel
        { id: 'lips', name: 'Lippen', icon: 'heart', color: ['#FFDAB9', '#FFE4B5'] },  // Pastellapricot
      ];
      setCategories(categoriesData);
// Erweiterte Rezepte-Datenbank - Ersetzen Sie den recipesData Array in RecipesScreen.tsx

const recipesData: Recipe[] = [
  // GESICHTSMASKEN
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
    id: '4',
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
    id: '5',
    title: 'Kurkuma Glow Maske',
    category: 'face',
    difficulty: 'medium',
    time: 20,
    ingredients: [
      '1 TL Kurkuma Pulver',
      '2 EL Kichererbsenmehl',
      '2 EL Milch oder Buttermilch',
      '1 TL Honig',
      '2 Tropfen Rosenwasser'
    ],
    instructions: [
      'Kurkuma und Kichererbsenmehl in einer Schüssel mischen',
      'Milch langsam hinzufügen bis cremige Konsistenz',
      'Honig und Rosenwasser einrühren',
      'Gleichmäßig auf das Gesicht auftragen (Augen aussparen)',
      '15-20 Minuten einwirken lassen bis trocken',
      'Mit lauwarmem Wasser und sanften Bewegungen entfernen',
      'Feuchtigkeitscreme auftragen'
    ],
    benefits: [
      'Verleiht natürlichen Glow und Ausstrahlung',
      'Entzündungshemmende Wirkung',
      'Bekämpft Akne und Unreinheiten',
      'Hellt Pigmentflecken auf',
      'Traditionelle ayurvedische Schönheitspflege'
    ],
    image: 'https://images.unsplash.com/photo-1556909197-f5e4d94e8e36',
    isPremium: true,
    rating: 4.8,
    reviews: 203,
    isFavorite: false,
    warnings: [
      'Kann Kleidung und Handtücher gelb färben',
      'Bei heller Haut kann temporäre gelbliche Verfärbung auftreten'
    ]
  },

  // HAARMASKEN
  {
    id: '6',
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
    isFavorite: false,
    videoUrl: 'https://example.com/hair-mask-tutorial'
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
    id: '9',
    title: 'Bier Volumen Maske',
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
    id: '10',
    title: 'Reismehl Protein Maske',
    category: 'hair',
    difficulty: 'medium',
    time: 35,
    ingredients: [
      '3 EL Reismehl',
      '1/2 Tasse Kokosmilch',
      '1 EL Honig',
      '1 TL Jojobaöl',
      '3 Tropfen Ylang-Ylang Öl'
    ],
    instructions: [
      'Reismehl mit warmer Kokosmilch zu einer Paste anrühren',
      '10 Minuten quellen lassen',
      'Honig, Jojobaöl und ätherisches Öl einrühren',
      'Gleichmäßig auf das gewaschene, handtuchtrockene Haar auftragen',
      '25-30 Minuten einwirken lassen',
      'Gründlich mit lauwarmem Wasser ausspülen',
      'Conditioner verwenden'
    ],
    benefits: [
      'Stärkt schwaches und brüchiges Haar',
      'Verleiht Protein für mehr Elastizität',
      'Macht das Haar glänzend und geschmeidig',
      'Beruhigt die Kopfhaut',
      'Ideal für coloriertes Haar'
    ],
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91',
    isPremium: true,
    rating: 4.6,
    reviews: 98,
    isFavorite: false
  },
  {
    id: '11',
    title: 'Rizinusöl Wachstums-Maske',
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
  },

  // KÖRPERPEELINGS & MASKEN
  {
    id: '12',
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
    id: '13',
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
    id: '14',
    title: 'Zucker-Zimt Peeling',
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
    id: '15',
    title: 'Grüner Tee Körpermaske',
    category: 'body',
    difficulty: 'medium',
    time: 25,
    ingredients: [
      '4 Beutel grüner Tee',
      '1 Tasse heißes Wasser',
      '3 EL Tonerde',
      '2 EL Honig',
      '1 EL Joghurt'
    ],
    instructions: [
      'Tee mit heißem Wasser aufgießen und 10 Minuten ziehen lassen',
      'Teebeutel entfernen und Tee abkühlen lassen',
      '4 EL des Tees mit Tonerde vermischen',
      'Honig und Joghurt einrühren bis cremige Konsistenz',
      'Auf die gereinigte Haut auftragen',
      '15-20 Minuten einwirken lassen',
      'Mit lauwarmem Wasser abspülen'
    ],
    benefits: [
      'Antioxidantien bekämpfen freie Radikale',
      'Beruhigt gereizte und entzündete Haut',
      'Strafft und festigt die Haut',
      'Reduziert Hautrötungen',
      'Verleiht einen gesunden Glow'
    ],
    image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b',
    isPremium: true,
    rating: 4.4,
    reviews: 123,
    isFavorite: false
  },

  // LIPPENPEELING & PFLEGE
  {
    id: '16',
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
    id: '17',
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
    id: '18',
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
    id: '19',
    title: 'Rosenzucker Luxus-Lippenpeeling',
    category: 'lips',
    difficulty: 'medium',
    time: 10,
    ingredients: [
      '2 TL feiner Zucker',
      '1 TL Rosenwasser',
      '1 TL Sheabutter',
      '3 Tropfen Rosenöl',
      '1/2 TL Honig'
    ],
    instructions: [
      'Sheabutter leicht erwärmen bis weich',
      'Zucker und Rosenwasser vermischen',
      'Sheabutter und Honig hinzufügen',
      'Rosenöl einrühren',
      'Gleichmäßig auf die Lippen auftragen',
      '2-3 Minuten sanft einmassieren',
      'Mit einem weichen Tuch abnehmen',
      'Intensive Lippenpflege auftragen'
    ],
    benefits: [
      'Luxuriöse Pflege für besonders trockene Lippen',
      'Intensive Feuchtigkeitsspende',
      'Anti-Aging Wirkung für die Lippen',
      'Verleiht natürliche Rosé-Tönung',
      'Eleganter Rosenduft'
    ],
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c',
    isPremium: true,
    rating: 4.8,
    reviews: 95,
    isFavorite: false
  },

  // WEITERE GESICHTSMASKEN
  {
    id: '20',
    title: 'Gurken Aloe Vera Beruhigungsmaske',
    category: 'face',
    difficulty: 'easy',
    time: 20,
    ingredients: [
      '1/2 Gurke',
      '3 EL Aloe Vera Gel',
      '1 EL Honig',
      '1 TL Rosenwasser',
      '5 Tropfen Kamillenöl'
    ],
    instructions: [
      'Gurke schälen und in einem Mixer pürieren',
      'Gurkenpüree durch ein Sieb streichen',
      'Aloe Vera Gel und Honig hinzufügen',
      'Rosenwasser und Kamillenöl einrühren',
      'Auf das gereinigte Gesicht auftragen',
      '15-20 Minuten einwirken lassen',
      'Mit kaltem Wasser abspülen'
    ],
    benefits: [
      'Beruhigt gereizte und gerötete Haut',
      'Kühlt und erfrischt',
      'Spendet intensive Feuchtigkeit',
      'Reduziert Schwellungen',
      'Ideal nach Sonnenbad'
    ],
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
    isPremium: false,
    rating: 4.5,
    reviews: 234,
    isFavorite: false
  },
  {
    id: '21',
    title: 'Papaya Enzym Peeling-Maske',
    category: 'face',
    difficulty: 'medium',
    time: 15,
    ingredients: [
      '1/4 reife Papaya',
      '1 EL Honig',
      '1 TL Haferflocken (fein gemahlen)',
      '1 TL Zitronensaft',
      '2 EL Joghurt'
    ],
    instructions: [
      'Papaya schälen und zu Brei zerdrücken',
      'Honig und Joghurt hinzufügen',
      'Haferflocken und Zitronensaft einrühren',
      'Gleichmäßig auf das Gesicht auftragen',
      '10-15 Minuten einwirken lassen',
      'Mit kreisenden Bewegungen sanft abmassieren',
      'Mit lauwarmem Wasser abspülen'
    ],
    benefits: [
      'Natürliche Enzyme entfernen abgestorbene Hautzellen',
      'Hellt Pigmentflecken auf',
      'Verleiht strahlenden Teint',
      'Verfeinert das Hautbild',
      'Reich an Vitamin C'
    ],
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58',
    isPremium: true,
    rating: 4.7,
    reviews: 176,
    isFavorite: false
  },
  {
    id: '22',
    title: 'Schwarze Aktivkohle Maske',
    category: 'face',
    difficulty: 'medium',
    time: 25,
    ingredients: [
      '1 TL Aktivkohle Pulver',
      '2 EL Bentonit Tonerde',
      '1 EL Rosenwasser',
      '1 TL Teebaumöl',
      '1 EL Aloe Vera Gel'
    ],
    instructions: [
      'Aktivkohle und Tonerde in einer Glasschüssel mischen',
      'Rosenwasser langsam hinzufügen',
      'Teebaumöl und Aloe Vera Gel einrühren',
      'Zu einer glatten Paste verrühren',
      'Auf T-Zone und Problemzonen auftragen',
      '15-20 Minuten trocknen lassen',
      'Mit warmem Wasser und sanften Bewegungen entfernen'
    ],
    benefits: [
      'Zieht Giftstoffe und Unreinheiten aus den Poren',
      'Bekämpft hartnäckige Mitesser',
      'Mattiert fettige Haut',
      'Verfeinert vergrößerte Poren',
      'Ideal für unreine Haut'
    ],
    image: 'https://images.unsplash.com/photo-1556909197-f5e4d94e8e36',
    isPremium: true,
    rating: 4.6,
    reviews: 198,
    isFavorite: false
  },

  // WEITERE HAARMASKEN
  {
    id: '23',
    title: 'Zwiebel Anti-Haarausfall Maske',
    category: 'hair',
    difficulty: 'medium',
    time: 45,
    ingredients: [
      '1 mittelgroße Zwiebel',
      '2 EL Honig',
      '1 EL Olivenöl',
      '5 Tropfen Rosmarinöl',
      '1 TL Zitronensaft'
    ],
    instructions: [
      'Zwiebel schälen und fein pürieren',
      'Zwiebelsaft durch ein Tuch pressen',
      'Honig, Olivenöl und Zitronensaft hinzufügen',
      'Rosmarinöl einrühren',
      'In die Kopfhaut einmassieren',
      '30-45 Minuten einwirken lassen',
      'Gründlich mit Shampoo und viel Wasser auswaschen'
    ],
    benefits: [
      'Stimuliert die Haarwurzeln und fördert Wachstum',
      'Verbessert die Durchblutung der Kopfhaut',
      'Stärkt schwache Haarwurzeln',
      'Reduziert Haarausfall',
      'Reich an Schwefel für gesundes Haar'
    ],
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
    isPremium: true,
    rating: 4.5,
    reviews: 167,
    isFavorite: false,
    warnings: [
      'Starker Geruch - gründlich auswaschen',
      'Nicht bei empfindlicher Kopfhaut anwenden'
    ]
  },
  {
    id: '24',
    title: 'Joghurt Protein Maske',
    category: 'hair',
    difficulty: 'easy',
    time: 30,
    ingredients: [
      '1/2 Tasse griechischer Joghurt',
      '1 EL Honig',
      '2 EL Olivenöl',
      '1 TL Apfelessig',
      '5 Tropfen Lavendelöl'
    ],
    instructions: [
      'Joghurt auf Zimmertemperatur bringen',
      'Honig und Olivenöl hinzufügen',
      'Apfelessig und Lavendelöl einrühren',
      'Auf das feuchte Haar auftragen',
      'Besonders in die Längen und Spitzen einarbeiten',
      '20-30 Minuten unter einer Duschhaube lassen',
      'Mit lauwarmem Wasser und mildem Shampoo ausspülen'
    ],
    benefits: [
      'Versorgt das Haar mit wichtigen Proteinen',
      'Stärkt die Haarstruktur',
      'Verleiht Glanz und Geschmeidigkeit',
      'Beruhigt die Kopfhaut',
      'Ideal für strapaziertes Haar'
    ],
    image: 'https://images.unsplash.com/photo-1574263867128-ed78e8151786',
    isPremium: false,
    rating: 4.6,
    reviews: 211,
    isFavorite: false
  },
  {
    id: '25',
    title: 'Grüner Tee Kopfhaut Maske',
    category: 'hair',
    difficulty: 'easy',
    time: 25,
    ingredients: [
      '3 Beutel grüner Tee',
      '1 Tasse heißes Wasser',
      '2 EL Honig',
      '1 EL Kokosöl',
      '5 Tropfen Pfefferminzöl'
    ],
    instructions: [
      'Tee mit heißem Wasser aufbrühen und 15 Minuten ziehen lassen',
      'Teebeutel entfernen und Tee abkühlen lassen',
      'Honig und Kokosöl in den warmen Tee einrühren',
      'Pfefferminzöl hinzufügen',
      'In die Kopfhaut einmassieren',
      '20 Minuten einwirken lassen',
      'Mit lauwarmem Wasser ausspülen'
    ],
    benefits: [
      'Beruhigt gereizte Kopfhaut',
      'Antioxidantien schützen die Haarwurzeln',
      'Reduziert Schuppen und Juckreiz',
      'Erfrischt und belebt',
      'Fördert gesundes Haarwachstum'
    ],
    image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b',
    isPremium: false,
    rating: 4.4,
    reviews: 134,
    isFavorite: false
  },

  // SPEZIELLE TREATMENTS
  {
    id: '26',
    title: 'Rosen-Gesichtsdampfbad',
    category: 'face',
    difficulty: 'easy',
    time: 15,
    ingredients: [
      '2 Liter heißes Wasser',
      '1/4 Tasse getrocknete Rosenblüten',
      '5 Tropfen Rosenöl',
      '2 EL Kamillentee',
      '1 großes Handtuch'
    ],
    instructions: [
      'Heißes Wasser in eine große Schüssel geben',
      'Rosenblüten und Kamillentee hinzufügen',
      'Rosenöl ins Wasser träufeln',
      'Gesicht über die Schüssel halten (30cm Abstand)',
      'Kopf und Schüssel mit Handtuch bedecken',
      '10-15 Minuten dampfen lassen',
      'Gesicht mit kaltem Wasser abspülen'
    ],
    benefits: [
      'Öffnet die Poren für tiefe Reinigung',
      'Verbessert die Durchblutung',
      'Spendet intensive Feuchtigkeit',
      'Beruhigt gestresste Haut',
      'Entspannt und wirkt aromatherapeutisch'
    ],
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c',
    isPremium: false,
    rating: 4.7,
    reviews: 189,
    isFavorite: false
  },
  {
    id: '27',
    title: 'Henna Haar Glanz Treatment',
    category: 'hair',
    difficulty: 'hard',
    time: 120,
    ingredients: [
      '100g farbloses Henna Pulver',
      '1 Tasse warmes Wasser',
      '2 EL Zitronensaft',
      '1 EL Honig',
      '2 EL Joghurt',
      '1 TL Fenugreek Pulver'
    ],
    instructions: [
      'Henna Pulver mit warmem Wasser zu einer Paste anrühren',
      '2 Stunden ziehen lassen',
      'Zitronensaft, Honig und Joghurt hinzufügen',
      'Fenugreek Pulver einrühren',
      'Gleichmäßig auf das gewaschene Haar auftragen',
      '60-90 Minuten einwirken lassen',
      'Gründlich mit Wasser ausspülen (ohne Shampoo)',
      'Am nächsten Tag erst shampoonieren'
    ],
    benefits: [
      'Verleiht intensiven Glanz',
      'Stärkt und verdickt das Haar',
      'Reduziert Haarbruch',
      'Nährt die Kopfhaut',
      'Natürliche Haarkonditionierung'
    ],
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
    isPremium: true,
    rating: 4.8,
    reviews: 145,
    isFavorite: false,
    warnings: [
      'Kann bei hellem Haar leicht färben',
      'Patch-Test empfohlen'
    ]
  },

  // LUXUS TREATMENTS
  {
    id: '28',
    title: 'Gold Lifting Gesichtsmaske',
    category: 'face',
    difficulty: 'hard',
    time: 30,
    ingredients: [
      '1 Blatt Blattgold (essbar)',
      '2 EL Honig',
      '1 EL Arganöl',
      '1 TL Hyaluronsäure Serum',
      '5 Tropfen Vitamin C Serum',
      '1 EL Aloe Vera Gel'
    ],
    instructions: [
      'Honig leicht erwärmen',
      'Arganöl und Aloe Vera Gel hinzufügen',
      'Hyaluronsäure und Vitamin C Serum einrühren',
      'Blattgold vorsichtig in kleine Stücke zerteilen',
      'Maske auf das gereinigte Gesicht auftragen',
      'Goldstücke sanft eindrücken',
      '20-25 Minuten einwirken lassen',
      'Mit lauwarmem Wasser abspülen'
    ],
    benefits: [
      'Intensive Anti-Aging Wirkung',
      'Strafft und festigt die Haut',
      'Verleiht luxuriösen Glow',
      'Regt die Kollagenproduktion an',
      'Reduziert feine Linien'
    ],
    image: 'https://images.unsplash.com/photo-1556909197-f5e4d94e8e36',
    isPremium: true,
    rating: 4.9,
    reviews: 87,
    isFavorite: false
  },
  {
    id: '29',
    title: 'Kaviar Luxus Haarmaske',
    category: 'hair',
    difficulty: 'hard',
    time: 45,
    ingredients: [
      '2 EL Kaviar Extrakt (oder 1 TL echter Kaviar)',
      '3 EL Arganöl',
      '2 EL Sheabutter',
      '1 EL Keratin Serum',
      '5 Tropfen Rosenöl',
      '1 Eigelb'
    ],
    instructions: [
      'Sheabutter im Wasserbad schmelzen',
      'Arganöl und Keratin Serum hinzufügen',
      'Kaviar Extrakt und Eigelb einrühren',
      'Rosenöl hinzufügen',
      'Gut vermischen',
      'Auf das feuchte Haar auftragen',
      '30-45 Minuten unter Wärmehaube einwirken lassen',
      'Gründlich mit luxuriösem Shampoo auswaschen'
    ],
    benefits: [
      'Ultimative Luxuspflege für das Haar',
      'Reich an Aminosäuren und Vitaminen',
      'Repariert stark geschädigtes Haar',
      'Verleiht seidige Geschmeidigkeit',
      'Anti-Aging für die Haare'
    ],
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc',
    isPremium: true,
    rating: 4.9,
    reviews: 65,
    isFavorite: false
  },
  {
    id: '30',
    title: 'Platin Collagen Augenpads',
    category: 'face',
    difficulty: 'medium',
    time: 20,
    ingredients: [
      '2 EL Collagen Pulver',
      '3 EL destilliertes Wasser',
      '1 TL Platin Serum',
      '5 Tropfen Hyaluronsäure',
      '2 runde Wattepads',
      '1 TL Kamillenextrakt'
    ],
    instructions: [
      'Collagen Pulver mit destilliertem Wasser anrühren',
      '10 Minuten quellen lassen',
      'Platin Serum und Hyaluronsäure hinzufügen',
      'Kamillenextrakt einrühren',
      'Wattepads in der Mischung tränken',
      'Auf die gereinigte Augenpartie auflegen',
      '15-20 Minuten einwirken lassen',
      'Vorsichtig abnehmen und Augencreme auftragen'
    ],
    benefits: [
      'Reduziert Augenringe und Schwellungen',
      'Strafft die empfindliche Augenpartie',
      'Füllt feine Linien auf',
      'Intensive Feuchtigkeitspflege',
      'Luxuriöse Anti-Aging Behandlung'
    ],
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
    isPremium: true,
    rating: 4.8,
    reviews: 92,
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

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
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
  };

  const toggleFavorite = async (recipeId: string) => {
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
  };

  const canAccessRecipe = (recipe: Recipe): boolean => {
    if (!recipe.isPremium) return true;
    if (premiumTier !== 'basic') return true;
    if (purchasedRecipes.includes(recipe.id)) return true;
    return false;
  };

  const handleRecipePress = async (recipe: Recipe) => {
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
  };

  const handleSinglePurchase = async (recipe: Recipe) => {
    // Hier würde die echte Kaufabwicklung stattfinden
    Alert.alert('Kauf erfolgreich!', `Sie haben "${recipe.title}" erfolgreich gekauft.`);
    addPurchasedRecipe(recipe.id);
  };

  const shareRecipe = async (recipe: Recipe) => {
    try {
      await Share.share({
        message: `Schau dir dieses tolle DIY Beauty-Rezept an: ${recipe.title}\n\nZutaten:\n${recipe.ingredients.join('\n')}\n\nFinde mehr Rezepte in der GlowMatch App!`,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#98D8C8';  // Pastellmint
      case 'medium': return '#FFD4A3';  // Pastellpfirsich
      case 'hard': return '#FFA07A';  // Pastellkoralle
      default: return '#9A9A9A';
    }
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => {
    const isAccessible = canAccessRecipe(item);
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => handleRecipePress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.recipeImageContainer}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.recipeImage}
            defaultSource={require('../../assets/placeholder.png')}
          />
          {!isAccessible && (
            <View style={styles.premiumOverlay}>
              <Ionicons name="lock-closed" size={32} color="#fff" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FFA07A" : "#fff"} 
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
              <Ionicons name="time-outline" size={16} color="#7A7A7A" />
              <Text style={styles.detailText}>{item.time} Min</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star" size={16} color="#F0E68C" />
              <Text style={styles.detailText}>{item.rating}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#7A7A7A" />
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
  };

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
                  <Ionicons name="time" size={24} color="#FFB6C1" />
                  <Text style={styles.infoLabel}>Zeit</Text>
                  <Text style={styles.infoValue}>{selectedRecipe.time} Min</Text>
                </View>
                <View style={styles.infoBox}>
                  <Ionicons name="speedometer" size={24} color="#FFD4A3" />
                  <Text style={styles.infoLabel}>Schwierigkeit</Text>
                  <Text style={styles.infoValue}>
                    {selectedRecipe.difficulty === 'easy' ? 'Einfach' : 
                     selectedRecipe.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Ionicons name="star" size={24} color="#F0E68C" />
                  <Text style={styles.infoLabel}>Bewertung</Text>
                  <Text style={styles.infoValue}>{selectedRecipe.rating}/5</Text>
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vorteile</Text>
                {selectedRecipe.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#98D8C8" />
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
                        <Ionicons name="bulb" size={16} color="#FFD4A3" />
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
                        <Ionicons name="warning" size={16} color="#FFA07A" />
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
              <Ionicons name="close" size={24} color="#4A4A4A" />
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
        <ActivityIndicator size="large" color="#FFB6C1" />
        <Text style={styles.loadingText}>Lade Rezepte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFB6C1', '#FFC0CB']}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9A9A9A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rezepte oder Zutaten suchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9A9A9A"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9A9A9A" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#FFB6C1" />
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
              colors={selectedCategory === category.id ? category.color : ['#F0E0E0', '#F0E0E0']}
              style={styles.categoryGradient}
            >
              <Ionicons 
                name={category.icon as any} 
                size={20} 
                color={selectedCategory === category.id ? '#fff' : '#7A7A7A'} 
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

      {/* Recipes List */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.recipeRow}
        contentContainerStyle={styles.recipesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={64} color="#D8BFD8" />
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
    backgroundColor: '#FFF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFB6C1',
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
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A4A4A',
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
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#7A7A7A',
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
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    color: '#4A4A4A',
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
    color: '#7A7A7A',
  },
  benefitsPreview: {
    gap: 4,
  },
  benefitChip: {
    backgroundColor: '#E8F9E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  benefitText: {
    fontSize: 11,
    color: '#98D8C8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9A9A9A',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9A9A9A',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF9F5',
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
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitItemText: {
    fontSize: 16,
    color: '#4A4A4A',
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
    backgroundColor: '#FFB6C1',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFB6C1',
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
    color: '#4A4A4A',
    lineHeight: 24,
  },
  tipsContainer: {
    backgroundColor: '#FFF0E5',
    borderRadius: 12,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#7A7A7A',
    marginLeft: 8,
    flex: 1,
  },
  warningsContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    padding: 16,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7A7A7A',
    marginLeft: 8,
    flex: 1,
  },
  videoButton: {
    backgroundColor: '#FFB6C1',
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
    color: '#4A4A4A',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
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
    borderColor: '#F0E0E0',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    backgroundColor: '#FFB6C1',
    borderColor: '#FFB6C1',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  applyFiltersButton: {
    backgroundColor: '#FFB6C1',
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