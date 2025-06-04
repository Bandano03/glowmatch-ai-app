import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Switch,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../App';
import { PREMIUM_TIERS, PremiumTier } from '../types/premium';

export function ProfileScreen() {
  const { user, logout, premiumTier, updatePremiumTier, nextPackageDate, packagesSent } = useContext(UserContext);
  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'silver_monthly' | 'gold_monthly' | 'gold_yearly'>('silver_monthly');

  const handleLogout = () => {
    Alert.alert(
      'Ausloggen',
      'Möchtest du dich wirklich ausloggen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Ausloggen', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Account löschen',
      'Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          Alert.alert('Account gelöscht', 'Dein Account wurde erfolgreich gelöscht.');
          logout();
        }}
      ]
    );
  };

  const profileStats = [
    { label: 'Analysen', value: '23', icon: 'camera' },
    { label: 'Gespeichert', value: '45', icon: 'bookmark' },
    { label: 'Routine-Tage', value: '15', icon: 'calendar' }
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('de-CH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handlePremiumUpgrade = (plan: 'silver_monthly' | 'gold_monthly' | 'gold_yearly') => {
    // Hier würde Stripe Payment erfolgen
    Alert.alert(
      'Premium Upgrade',
      `${plan} würde hier über Stripe abgewickelt werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Demo: Upgrade simulieren', 
          onPress: () => {
            const newTier = plan.includes('gold') ? 'gold' : 'silver';
            updatePremiumTier(newTier as PremiumTier);
            setShowPremiumModal(false);
            Alert.alert('Erfolg!', `Du bist jetzt ${PREMIUM_TIERS[newTier].name}-Mitglied! 🎉`);
          }
        }
      ]
    );
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { 
          icon: 'person-outline', 
          label: 'Persönliche Daten', 
          action: () => Alert.alert('Info', 'Persönliche Daten bearbeiten') 
        },
        { 
          icon: 'shield-checkmark-outline', 
          label: 'Datenschutz & Sicherheit', 
          action: () => Alert.alert('Info', 'Datenschutzeinstellungen') 
        },
        { 
          icon: 'card-outline', 
          label: 'Zahlungsmethoden', 
          action: () => Alert.alert('Info', 'Zahlungsmethoden verwalten'),
          showPremiumBadge: true
        }
      ]
    },
    {
      title: 'Einstellungen',
      items: [
        { 
          icon: 'notifications-outline', 
          label: 'Push-Benachrichtigungen', 
          toggle: true,
          value: notifications,
          onToggle: setNotifications
        },
        { 
          icon: 'mail-outline', 
          label: 'Newsletter', 
          toggle: true,
          value: newsletter,
          onToggle: setNewsletter
        },
        { 
          icon: 'moon-outline', 
          label: 'Dark Mode', 
          toggle: true,
          value: darkMode,
          onToggle: setDarkMode
        }
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: 'help-circle-outline', 
          label: 'Hilfe & FAQ', 
          action: () => Alert.alert('Info', 'Hilfe-Center öffnen') 
        },
        { 
          icon: 'chatbubble-outline', 
          label: 'Kontakt', 
          action: () => Alert.alert('Info', 'support@glowmatch.ai') 
        },
        { 
          icon: 'document-text-outline', 
          label: 'AGB & Datenschutz', 
          action: () => Alert.alert('Info', 'Rechtliche Dokumente') 
        }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mein Profil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Demo User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'demo@glowmatch.ai'}</Text>
              
              {premiumTier !== 'basic' ? (
                <View style={[styles.premiumBadge, { backgroundColor: premiumTier === 'gold' ? '#fef3c7' : '#f3f4f6' }]}>
                  <Ionicons 
                    name={premiumTier === 'gold' ? 'crown' : 'star'} 
                    size={16} 
                    color={premiumTier === 'gold' ? '#f59e0b' : '#6b7280'} 
                  />
                  <Text style={[styles.premiumBadgeText, { color: premiumTier === 'gold' ? '#92400e' : '#374151' }]}>
                    {PREMIUM_TIERS[premiumTier].name} Member
                  </Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.upgradeBadge}
                  onPress={() => setShowPremiumModal(true)}
                >
                  <Text style={styles.upgradeBadgeText}>Upgrade to Premium</Text>
                  <Ionicons name="arrow-forward" size={16} color="#6b46c1" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Ionicons name={stat.icon} size={24} color="#6b46c1" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Gold Package Info */}
        {premiumTier === 'gold' && nextPackageDate && (
          <View style={styles.goldPackageCard}>
            <View style={styles.goldPackageHeader}>
              <View style={styles.goldPackageIcon}>
                <Ionicons name="gift" size={32} color="#f59e0b" />
              </View>
              <View style={styles.goldPackageInfo}>
                <Text style={styles.goldPackageTitle}>Nächstes Selfcare-Paket</Text>
                <Text style={styles.goldPackageDate}>{formatDate(nextPackageDate)}</Text>
                <Text style={styles.goldPackageCount}>Paket #{packagesSent + 1}</Text>
              </View>
            </View>
            <View style={styles.goldPackageFeatures}>
              <Text style={styles.goldPackageFeatureText}>
                ✨ Personalisiert auf deine aktuelle Haut- & Haaranalyse
              </Text>
              <Text style={styles.goldPackageFeatureText}>
                📦 Kostenloser Versand inklusive
              </Text>
              <Text style={styles.goldPackageFeatureText}>
                🎁 Überraschungsprodukte im Wert von 50+ CHF
              </Text>
            </View>
          </View>
        )}

        {/* Beauty Profile */}
        <View style={styles.beautyProfileCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mein Beauty-Profil</Text>
            <TouchableOpacity>
              <Text style={styles.editButton}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.beautyInfo}>
            <View style={styles.beautyItem}>
              <Text style={styles.beautyLabel}>Hauttyp</Text>
              <Text style={styles.beautyValue}>Normal</Text>
            </View>
            <View style={styles.beautyItem}>
              <Text style={styles.beautyLabel}>Haartyp</Text>
              <Text style={styles.beautyValue}>Wellig</Text>
            </View>
            <View style={styles.beautyItem}>
              <Text style={styles.beautyLabel}>Hauptanliegen</Text>
              <Text style={styles.beautyValue}>Feuchtigkeit, Anti-Aging</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={item.action}
                disabled={item.toggle}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon} size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  {item.showPremiumBadge && premiumTier === 'basic' && (
                    <View style={styles.premiumIndicator}>
                      <Ionicons name="crown" size={12} color="#6b46c1" />
                    </View>
                  )}
                </View>
                
                {item.toggle ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#e5e7eb', true: '#c7b5f5' }}
                    thumbColor={item.value ? '#6b46c1' : '#f3f4f6'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Ausloggen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Account löschen</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>GlowMatch AI v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 GlowMatch. Alle Rechte vorbehalten.</Text>
        </View>
      </ScrollView>

      {/* Premium Modal */}
      <Modal visible={showPremiumModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Premium freischalten</Text>
            <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.premiumHero}>
              <View style={styles.premiumIcon}>
                <Ionicons name="crown" size={48} color="#6b46c1" />
              </View>
              <Text style={styles.premiumTitle}>Wähle dein Premium-Paket</Text>
              <Text style={styles.premiumSubtitle}>
                Schalte alle Features frei und erreiche deine Beauty-Ziele schneller
              </Text>
            </View>

            {/* Premium Tiers */}
            <View style={styles.tiersContainer}>
              {/* Silver Tier */}
              <TouchableOpacity
                style={[
                  styles.tierCard,
                  selectedPlan === 'silver_monthly' && styles.tierCardSelected
                ]}
                onPress={() => setSelectedPlan('silver_monthly')}
              >
                <View style={styles.tierHeader}>
                  <Ionicons name="star" size={32} color="#9ca3af" />
                  <Text style={styles.tierName}>Silber</Text>
                  <Text style={styles.tierPrice}>CHF 15</Text>
                  <Text style={styles.tierPeriod}>pro Monat</Text>
                </View>
                
                <View style={styles.tierFeatures}>
                  {PREMIUM_TIERS.silver.features.map((feature, index) => (
                    <View key={index} style={styles.tierFeature}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.tierFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Gold Monthly */}
              <TouchableOpacity
                style={[
                  styles.tierCard,
                  styles.tierCardGold,
                  selectedPlan === 'gold_monthly' && styles.tierCardSelected
                ]}
                onPress={() => setSelectedPlan('gold_monthly')}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>BELIEBT</Text>
                </View>
                
                <View style={styles.tierHeader}>
                  <Ionicons name="crown" size={32} color="#f59e0b" />
                  <Text style={styles.tierName}>Gold</Text>
                  <Text style={styles.tierPrice}>CHF 25</Text>
                  <Text style={styles.tierPeriod}>pro Monat</Text>
                </View>
                
                <View style={styles.tierFeatures}>
                  {PREMIUM_TIERS.gold.features.map((feature, index) => (
                    <View key={index} style={styles.tierFeature}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.tierFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.goldSpecialBox}>
                  <Text style={styles.goldSpecialText}>
                    {PREMIUM_TIERS.gold.packageInfo}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Gold Yearly */}
              <TouchableOpacity
                style={[
                  styles.tierCard,
                  styles.tierCardGold,
                  selectedPlan === 'gold_yearly' && styles.tierCardSelected
                ]}
                onPress={() => setSelectedPlan('gold_yearly')}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SPARE 17%</Text>
                </View>
                
                <View style={styles.tierHeader}>
                  <Ionicons name="crown" size={32} color="#f59e0b" />
                  <Text style={styles.tierName}>Gold Jahresabo</Text>
                  <Text style={styles.tierPrice}>CHF 250</Text>
                  <Text style={styles.tierPeriod}>pro Jahr</Text>
                  <Text style={styles.tierSaving}>Nur CHF 20.83/Monat</Text>
                </View>
                
                <View style={styles.tierFeatures}>
                  <View style={styles.tierFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.tierFeatureText}>Alle Gold-Features</Text>
                  </View>
                  <View style={styles.tierFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.tierFeatureText}>2 Monate gratis</Text>
                  </View>
                  <View style={styles.tierFeature}>
                    <Ionicons name="gift" size={16} color="#f59e0b" />
                    <Text style={styles.tierFeatureText}>Willkommensgeschenk</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.subscribeButton}
              onPress={() => handlePremiumUpgrade(selectedPlan)}
            >
              <Text style={styles.subscribeButtonText}>
                {selectedPlan === 'silver_monthly' ? 'Silber werden für CHF 15/Monat' :
                 selectedPlan === 'gold_monthly' ? 'Gold werden für CHF 25/Monat' :
                 'Gold Jahresabo für CHF 250'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Mit dem Abschluss stimmst du unseren AGB und Datenschutzbestimmungen zu.
              Jederzeit kündbar. {selectedPlan === 'gold_yearly' ? 'Keine Rückerstattung bei vorzeitiger Kündigung.' : ''}
            </Text>
          </ScrollView>
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
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#ec4899',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#6b46c1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  upgradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b46c1',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  goldPackageCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  goldPackageHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  goldPackageIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goldPackageInfo: {
    flex: 1,
  },
  goldPackageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  goldPackageDate: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: 4,
  },
  goldPackageCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  goldPackageFeatures: {
    gap: 8,
  },
  goldPackageFeatureText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  beautyProfileCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    fontSize: 14,
    color: '#6b46c1',
    fontWeight: '600',
  },
  beautyInfo: {
    gap: 16,
  },
  beautyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beautyLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  beautyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  menuSection: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  premiumIndicator: {
    backgroundColor: '#faf5ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  dangerZone: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  logoutButton: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  appVersion: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#9ca3af',
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
  },
  modalContent: {
    flex: 1,
  },
  premiumHero: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  premiumIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#faf5ff',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  tiersContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  tierCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierCardSelected: {
    borderColor: '#6b46c1',
    backgroundColor: '#faf5ff',
  },
  tierCardGold: {
    backgroundColor: '#fef3c7',
    position: 'relative',
  },
  tierHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6b46c1',
  },
  tierPeriod: {
    fontSize: 16,
    color: '#6b7280',
  },
  tierSaving: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  tierFeatures: {
    gap: 12,
  },
  tierFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tierFeatureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  goldSpecialBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  goldSpecialText: {
    fontSize: 14,
    color: '#92400e',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#6b46c1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscribeButton: {
    backgroundColor: '#6b46c1',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 48,
    marginBottom: 48,
  },
});