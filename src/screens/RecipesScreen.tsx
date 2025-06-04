import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../App';
import { Recipe } from '../types/premium';

export function RecipesScreen() {
  const { premiumTier, purchasedRecipes, addPurchasedRecipe } = useContext(UserContext);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Mock Rezepte - in echter App aus Datenbank laden
  const recipes: Recipe[] = [
    {
      id: '1',
      title: 'Honig-Olivenöl Haarmaske',
      description: 'Natürliche Tiefenpflege für trockenes Haar',
      skinTypes: [],
      hairTypes: ['trocken', 'normal'],
      ingredients: {
        'honey': '2 EL Bio-Honig',
        'olive_oil': '3 EL Olivenöl',
        'egg': '1 Eigelb (optional)'
      },
      instructions: [
        'Honig und Olivenöl in einer Schüssel vermischen',
        'Optional Eigelb hinzufügen für extra Pflege',
        'Auf das feuchte Haar auftragen',
        '30 Minuten einwirken lassen',
        'Mit lauwarmem Wasser gründlich ausspülen'
      ],
      prepTime: 35,
      difficulty: 'einfach',
      price: 0,
      isFree: true,
      freeForPremium: [],
      category: 'haarpflege',
      benefits: ['Feuchtigkeit', 'Glanz', 'Geschmeidigkeit'],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Avocado-Aloe Gesichtsmaske',
      description: 'Beruhigende Maske für empfindliche Haut',
      skinTypes: ['trocken', 'sensibel'],
      hairTypes: [],
      ingredients: {
        'avocado': '1/2 reife Avocado',
        'aloe': '2 EL Aloe Vera Gel',
        'honey': '1 TL Honig'
      },
      instructions: [
        'Avocado mit einer Gabel zerdrücken',
        'Aloe Vera Gel und Honig unterrühren',
        'Auf das gereinigte Gesicht auftragen',
        '15 Minuten einwirken lassen',
        'Mit warmem Wasser abwaschen'
      ],
      prepTime: 20,
      difficulty: 'einfach',
      price: 2.00,
      isFree: false,
      freeForPremium: ['silver', 'gold'],
      category: 'hautpflege',
      benefits: ['Beruhigung', 'Feuchtigkeit', 'Anti-Aging'],
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Kaffee-Kokos Körperpeeling',
      description: 'Belebendes Peeling für seidig-glatte Haut',
      skinTypes: ['alle'],
      hairTypes: [],
      ingredients: {
        'coffee': '4 EL gemahlener Kaffee',
        'coconut_oil': '3 EL Kokosöl',
        'sugar': '2 EL brauner Zucker',
        'vanilla': '1 TL Vanilleextrakt'
      },
      instructions: [
        'Kokosöl leicht erwärmen bis es flüssig ist',
        'Kaffee, Zucker und Vanille hinzufügen',
        'Gut vermischen bis eine Paste entsteht',
        'Unter der Dusche auf die feuchte Haut auftragen',
        'In kreisenden Bewegungen einmassieren',
        'Mit warmem Wasser abspülen'
      ],
      prepTime: 10,
      difficulty: 'einfach',
      price: 3.50,
      isFree: false,
      freeForPremium: ['gold'],
      category: 'körperpflege',
      benefits: ['Peeling', 'Durchblutung', 'Cellulite-Reduktion'],
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      title: 'Rosenwasser-Toner',
      description: 'Erfrischender Toner für alle Hauttypen',
      skinTypes: ['alle'],
      hairTypes: [],
      ingredients: {
        'rose_petals': '1 Tasse frische Rosenblätter',
        'water': '2 Tassen destilliertes Wasser',
        'witch_hazel': '2 EL Hamamelis (optional)'
      },
      instructions: [
        'Wasser zum Kochen bringen',
        'Rosenblätter in eine hitzebeständige Schüssel geben',
        'Heißes Wasser über die Blätter gießen',
        '30 Minuten ziehen lassen',
        'Durch ein feines Sieb abseihen',
        'Optional Hamamelis hinzufügen',
        'In eine Sprühflasche füllen'
      ],
      prepTime: 40,
      difficulty: 'mittel',
      price: 4.00,
      isFree: false,
      freeForPremium: ['silver', 'gold'],
      category: 'hautpflege',
      benefits: ['pH-Balance', 'Erfrischung', 'Porenverfeinerung'],
      createdAt: new Date().toISOString()
    }
  ];

  const categories = [
    { id: 'all', name: 'Alle', icon: 'apps' },
    { id: 'hautpflege', name: 'Hautpflege', icon: 'water' },
    { id: 'haarpflege', name: 'Haarpflege', icon: 'cut' },
    { id: 'körperpflege', name: 'Körperpflege', icon: 'body' }
  ];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const canAccessRecipe = (recipe: Recipe) => {
    if (recipe.isFree) return true;
    if (purchasedRecipes.includes(recipe.id)) return true;
    if (recipe.freeForPremium.includes(premiumTier)) return true;
    return false;
  };

  const handleRecipePress = (recipe: Recipe) => {
    if (canAccessRecipe(recipe)) {
      setSelectedRecipe(recipe);
      setShowRecipeModal(true);
    } else {
      Alert.alert(
        'Premium-Rezept',
        `Dieses Rezept kostet CHF ${recipe.price.toFixed(2)}. Möchtest du es kaufen?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { 
            text: 'Kaufen', 
            onPress: () => {
              // Hier würde Stripe Payment erfolgen
              Alert.alert('Erfolg!', 'Rezept wurde gekauft! (Demo)');
              addPurchasedRecipe(recipe.id);
            }
          }
        ]
      );
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'einfach': return '#10b981';
      case 'mittel': return '#f59e0b';
      case 'schwer': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DIY Beauty-Rezepte</Text>
        <Text style={styles.headerSubtitle}>Natürliche Pflege zum Selbermachen</Text>
        
        {premiumTier !== 'basic' && (
          <View style={styles.premiumBanner}>
            <Ionicons 
              name={premiumTier === 'gold' ? 'crown' : 'star'} 
              size={16} 
              color={premiumTier === 'gold' ? '#fbbf24' : '#9ca3af'} 
            />
            <Text style={styles.premiumBannerText}>
              Als {premiumTier === 'gold' ? 'Gold' : 'Silber'}-Mitglied hast du Zugriff auf alle Premium-Rezepte!
            </Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rezepte suchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={16} 
              color={selectedCategory === category.id ? 'white' : '#6b7280'} 
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipes Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.recipesGrid}>
          {filteredRecipes.map(recipe => {
            const isAccessible = canAccessRecipe(recipe);
            
            return (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
              >
                <View style={styles.recipeHeader}>
                  <View style={styles.recipeBadges}>
                    {recipe.isFree && (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>GRATIS</Text>
                      </View>
                    )}
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) + '20' }]}>
                      <Text style={[styles.difficultyBadgeText, { color: getDifficultyColor(recipe.difficulty) }]}>
                        {recipe.difficulty}
                      </Text>
                    </View>
                  </View>
                  
                  {!isAccessible && (
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>CHF {recipe.price.toFixed(2)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.recipeImagePlaceholder}>
                  <Ionicons name="flask" size={48} color="#e5e7eb" />
                </View>

                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                  </Text>
                  
                  <View style={styles.recipeMetadata}>
                    <View style={styles.metadataItem}>
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text style={styles.metadataText}>{recipe.prepTime} Min</Text>
                    </View>
                    <View style={styles.metadataItem}>
                      <Ionicons name="leaf-outline" size={14} color="#6b7280" />
                      <Text style={styles.metadataText}>{recipe.ingredients ? Object.keys(recipe.ingredients).length : 0} Zutaten</Text>
                    </View>
                  </View>

                  <View style={styles.benefitsList}>
                    {recipe.benefits.slice(0, 2).map((benefit, index) => (
                      <View key={index} style={styles.benefitChip}>
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {!isAccessible && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={24} color="#6b7280" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Recipe Detail Modal */}
      <Modal visible={showRecipeModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedRecipe?.title}</Text>
            <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedRecipe && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.recipeDetailHeader}>
                <Text style={styles.recipeDetailDescription}>{selectedRecipe.description}</Text>
                
                <View style={styles.recipeDetailMeta}>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="time" size={20} color="#6b46c1" />
                    <Text style={styles.detailMetaLabel}>Zubereitungszeit</Text>
                    <Text style={styles.detailMetaValue}>{selectedRecipe.prepTime} Minuten</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="speedometer" size={20} color="#6b46c1" />
                    <Text style={styles.detailMetaLabel}>Schwierigkeit</Text>
                    <Text style={styles.detailMetaValue}>{selectedRecipe.difficulty}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Vorteile</Text>
                <View style={styles.benefitsGrid}>
                  {selectedRecipe.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitCard}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.benefitCardText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛒 Zutaten</Text>
                <View style={styles.ingredientsList}>
                  {Object.entries(selectedRecipe.ingredients).map(([key, value]) => (
                    <View key={key} style={styles.ingredientItem}>
                      <Ionicons name="leaf" size={16} color="#6b46c1" />
                      <Text style={styles.ingredientText}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Anleitung</Text>
                <View style={styles.instructionsList}>
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <View style={styles.instructionNumber}>
                        <Text style={styles.instructionNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.suitableFor}>
                {selectedRecipe.skinTypes.length > 0 && (
                  <View style={styles.suitableSection}>
                    <Text style={styles.suitableTitle}>Geeignet für Hauttypen:</Text>
                    <View style={styles.typesList}>
                      {selectedRecipe.skinTypes.map((type, index) => (
                        <View key={index} style={styles.typeChip}>
                          <Text style={styles.typeChipText}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {selectedRecipe.hairTypes.length > 0 && (
                  <View style={styles.suitableSection}>
                    <Text style={styles.suitableTitle}>Geeignet für Haartypen:</Text>
                    <View style={styles.typesList}>
                      {selectedRecipe.hairTypes.map((type, index) => (
                        <View key={index} style={styles.typeChip}>
                          <Text style={styles.typeChipText}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.downloadButton}>
                <Ionicons name="download" size={20} color="white" />
                <Text style={styles.downloadButtonText}>Als PDF speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  premiumBannerText: {
    fontSize: 14,
    color: '#6b46c1',
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#111827',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#6b46c1',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '47%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  recipeBadges: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  freeBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recipeImagePlaceholder: {
    height: 120,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  recipeMetadata: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#6b7280',
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  benefitChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  benefitText: {
    fontSize: 10,
    color: '#6b7280',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 16,
  },
  modalContent: {
    flex: 1,
  },
  recipeDetailHeader: {
    padding: 24,
    backgroundColor: '#faf5ff',
  },
  recipeDetailDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    lineHeight: 24,
  },
  recipeDetailMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  detailMetaItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  detailMetaLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailMetaValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
  },
  benefitCardText: {
    fontSize: 14,
    color: '#10b981',
    flex: 1,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#6b46c1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  suitableFor: {
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  suitableSection: {
    marginBottom: 16,
  },
  suitableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  typesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeChipText: {
    fontSize: 14,
    color: '#374151',
  },
  downloadButton: {
    backgroundColor: '#6b46c1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});