import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  RefreshControl,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { UserContext } from '../../App';

const { width, height } = Dimensions.get('window');

export function HistoryScreen() {
  const { user } = useContext(UserContext);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const analysisHistory = [
    {
      id: '1',
      analysisType: 'skin',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Hautanalyse - ' + new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
      skinAnalysis: {
        skinType: 'Normal',
        hydration: 4,
        elasticity: 3,
        evenness: 4,
        score: 78
      },
      aiComment: 'Hautbild stabil, gute Hydration'
    },
    {
      id: '2',
      analysisType: 'combined',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Komplettanalyse - ' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
      skinAnalysis: {
        skinType: 'Mischhaut',
        hydration: 3,
        elasticity: 3,
        evenness: 3,
        score: 72
      },
      hairAnalysis: {
        hairType: 'Wellig',
        hairDensity: 'Normal',
        shineLevel: 3,
        healthScore: 75
      },
      aiComment: 'Leichte Austrocknung festgestellt'
    },
    {
      id: '3',
      analysisType: 'hair',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Haaranalyse - ' + new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
      hairAnalysis: {
        hairType: '2B',
        hairDensity: 'Normal',
        shineLevel: 4,
        healthScore: 82
      },
      aiComment: 'Gesundes Haar mit guter Struktur'
    }
  ];

  const weeklyReports = [
    {
      id: 'report_1',
      period: '27.05.2024 - 03.06.2024',
      createdAt: new Date().toISOString(),
      changes: [
        { type: 'improvement', category: 'hydration', change: '+1', description: 'Hydration verbessert sich' },
        { type: 'stable', category: 'elasticity', change: '0', description: 'Elastizität stabil' }
      ],
      overallScore: 78,
      previousScore: 72,
      scoreDiff: 6,
      trend: 'improving',
      recommendation: 'Aktuelle Routine beibehalten',
      isNew: true
    }
  ];

  const latestAnalysis = analysisHistory[0];
  const latestReport = weeklyReports[0];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simuliere Daten-Reload
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return { name: 'trending-up', color: '#10b981' };
      case 'declining': return { name: 'trending-down', color: '#ef4444' };
      default: return { name: 'remove', color: '#6b7280' };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getAnalysisTypeInfo = (type) => {
    switch (type) {
      case 'skin':
        return { 
          icon: 'sparkles', 
          title: 'Hautanalyse',
          gradient: ['#FFE4E6', '#FECACA'],
          iconColor: '#F87171'
        };
      case 'hair':
        return { 
          icon: 'cut', 
          title: 'Haaranalyse',
          gradient: ['#FEF3C7', '#FDE68A'],
          iconColor: '#F59E0B'
        };
      case 'combined':
        return { 
          icon: 'star', 
          title: 'Komplettanalyse',
          gradient: ['#E0E7FF', '#C7D2FE'],
          iconColor: '#6366F1'
        };
      default:
        return { 
          icon: 'analytics', 
          title: 'Analyse',
          gradient: ['#F3E8FF', '#DDD6FE'],
          iconColor: '#8B5CF6'
        };
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#fdf2f8', '#fce7f3']}
      style={styles.header}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Analyse-Verlauf</Text>
        <Text style={styles.headerSubtitle}>
          Verfolgen Sie Ihre Beauty-Entwicklung über die Zeit
        </Text>
        
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analysisHistory.length}</Text>
            <Text style={styles.statLabel}>Analysen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {latestAnalysis?.skinAnalysis?.score || latestAnalysis?.hairAnalysis?.healthScore || 0}
            </Text>
            <Text style={styles.statLabel}>Letzter Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {latestReport?.scoreDiff >= 0 ? '+' : ''}{latestReport?.scoreDiff || 0}
            </Text>
            <Text style={styles.statLabel}>Trend</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderLatestAnalysis = () => {
    if (!latestAnalysis) return null;
    
    const typeInfo = getAnalysisTypeInfo(latestAnalysis.analysisType);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Letzte Analyse</Text>
        
        <TouchableOpacity
          style={styles.latestAnalysisCard}
          onPress={() => {
            setSelectedAnalysis(latestAnalysis);
            setShowAnalysisModal(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={typeInfo.gradient}
            style={styles.latestAnalysisGradient}
          >
            <View style={styles.latestAnalysisHeader}>
              <View style={styles.analysisIconContainer}>
                <Ionicons name={typeInfo.icon as any} size={32} color={typeInfo.iconColor} />
              </View>
              <View style={styles.latestAnalysisInfo}>
                <Text style={styles.latestAnalysisTitle}>{typeInfo.title}</Text>
                <Text style={styles.latestAnalysisDate}>
                  {new Date(latestAnalysis.timestamp).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.latestAnalysisScore}>
                <Text style={[
                  styles.scoreValue,
                  { color: getScoreColor(
                    latestAnalysis.skinAnalysis?.score || latestAnalysis.hairAnalysis?.healthScore || 0
                  )}
                ]}>
                  {latestAnalysis.skinAnalysis?.score || latestAnalysis.hairAnalysis?.healthScore || 0}
                </Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>
            
            <View style={styles.latestAnalysisContent}>
              {latestAnalysis.skinAnalysis && (
                <View style={styles.analysisMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Hauttyp</Text>
                    <Text style={styles.metricValue}>{latestAnalysis.skinAnalysis.skinType}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Hydration</Text>
                    <Text style={styles.metricValue}>{latestAnalysis.skinAnalysis.hydration}/5</Text>
                  </View>
                </View>
              )}
              
              {latestAnalysis.hairAnalysis && (
                <View style={styles.analysisMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Haartyp</Text>
                    <Text style={styles.metricValue}>{latestAnalysis.hairAnalysis.hairType}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Glanz</Text>
                    <Text style={styles.metricValue}>{latestAnalysis.hairAnalysis.shineLevel}/5</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.aiCommentContainer}>
                <Ionicons name="bulb" size={16} color="#6366F1" />
                <Text style={styles.aiComment}>{latestAnalysis.aiComment}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWeeklyReport = () => {
    if (!latestReport) return null;
    
    const trendIcon = getTrendIcon(latestReport.trend);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wöchentlicher Bericht</Text>
          {latestReport.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEU</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.weeklyReportCard}
          onPress={() => {
            setSelectedReport(latestReport);
            setShowReportModal(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7']}
            style={styles.weeklyReportGradient}
          >
            <View style={styles.reportHeader}>
              <View style={styles.reportIconContainer}>
                <Ionicons name="bar-chart" size={24} color="#059669" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>Fortschrittsbericht</Text>
                <Text style={styles.reportPeriod}>{latestReport.period}</Text>
              </View>
              <View style={[styles.trendIndicator, { backgroundColor: `${trendIcon.color}20` }]}>
                <Ionicons name={trendIcon.name as any} size={20} color={trendIcon.color} />
              </View>
            </View>
            
            <View style={styles.reportMetrics}>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricValue}>{latestReport.overallScore}</Text>
                <Text style={styles.reportMetricLabel}>Aktueller Score</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={[
                  styles.reportMetricValue,
                  { color: latestReport.scoreDiff >= 0 ? '#059669' : '#DC2626' }
                ]}>
                  {latestReport.scoreDiff >= 0 ? '+' : ''}{latestReport.scoreDiff}
                </Text>
                <Text style={styles.reportMetricLabel}>Veränderung</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportMetricValue}>{latestReport.changes.length}</Text>
                <Text style={styles.reportMetricLabel}>Änderungen</Text>
              </View>
            </View>
            
            <View style={styles.recommendationPreview}>
              <Ionicons name="lightbulb" size={16} color="#F59E0B" />
              <Text style={styles.recommendationText}>{latestReport.recommendation}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAnalysisHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alle Analysen ({analysisHistory.length})</Text>
      
      {analysisHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['#F8FAFC', '#F1F5F9']}
            style={styles.emptyStateGradient}
          >
            <Ionicons name="analytics-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>Noch keine Analysen</Text>
            <Text style={styles.emptyStateDescription}>
              Führen Sie Ihre erste Analyse durch, um Ihren Verlauf zu starten.
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.historyList}>
          {analysisHistory.map((analysis, index) => {
            const typeInfo = getAnalysisTypeInfo(analysis.analysisType);
            
            return (
              <TouchableOpacity
                key={analysis.id}
                style={styles.historyItem}
                onPress={() => {
                  setSelectedAnalysis(analysis);
                  setShowAnalysisModal(true);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={typeInfo.gradient}
                  style={styles.historyItemGradient}
                >
                  <View style={styles.historyItemContent}>
                    <View style={styles.historyItemLeft}>
                      <View style={[styles.historyItemIcon, { backgroundColor: `${typeInfo.iconColor}20` }]}>
                        <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.iconColor} />
                      </View>
                      <View style={styles.historyItemInfo}>
                        <Text style={styles.historyItemTitle}>{typeInfo.title}</Text>
                        <Text style={styles.historyItemDate}>
                          {new Date(analysis.timestamp).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyItemRight}>
                      <Text style={[
                        styles.historyItemScore,
                        { color: getScoreColor(
                          analysis.skinAnalysis?.score || analysis.hairAnalysis?.healthScore || 0
                        )}
                      ]}>
                        {analysis.skinAnalysis?.score || analysis.hairAnalysis?.healthScore || 0}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                  
                  <Text style={styles.historyItemComment}>{analysis.aiComment}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderAnalysisModal = () => (
    <Modal visible={showAnalysisModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['#fdf2f8', '#fce7f3']}
          style={styles.modalHeader}
        >
          <Text style={[styles.modalTitle, { color: '#1f2937' }]}>Analyse Details</Text>
          <TouchableOpacity 
            onPress={() => setShowAnalysisModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
        </LinearGradient>

        {selectedAnalysis && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <LinearGradient
                colors={['#F8FAFC', '#F1F5F9']}
                style={styles.modalSectionGradient}
              >
                <Text style={styles.modalSectionTitle}>Basis-Informationen</Text>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Datum:</Text>
                    <Text style={styles.modalInfoValue}>
                      {new Date(selectedAnalysis.timestamp).toLocaleString('de-DE')}
                    </Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Typ:</Text>
                    <Text style={styles.modalInfoValue}>
                      {getAnalysisTypeInfo(selectedAnalysis.analysisType).title}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {selectedAnalysis.skinAnalysis && (
              <View style={styles.modalSection}>
                <LinearGradient
                  colors={['#FEF2F2', '#FEE2E2']}
                  style={styles.modalSectionGradient}
                >
                  <Text style={styles.modalSectionTitle}>Hautanalyse</Text>
                  <View style={styles.modalMetricsGrid}>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.skinAnalysis.hydration}/5</Text>
                      <Text style={styles.modalMetricLabel}>Feuchtigkeit</Text>
                    </View>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.skinAnalysis.elasticity}/5</Text>
                      <Text style={styles.modalMetricLabel}>Elastizität</Text>
                    </View>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.skinAnalysis.evenness}/5</Text>
                      <Text style={styles.modalMetricLabel}>Ebenmäßigkeit</Text>
                    </View>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.skinAnalysis.score}/100</Text>
                      <Text style={styles.modalMetricLabel}>Gesamt-Score</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {selectedAnalysis.hairAnalysis && (
              <View style={styles.modalSection}>
                <LinearGradient
                  colors={['#FFFBEB', '#FEF3C7']}
                  style={styles.modalSectionGradient}
                >
                  <Text style={styles.modalSectionTitle}>Haaranalyse</Text>
                  <View style={styles.modalMetricsGrid}>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.hairAnalysis.hairType}</Text>
                      <Text style={styles.modalMetricLabel}>Haartyp</Text>
                    </View>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.hairAnalysis.hairDensity}</Text>
                      <Text style={styles.modalMetricLabel}>Dichte</Text>
                    </View>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.hairAnalysis.shineLevel}/5</Text>
                      <Text style={styles.modalMetricLabel}>Glanz</Text>
                    </View>
                    <View style={styles.modalMetric}>
                      <Text style={styles.modalMetricValue}>{selectedAnalysis.hairAnalysis.healthScore}/100</Text>
                      <Text style={styles.modalMetricLabel}>Gesundheit</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            <View style={styles.modalSection}>
              <LinearGradient
                colors={['#F0F9FF', '#E0F2FE']}
                style={styles.modalSectionGradient}
              >
                <Text style={styles.modalSectionTitle}>KI-Kommentar</Text>
                <View style={styles.modalCommentContainer}>
                  <Ionicons name="sparkles" size={20} color="#0EA5E9" />
                  <Text style={styles.modalComment}>{selectedAnalysis.aiComment}</Text>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderReportModal = () => (
    <Modal visible={showReportModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['#f0fdf4', '#dcfce7']}
          style={styles.modalHeader}
        >
          <Text style={[styles.modalTitle, { color: '#1f2937' }]}>Wöchentlicher Bericht</Text>
          <TouchableOpacity 
            onPress={() => setShowReportModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
        </LinearGradient>

        {selectedReport && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7']}
                style={styles.modalSectionGradient}
              >
                <Text style={styles.modalSectionTitle}>Zeitraum</Text>
                <Text style={styles.modalInfoValue}>{selectedReport.period}</Text>
              </LinearGradient>
            </View>

            <View style={styles.modalSection}>
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7']}
                style={styles.modalSectionGradient}
              >
                <Text style={styles.modalSectionTitle}>Erkannte Veränderungen</Text>
                <View style={styles.changesList}>
                  {selectedReport.changes.map((change, index) => (
                    <View key={index} style={styles.changeItem}>
                      <Text style={styles.changeDescription}>{change.description}</Text>
                      <Text style={[styles.changeValue, {
                        color: change.type === 'improvement' ? '#059669' : 
                              change.type === 'decline' ? '#DC2626' : '#6B7280'
                      }]}>
                        {change.change}
                      </Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>

            <View style={styles.modalSection}>
              <LinearGradient
                colors={['#F0F9FF', '#E0F2FE']}
                style={styles.modalSectionGradient}
              >
                <Text style={styles.modalSectionTitle}>Empfehlung</Text>
                <View style={styles.modalRecommendationContainer}>
                  <Ionicons name="lightbulb" size={20} color="#F59E0B" />
                  <Text style={styles.modalRecommendation}>{selectedReport.recommendation}</Text>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
          />
        }
      >
        {renderHeader()}
        {renderLatestAnalysis()}
        {renderWeeklyReport()}
        {renderAnalysisHistory()}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {renderAnalysisModal()}
      {renderReportModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  latestAnalysisCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  latestAnalysisGradient: {
    padding: 20,
  },
  latestAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  latestAnalysisInfo: {
    flex: 1,
  },
  latestAnalysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  latestAnalysisDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  latestAnalysisScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  latestAnalysisContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  analysisMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  aiCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 12,
    borderRadius: 12,
  },
  aiComment: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  weeklyReportCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  weeklyReportGradient: {
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  reportPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  trendIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
  },
  reportMetric: {
    alignItems: 'center',
  },
  reportMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  reportMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recommendationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 12,
    borderRadius: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  historyItemGradient: {
    padding: 16,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  historyItemDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyItemScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyItemComment: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31,41,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionGradient: {
    padding: 20,
    borderRadius: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  modalInfoGrid: {
    gap: 12,
  },
  modalInfoItem: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 12,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalMetric: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 12,
    width: (width - 76) / 2,
    alignItems: 'center',
  },
  modalMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  modalMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 12,
  },
  modalComment: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  changesList: {
    gap: 12,
  },
  changeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 12,
  },
  changeDescription: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalRecommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 12,
  },
  modalRecommendation: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
});