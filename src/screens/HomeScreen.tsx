import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../App';

export function HomeScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false);

  const dailyTip = {
    icon: '💧',
    category: 'Hydration',
    text: 'Trinke heute mindestens 2 Liter Wasser für strahlende Haut',
    type: 'skincare'
  };

  const notifications = [
    {
      id: '1',
      title: 'Hautveränderung erkannt',
      message: 'Deine Haut ist feuchter geworden! Deine Pflegeroutine zeigt Wirkung. 🌟',
      timestamp: new Date().toISOString(),
      severity: 'medium'
    }
  ];

  const savedAnalyses = [
    {
      id: '1',
      title: 'Hautanalyse - 02.06.2025',
      skinAnalysis: { skinType: 'Normal', score: 78 },
      savedAt: new Date().toISOString()
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>✨</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>GlowMatch AI</Text>
            <Text style={styles.appSubtitle}>Affiliate Beauty App</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {user?.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="crown" size={16} color="#6b46c1" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userStatus}>{user?.isPremium ? 'Premium' : 'Basic'}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Tip */}
        {user && dailyTip && (
          <View style={styles.dailyTipCard}>
            <View style={styles.dailyTipHeader}>
              <View style={styles.dailyTipLeft}>
                <View style={styles.dailyTipIcon}>
                  <Text style={styles.dailyTipIconText}>✨</Text>
                </View>
                <View>
                  <Text style={styles.dailyTipTitle}>Dein täglicher Beauty-Tipp</Text>
                  <Text style={styles.dailyTipCategory}>{dailyTip.category} • Kostenlos für alle</Text>
                </View>
              </View>
              <Text style={styles.dailyTipEmoji}>{dailyTip.icon}</Text>
            </View>
            <Text style={styles.dailyTipText}>{dailyTip.text}</Text>
            <View style={styles.dailyTipTag}>
              <Text style={styles.dailyTipTagText}>✨ Hautpflege</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {notifications.length > 0 && (
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setShowNotifications(true)}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionLeft}>
                  <Ionicons name="notifications" size={24} color="#3b82f6" />
                  <View style={styles.quickActionText}>
                    <Text style={styles.quickActionTitle}>Neue Benachrichtigungen</Text>
                    <Text style={styles.quickActionSubtitle}>{notifications.length} neue Erkenntnisse</Text>
                  </View>
                </View>
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => setShowSavedAnalyses(true)}
          >
            <View style={styles.quickActionContent}>
              <View style={styles.quickActionLeft}>
                <Ionicons name="archive" size={24} color="#f59e0b" />
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>Gespeicherte Analysen</Text>
                  <Text style={styles.quickActionSubtitle}>{savedAnalyses.length} gespeichert</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>✨ KI-gestützte Beauty-Analyse</Text>
            </View>
            <Text style={styles.heroTitle}>
              Entdecke deine perfekte{'\n'}
              <Text style={styles.heroTitleGradient}>Beauty-Routine</Text>
            </Text>
            <Text style={styles.heroDescription}>
              Unsere fortschrittliche KI analysiert deine Haut und Haare für 
              personalisierte Empfehlungen und optimale Ergebnisse.
            </Text>
            
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => navigation.navigate('Analyse')}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.heroButtonText}>Jetzt analysieren</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Live Beauty-Analyse</Text>
            <Text style={styles.featureDescription}>
              Echtzeit-Analyse von Haut und Haaren mit personalisierten Empfehlungen
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
            </View>
            <Text style={styles.featureTitle}>Fortschritt verfolgen</Text>
            <Text style={styles.featureDescription}>
              Dokumentiere deine Beauty-Verbesserung mit Vorher-Nachher-Vergleichen
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="bag" size={20} color="#ec4899" />
            </View>
            <Text style={styles.featureTitle}>Personalisierte Produkte</Text>
            <Text style={styles.featureDescription}>
              Entdecke Haut- und Haarprodukte, die perfekt zu deinem Typ passen
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="crown" size={20} color="#6b46c1" />
            </View>
            <Text style={styles.featureTitle}>Premium Features</Text>
            <Text style={styles.featureDescription}>
              Erweiterte Analyse, Routinen und exklusive Beauty-Inhalte
            </Text>
          </View>
        </View>

        {/* Premium CTA */}
        {user && !user.isPremium && (
          <View style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <View>
                <Text style={styles.premiumTitle}>Premium freischalten</Text>
                <Text style={styles.premiumDescription}>Komplettanalyse, erweiterte Features ab 15 CHF/Monat</Text>
              </View>
              <Ionicons name="crown" size={32} color="#fbbf24" />
            </View>
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('Profil')}
            >
              <Text style={styles.premiumButtonText}>Jetzt upgraden</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Benachrichtigungen</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {notifications.map(notification => (
              <View key={notification.id} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.timestamp).toLocaleString('de-DE')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Saved Analyses Modal */}
      <Modal visible={showSavedAnalyses} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gespeicherte Analysen</Text>
            <TouchableOpacity onPress={() => setShowSavedAnalyses(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {savedAnalyses.map(analysis => (
              <View key={analysis.id} style={styles.analysisItem}>
                <Text style={styles.analysisTitle}>{analysis.title}</Text>
                <Text style={styles.analysisDetails}>
                  {analysis.skinAnalysis?.skinType} • Score: {analysis.skinAnalysis?.score}/100
                </Text>
                <Text style={styles.analysisTime}>
                  {new Date(analysis.savedAt).toLocaleString('de-DE')}
                </Text>
              </View>
            ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#6b46c1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    color: 'white',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#6b46c1',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b46c1',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#ec4899',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dailyTipCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dailyTipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyTipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dailyTipIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#6b46c1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dailyTipIconText: {
    fontSize: 24,
    color: 'white',
  },
  dailyTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  dailyTipCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  dailyTipEmoji: {
    fontSize: 48,
  },
  dailyTipText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  dailyTipTag: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dailyTipTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  quickActions: {
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    marginLeft: 12,
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  notificationBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b46c1',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  heroTitleGradient: {
    color: '#6b46c1',
  },
  heroDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  heroButton: {
    backgroundColor: '#6b46c1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  heroButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '47%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  premiumCard: {
    backgroundColor: '#6b46c1',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  premiumContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  premiumDescription: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  premiumButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    color: '#6b46c1',
    fontWeight: '600',
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  notificationItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  analysisItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  analysisDetails: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  analysisTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});