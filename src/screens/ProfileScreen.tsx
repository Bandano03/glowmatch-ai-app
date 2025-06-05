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
  Switch,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { UserContext } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  birthDate?: string;
  skinType?: string;
  hairType?: string;
  concerns: string[];
  allergies: string[];
  joinedDate: Date;
}

interface Settings {
  notifications: {
    enabled: boolean;
    dailyReminder: boolean;
    productRecommendations: boolean;
    analysisReminder: boolean;
    reminderTime: string;
  };
  privacy: {
    shareAnalytics: boolean;
    personalizedAds: boolean;
    biometricAuth: boolean;
  };
  appearance: {
    darkMode: boolean;
    language: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  data: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    lastBackup?: Date;
  };
}

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, premiumTier, updatePremiumTier, logout } = useContext(UserContext);
  
  // States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      enabled: true,
      dailyReminder: true,
      productRecommendations: true,
      analysisReminder: false,
      reminderTime: '09:00',
    },
    privacy: {
      shareAnalytics: false,
      personalizedAds: false,
      biometricAuth: false,
    },
    appearance: {
      darkMode: false,
      language: 'de',
      fontSize: 'medium',
    },
    data: {
      autoBackup: true,
      backupFrequency: 'weekly',
    },
  });
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [selectedSettingCategory, setSelectedSettingCategory] = useState<string>('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Premium Plans
  const premiumPlans: PremiumPlan[] = [
    {
      id: 'monthly',
      name: 'Monatlich',
      price: 9.99,
      period: 'pro Monat',
      features: [
        'Unbegrenzte Analysen',
        'Alle Premium Rezepte',
        'Persönliche Beratung',
        'Werbefreie Nutzung',
        'Früher Zugang zu neuen Features',
      ],
    },
    {
      id: 'yearly',
      name: 'Jährlich',
      price: 79.99,
      period: 'pro Jahr',
      features: [
        'Alles aus dem Monatsabo',
        'Sparen Sie 33%',
        'Exklusive Masterclasses',
        'Premium Support',
        'Personalisierte Berichte',
      ],
      popular: true,
      savings: 'Sparen Sie 40€',
    },
    {
      id: 'gold',
      name: 'Gold Membership',
      price: 149.99,
      period: 'pro Jahr',
      features: [
        'Alles aus dem Jahresabo',
        'Persönlicher Beauty Coach',
        'Monatliche Produktpakete',
        'VIP Events & Workshops',
        'Lebenslange Updates',
      ],
      savings: 'Unser bestes Angebot',
    },
  ];

  useEffect(() => {
    loadUserData();
    checkBiometric();
    startAnimations();
  }, []);

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load profile
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: user?.id || '1',
          name: user?.name || 'Beauty Lover',
          email: user?.email || 'user@glowmatch.ai',
          avatar: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=FFB6C1&color=fff',
          concerns: [],
          allergies: [],
          joinedDate: new Date(),
        };
        setProfile(defaultProfile);
      }

      // Load settings
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!editedProfile) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(editedProfile));
      setProfile(editedProfile);
      setShowEditProfile(false);
      Alert.alert('Erfolg', 'Profil wurde aktualisiert!');
    } catch (error) {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && editedProfile) {
      setEditedProfile({ ...editedProfile, avatar: result.assets[0].uri });
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && biometricAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifizieren Sie sich für biometrische Anmeldung',
      });
      
      if (result.success) {
        const newSettings = {
          ...settings,
          privacy: { ...settings.privacy, biometricAuth: true }
        };
        saveSettings(newSettings);
      }
    } else {
      const newSettings = {
        ...settings,
        privacy: { ...settings.privacy, biometricAuth: false }
      };
      saveSettings(newSettings);
    }
  };

  const handleNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Benachrichtigungen',
        'Bitte erlauben Sie Benachrichtigungen in den Einstellungen.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Einstellungen', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handlePremiumPurchase = (plan: PremiumPlan) => {
    Alert.alert(
      'Premium Upgrade',
      `Möchten Sie ${plan.name} für ${plan.price}€ ${plan.period} abonnieren?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Kaufen',
          onPress: async () => {
            // Hier würde die echte Kaufabwicklung stattfinden
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updatePremiumTier(plan.id === 'gold' ? 'gold' : 'silver');
            setShowPremiumModal(false);
            Alert.alert('Erfolg!', 'Willkommen als Premium-Mitglied!');
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    const data = {
      profile,
      settings,
      exportDate: new Date().toISOString(),
    };
    
    try {
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'GlowMatch Datenexport',
      });
    } catch (error) {
      Alert.alert('Fehler', 'Daten konnten nicht exportiert werden.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Account löschen',
      'Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            // Hier würde die echte Account-Löschung stattfinden
            await AsyncStorage.clear();
            logout();
          }
        }
      ]
    );
  };

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <LinearGradient
        colors={['#FFB6C1', '#FFC0CB']}  // Pastellpink
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={() => setShowEditProfile(true)}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <View style={styles.premiumBadge}>
                <Ionicons 
                  name={premiumTier === 'gold' ? 'star' : premiumTier === 'silver' ? 'star-half' : 'star-outline'} 
                  size={16} 
                  color="#F0E68C"  // Pastellgelb
                />
                <Text style={styles.premiumText}>
                  {premiumTier === 'gold' ? 'Gold Member' : 
                   premiumTier === 'silver' ? 'Silver Member' : 'Basic'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>127</Text>
              <Text style={styles.statLabel}>Analysen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Rezepte</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>89</Text>
              <Text style={styles.statLabel}>Tage dabei</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    );
  };

  const renderMenuSection = () => {
    const menuItems = [
      {
        id: 'premium',
        title: 'Premium Upgrade',
        subtitle: premiumTier === 'basic' ? 'Alle Features freischalten' : 'Ihr Abo verwalten',
        icon: 'star',
        color: '#F0E68C',  // Pastellgelb
        onPress: () => setShowPremiumModal(true),
        showBadge: premiumTier === 'basic',
      },
      {
        id: 'profile',
        title: 'Profil bearbeiten',
        subtitle: 'Persönliche Daten & Präferenzen',
        icon: 'person',
        color: '#B3E5D1',  // Pastellmint
        onPress: () => setShowEditProfile(true),
      },
      {
        id: 'settings',
        title: 'Einstellungen',
        subtitle: 'App-Einstellungen & Datenschutz',
        icon: 'settings',
        color: '#FFB6C1',  // Pastellpink
        onPress: () => setShowSettings(true),
      },
      {
        id: 'history',
        title: 'Meine Aktivitäten',
        subtitle: 'Analysen, Rezepte & Favoriten',
        icon: 'time',
        color: '#FFD4A3',  // Pastellpfirsich
        onPress: () => navigation.navigate('Verlauf' as never),
      },
      {
        id: 'share',
        title: 'App teilen',
        subtitle: 'Freunde einladen & Prämien erhalten',
        icon: 'share-social',
        color: '#FFA07A',  // Pastellkoralle
        onPress: () => {
          Share.share({
            message: 'Entdecke GlowMatch - Die KI Beauty App! 🌟\n\nDownload: https://glowmatch.ai/download',
            title: 'GlowMatch empfehlen',
          });
        },
      },
      {
        id: 'help',
        title: 'Hilfe & Support',
        subtitle: 'FAQ, Kontakt & Tutorials',
        icon: 'help-circle',
        color: '#98D8C8',  // Pastellmint
        onPress: () => Alert.alert('Support', 'support@glowmatch.ai'),
      },
      {
        id: 'about',
        title: 'Über GlowMatch',
        subtitle: 'Version 1.0.0',
        icon: 'information-circle',
        color: '#E6E6FA',  // Pastelllavendel
        onPress: () => Alert.alert('GlowMatch', 'Version 1.0.0\n\n© 2024 GlowMatch AI'),
      },
    ];

    return (
      <Animated.View style={[styles.menuSection, { opacity: fadeAnim }]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.showBadge && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEU</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9A9A9A" />
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  const renderEditProfileModal = () => {
    if (!profile) return null;

    return (
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text style={styles.modalCancel}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Profil bearbeiten</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.modalSave}>Speichern</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity style={styles.avatarEditContainer} onPress={handleImagePicker}>
              <Image 
                source={{ uri: editedProfile?.avatar || profile.avatar }} 
                style={styles.avatarEdit} 
              />
              <View style={styles.avatarEditOverlay}>
                <Ionicons name="camera" size={32} color="#fff" />
                <Text style={styles.avatarEditText}>Foto ändern</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={editedProfile?.name || profile.name}
                onChangeText={(text) => setEditedProfile({ ...profile, ...editedProfile, name: text })}
                placeholder="Ihr Name"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>E-Mail</Text>
              <TextInput
                style={styles.formInput}
                value={editedProfile?.email || profile.email}
                onChangeText={(text) => setEditedProfile({ ...profile, ...editedProfile, email: text })}
                placeholder="ihre.email@beispiel.de"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Telefon</Text>
              <TextInput
                style={styles.formInput}
                value={editedProfile?.phone || profile.phone}
                onChangeText={(text) => setEditedProfile({ ...profile, ...editedProfile, phone: text })}
                placeholder="+49 123 456789"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Geburtsdatum</Text>
              <TextInput
                style={styles.formInput}
                value={editedProfile?.birthDate || profile.birthDate}
                onChangeText={(text) => setEditedProfile({ ...profile, ...editedProfile, birthDate: text })}
                placeholder="TT.MM.JJJJ"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Hauttyp</Text>
              <View style={styles.chipContainer}>
                {['Normal', 'Trocken', 'Fettig', 'Mischhaut', 'Sensibel'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      (editedProfile?.skinType || profile.skinType) === type && styles.chipActive
                    ]}
                    onPress={() => setEditedProfile({ ...profile, ...editedProfile, skinType: type })}
                  >
                    <Text style={[
                      styles.chipText,
                      (editedProfile?.skinType || profile.skinType) === type && styles.chipTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Haartyp</Text>
              <View style={styles.chipContainer}>
                {['1A-1C', '2A-2C', '3A-3C', '4A-4C'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      (editedProfile?.hairType || profile.hairType) === type && styles.chipActive
                    ]}
                    onPress={() => setEditedProfile({ ...profile, ...editedProfile, hairType: type })}
                  >
                    <Text style={[
                      styles.chipText,
                      (editedProfile?.hairType || profile.hairType) === type && styles.chipTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Hautprobleme</Text>
              <View style={styles.chipContainer}>
                {['Akne', 'Rötungen', 'Pigmentflecken', 'Falten', 'Trockenheit'].map((concern) => {
                  const concerns = editedProfile?.concerns || profile.concerns || [];
                  const isSelected = concerns.includes(concern);
                  
                  return (
                    <TouchableOpacity
                      key={concern}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        const newConcerns = isSelected
                          ? concerns.filter(c => c !== concern)
                          : [...concerns, concern];
                        setEditedProfile({ ...profile, ...editedProfile, concerns: newConcerns });
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {concern}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Allergien & Unverträglichkeiten</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={(editedProfile?.allergies || profile.allergies || []).join(', ')}
                onChangeText={(text) => {
                  const allergies = text.split(',').map(a => a.trim()).filter(a => a);
                  setEditedProfile({ ...profile, ...editedProfile, allergies });
                }}
                placeholder="z.B. Duftstoffe, Parabene, Nüsse"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <Ionicons name="close" size={28} color="#4A4A4A" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Einstellungen</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Benachrichtigungen */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Benachrichtigungen</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push-Benachrichtigungen</Text>
                <Text style={styles.settingDescription}>Alle App-Benachrichtigungen</Text>
              </View>
              <Switch
                value={settings.notifications.enabled}
                onValueChange={async (value) => {
                  if (value) await handleNotificationPermission();
                  const newSettings = {
                    ...settings,
                    notifications: { ...settings.notifications, enabled: value }
                  };
                  saveSettings(newSettings);
                }}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Tägliche Erinnerung</Text>
                <Text style={styles.settingDescription}>Routine-Reminder um {settings.notifications.reminderTime}</Text>
              </View>
              <Switch
                value={settings.notifications.dailyReminder}
                onValueChange={(value) => {
                  const newSettings = {
                    ...settings,
                    notifications: { ...settings.notifications, dailyReminder: value }
                  };
                  saveSettings(newSettings);
                }}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Produktempfehlungen</Text>
                <Text style={styles.settingDescription}>Neue passende Produkte</Text>
              </View>
              <Switch
                value={settings.notifications.productRecommendations}
                onValueChange={(value) => {
                  const newSettings = {
                    ...settings,
                    notifications: { ...settings.notifications, productRecommendations: value }
                  };
                  saveSettings(newSettings);
                }}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Datenschutz */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Datenschutz & Sicherheit</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Biometrische Anmeldung</Text>
                <Text style={styles.settingDescription}>Face ID / Touch ID verwenden</Text>
              </View>
              <Switch
                value={settings.privacy.biometricAuth}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
                disabled={!biometricAvailable}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Anonyme Analytik</Text>
                <Text style={styles.settingDescription}>Hilft uns die App zu verbessern</Text>
              </View>
              <Switch
                value={settings.privacy.shareAnalytics}
                onValueChange={(value) => {
                  const newSettings = {
                    ...settings,
                    privacy: { ...settings.privacy, shareAnalytics: value }
                  };
                  saveSettings(newSettings);
                }}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Datenschutzerklärung</Text>
              <Ionicons name="open-outline" size={16} color="#FFB6C1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Nutzungsbedingungen</Text>
              <Ionicons name="open-outline" size={16} color="#FFB6C1" />
            </TouchableOpacity>
          </View>

          {/* Erscheinungsbild */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Erscheinungsbild</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dunkler Modus</Text>
                <Text style={styles.settingDescription}>Augenschonend bei Nacht</Text>
              </View>
              <Switch
                value={settings.appearance.darkMode}
                onValueChange={(value) => {
                  const newSettings = {
                    ...settings,
                    appearance: { ...settings.appearance, darkMode: value }
                  };
                  saveSettings(newSettings);
                }}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Sprache ändern</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>Deutsch</Text>
                <Ionicons name="chevron-forward" size={16} color="#9A9A9A" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Schriftgröße</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>
                  {settings.appearance.fontSize === 'small' ? 'Klein' :
                   settings.appearance.fontSize === 'large' ? 'Groß' : 'Mittel'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#9A9A9A" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Daten & Backup */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Daten & Backup</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Automatisches Backup</Text>
                <Text style={styles.settingDescription}>
                  {settings.data.backupFrequency === 'daily' ? 'Täglich' :
                   settings.data.backupFrequency === 'weekly' ? 'Wöchentlich' : 'Monatlich'}
                </Text>
              </View>
              <Switch
                value={settings.data.autoBackup}
                onValueChange={(value) => {
                  const newSettings = {
                    ...settings,
                    data: { ...settings.data, autoBackup: value }
                  };
                  saveSettings(newSettings);
                }}
                trackColor={{ false: '#F0E0E0', true: '#FFB6C1' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.settingButton} onPress={handleExportData}>
              <Text style={styles.settingButtonText}>Daten exportieren</Text>
              <Ionicons name="download-outline" size={16} color="#FFB6C1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Cache leeren</Text>
              <Text style={styles.settingValueText}>124 MB</Text>
            </TouchableOpacity>
          </View>

          {/* Account */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Account</Text>
            
            <TouchableOpacity style={styles.settingButton} onPress={() => {
              Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Abmelden', onPress: logout }
              ]);
            }}>
              <Text style={[styles.settingButtonText, { color: '#FFA07A' }]}>Abmelden</Text>
              <Ionicons name="log-out-outline" size={16} color="#FFA07A" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingButton} 
              onPress={() => setShowDeleteAccount(true)}
            >
              <Text style={[styles.settingButtonText, { color: '#F08080' }]}>
                Account löschen
              </Text>
              <Ionicons name="trash-outline" size={16} color="#F08080" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderPremiumModal = () => (
    <Modal
      visible={showPremiumModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPremiumModal(false)}
    >
      <View style={styles.modalContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.premiumCloseButton}
            onPress={() => setShowPremiumModal(false)}
          >
            <Ionicons name="close" size={28} color="#4A4A4A" />
          </TouchableOpacity>

          <LinearGradient
            colors={['#F0E68C', '#FFFFE0']}  // Pastellgelb
            style={styles.premiumHeader}
          >
            <Ionicons name="star" size={48} color="#fff" />
            <Text style={styles.premiumHeaderTitle}>GlowMatch Premium</Text>
            <Text style={styles.premiumHeaderSubtitle}>
              Entdecken Sie Ihr volles Beauty-Potenzial
            </Text>
          </LinearGradient>

          <View style={styles.premiumContent}>
            {/* Current Status */}
            {premiumTier !== 'basic' && (
              <View style={styles.currentPlanBox}>
                <Text style={styles.currentPlanTitle}>Ihr aktueller Plan</Text>
                <Text style={styles.currentPlanName}>
                  {premiumTier === 'gold' ? 'Gold Membership' : 'Silver Premium'}
                </Text>
                <TouchableOpacity style={styles.managePlanButton}>
                  <Text style={styles.managePlanText}>Abo verwalten</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Benefits */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Premium Vorteile</Text>
              {[
                { icon: 'infinite', text: 'Unbegrenzte KI-Analysen' },
                { icon: 'book', text: 'Zugang zu allen DIY-Rezepten' },
                { icon: 'person', text: 'Persönliche Beauty-Beratung' },
                { icon: 'close-circle', text: 'Keine Werbung' },
                { icon: 'rocket', text: 'Früher Zugang zu neuen Features' },
                { icon: 'gift', text: 'Monatliche Überraschungen (Gold)' },
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name={benefit.icon as any} size={24} color="#FFB6C1" />
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>

            {/* Plans */}
            <View style={styles.plansSection}>
              <Text style={styles.plansTitle}>Wählen Sie Ihren Plan</Text>
              {premiumPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, plan.popular && styles.planCardPopular]}
                  onPress={() => handlePremiumPurchase(plan)}
                  activeOpacity={0.9}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>BELIEBT</Text>
                    </View>
                  )}
                  
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>€{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  
                  {plan.savings && (
                    <View style={styles.planSavings}>
                      <Text style={styles.planSavingsText}>{plan.savings}</Text>
                    </View>
                  )}

                  <View style={styles.planFeatures}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={16} color="#98D8C8" />
                        <Text style={styles.planFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.planButton, plan.popular && styles.planButtonPopular]}>
                    <Text style={[styles.planButtonText, plan.popular && styles.planButtonTextPopular]}>
                      Jetzt upgraden
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* FAQ */}
            <View style={styles.faqSection}>
              <Text style={styles.faqTitle}>Häufige Fragen</Text>
              <TouchableOpacity style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Kann ich jederzeit kündigen?</Text>
                <Ionicons name="chevron-down" size={20} color="#9A9A9A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Gibt es eine Testphase?</Text>
                <Ionicons name="chevron-down" size={20} color="#9A9A9A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Was ist im Gold-Paket enthalten?</Text>
                <Ionicons name="chevron-down" size={20} color="#9A9A9A" />
              </TouchableOpacity>
            </View>

            {/* Restore Purchase */}
            <TouchableOpacity style={styles.restoreButton}>
              <Text style={styles.restoreButtonText}>Käufe wiederherstellen</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB6C1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderMenuSection()}
        
        <TouchableOpacity style={styles.logoutButton} onPress={() => {
          Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Abmelden', onPress: logout, style: 'destructive' }
          ]);
        }}>
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {renderEditProfileModal()}
      {renderSettingsModal()}
      {renderPremiumModal()}
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFB6C1',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  premiumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0E0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9A9A9A',
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#F08080',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F08080',
  },
  logoutText: {
    color: '#F08080',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF9F5',
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
    borderBottomColor: '#F0E0E0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#FFB6C1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  modalSave: {
    fontSize: 16,
    color: '#FFB6C1',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  avatarEditContainer: {
    alignSelf: 'center',
    marginVertical: 30,
  },
  avatarEdit: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#4A4A4A',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0E0E0',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#FFB6C1',
    borderColor: '#FFB6C1',
  },
  chipText: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  chipTextActive: {
    color: '#fff',
  },
  settingsSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0E0',
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  settingDescription: {
    fontSize: 13,
    color: '#9A9A9A',
    marginTop: 2,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    color: '#9A9A9A',
    marginRight: 8,
  },
  premiumCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  premiumHeader: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  premiumHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  premiumHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  premiumContent: {
    padding: 20,
  },
  currentPlanBox: {
    backgroundColor: '#E8F9E8',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#98D8C8',
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginTop: 4,
  },
  managePlanButton: {
    marginTop: 12,
  },
  managePlanText: {
    fontSize: 14,
    color: '#98D8C8',
    textDecorationLine: 'underline',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
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
  benefitText: {
    fontSize: 16,
    color: '#4A4A4A',
    marginLeft: 12,
  },
  plansSection: {
    marginBottom: 32,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F0E0E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#FFB6C1',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FFB6C1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFB6C1',
  },
  planPeriod: {
    fontSize: 16,
    color: '#9A9A9A',
    marginLeft: 8,
  },
  planSavings: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  planSavingsText: {
    fontSize: 14,
    color: '#FFA07A',
    fontWeight: '600',
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#7A7A7A',
    marginLeft: 8,
  },
  planButton: {
    backgroundColor: '#F0E0E0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonPopular: {
    backgroundColor: '#FFB6C1',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  planButtonTextPopular: {
    color: '#fff',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0E0',
  },
  faqQuestion: {
    fontSize: 16,
    color: '#4A4A4A',
    flex: 1,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#FFB6C1',
    textDecorationLine: 'underline',
  },
});

export default ProfileScreen;