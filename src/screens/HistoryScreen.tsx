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

export function HistoryScreen() {
  const { user } = useContext(UserContext);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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
        skinType: 'Normal',
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

  const exportToPDF = () => {
    alert('PDF-Export ist nur für Premium-Nutzer verfügbar!');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analyse-Verlauf</Text>
        <Text style={styles.headerSubtitle}>Verfolge deine Beauty-Entwicklung über die Zeit</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Latest Analysis Summary */}
        {latestAnalysis && (
          <View style={styles.latestAnalysisCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="time" size={24} color="#6b46c1" />
                <Text style={styles.cardTitle}>Letzte Analyse</Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date(latestAnalysis.timestamp).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.analysisGrid}>
              <View style={styles.analysisOverview}>
                <Text style={styles.analysisIcon}>
                  {latestAnalysis.analysisType === 'skin' ? '✨' : 
                   latestAnalysis.analysisType === 'hair' ? '💇‍♀️' : '🌟'}
                </Text>
                <Text style={styles.analysisTypeTitle}>
                  {latestAnalysis.analysisType === 'skin' ? 'Hautanalyse' :
                   latestAnalysis.analysisType === 'hair' ? 'Haaranalyse' : 'Komplettanalyse'}
                </Text>
                <Text style={[styles.analysisScore, { color: getScoreColor(
                  latestAnalysis.skinAnalysis?.score || latestAnalysis.hairAnalysis?.healthScore || 0
                )}]}>
                  {latestAnalysis.skinAnalysis?.score || latestAnalysis.hairAnalysis?.healthScore || 0}/100
                </Text>
              </View>

              <View style={styles.analysisDetails}>
                <Text style={styles.analysisDetailTitle}>Hauttyp</Text>
                <Text style={styles.analysisDetailValue}>{latestAnalysis.skinAnalysis?.skinType || 'N/A'}</Text>
                {latestAnalysis.hairAnalysis && (
                  <>
                    <Text style={styles.analysisDetailTitle}>Haartyp</Text>
                    <Text style={styles.analysisDetailValue}>{latestAnalysis.hairAnalysis.hairType}</Text>
                  </>
                )}
              </View>

              <View style={styles.analysisComment}>
                <Text style={styles.analysisCommentTitle}>KI-Kommentar</Text>
                <Text style={styles.analysisCommentText}>{latestAnalysis.aiComment}</Text>
                <View style={styles.analysisActions}>
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => {
                      setSelectedAnalysis(latestAnalysis);
                      setShowAnalysisModal(true);
                    }}
                  >
                    <Text style={styles.primaryActionText}>Details ansehen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryAction}>
                    <Text style={styles.secondaryActionText}>Empfehlungen anzeigen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Report */}
        {latestReport && (
          <View style={styles.weeklyReportCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="bar-chart" size={24} color="#3b82f6" />
                <Text style={styles.cardTitle}>Wöchentlicher Bericht</Text>
                {latestReport.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEU</Text>
                  </View>
                )}
              </View>
              {user?.isPremium && (
                <TouchableOpacity style={styles.pdfButton} onPress={exportToPDF}>
                  <Ionicons name="download" size={16} color="white" />
                  <Text style={styles.pdfButtonText}>PDF Export</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.reportGrid}>
              <View style={styles.reportMetric}>
                <View style={[styles.reportIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name={getTrendIcon(latestReport.trend).name} size={32} color={getTrendIcon(latestReport.trend).color} />
                </View>
                <Text style={styles.reportMetricTitle}>Trend</Text>
                <Text style={styles.reportMetricValue}>
                  {latestReport.trend === 'improving' ? 'Verbesserung' : 
                   latestReport.trend === 'declining' ? 'Verschlechterung' : 'Stabil'}
                </Text>
              </View>

              <View style={styles.reportMetric}>
                <Text style={styles.reportScoreValue}>{latestReport.overallScore}</Text>
                <Text style={styles.reportMetricTitle}>Aktueller Score</Text>
                <Text style={[styles.reportScoreChange, { color: latestReport.scoreDiff >= 0 ? '#10b981' : '#ef4444' }]}>
                  {latestReport.scoreDiff >= 0 ? '+' : ''}{latestReport.scoreDiff} vs. Vorwoche
                </Text>
              </View>

              <View style={styles.reportMetric}>
                <Text style={styles.reportIcon}>📈</Text>
                <Text style={styles.reportMetricTitle}>Änderungen</Text>
                <Text style={styles.reportMetricValue}>{latestReport.changes.length} erkannt</Text>
              </View>
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>Empfehlung</Text>
              <Text style={styles.recommendationText}>{latestReport.recommendation}</Text>
            </View>

            <TouchableOpacity
              style={styles.fullReportButton}
              onPress={() => {
                setSelectedReport(latestReport);
                setShowReportModal(true);
              }}
            >
              <Text style={styles.fullReportButtonText}>Vollständigen Bericht ansehen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* All Analyses */}
        <View style={styles.allAnalysesCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="archive" size={24} color="#6b7280" />
              <Text style={styles.cardTitle}>Alle Analysen ({analysisHistory.length})</Text>
            </View>
          </View>

          {analysisHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📊</Text>
              <Text style={styles.emptyStateTitle}>Noch keine Analysen</Text>
              <Text style={styles.emptyStateDescription}>Führe deine erste Analyse durch, um deinen Verlauf zu starten.</Text>
            </View>
          ) : (
            <View style={styles.analysesList}>
              {analysisHistory.map(analysis => (
                <View key={analysis.id} style={styles.analysisListItem}>
                  <View style={styles.analysisListHeader}>
                    <View style={styles.analysisListLeft}>
                      <Text style={styles.analysisListIcon}>
                        {analysis.analysisType === 'skin' ? '✨' : 
                         analysis.analysisType === 'hair' ? '💇‍♀️' : '🌟'}
                      </Text>
                      <View>
                        <Text style={styles.analysisListTitle}>
                          {analysis.analysisType === 'skin' ? 'Hautanalyse' :
                           analysis.analysisType === 'hair' ? 'Haaranalyse' : 'Komplettanalyse'}
                        </Text>
                        <Text style={styles.analysisListDate}>
                          {new Date(analysis.timestamp).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.analysisListScore}>
                      <Text style={[styles.analysisListScoreValue, { color: getScoreColor(
                        analysis.skinAnalysis?.score || analysis.hairAnalysis?.healthScore || 0
                      )}]}>
                        {analysis.skinAnalysis?.score || analysis.hairAnalysis?.healthScore || 0}
                      </Text>
                      <Text style={styles.analysisListScoreLabel}>Score</Text>
                    </View>
                  </View>

                  <Text style={styles.analysisListComment}>{analysis.aiComment}</Text>

                  <View style={styles.analysisListActions}>
                    <TouchableOpacity
                      style={styles.analysisListAction}
                      onPress={() => {
                        setSelectedAnalysis(analysis);
                        setShowAnalysisModal(true);
                      }}
                    >
                      <Text style={styles.analysisListActionText}>Details ansehen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.analysisListActionSecondary}>
                      <Text style={styles.analysisListActionSecondaryText}>Empfehlungen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Analysis Details Modal */}
      <Modal visible={showAnalysisModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Analyse Details</Text>
            <TouchableOpacity onPress={() => setShowAnalysisModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedAnalysis && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
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
                      {selectedAnalysis.analysisType === 'skin' ? 'Hautanalyse' :
                       selectedAnalysis.analysisType === 'hair' ? 'Haaranalyse' : 'Komplettanalyse'}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedAnalysis.skinAnalysis && (
                <View style={styles.modalSection}>
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
                </View>
              )}

              {selectedAnalysis.hairAnalysis && (
                <View style={styles.modalSection}>
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
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>KI-Kommentar</Text>
                <Text style={styles.modalComment}>{selectedAnalysis.aiComment}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Weekly Report Modal */}
      <Modal visible={showReportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Wöchentlicher Bericht</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedReport && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Zeitraum</Text>
                <Text style={styles.modalInfoValue}>{selectedReport.period}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Erkannte Veränderungen</Text>
                <View style={styles.changesList}>
                  {selectedReport.changes.map((change, index) => (
                    <View key={index} style={styles.changeItem}>
                      <Text style={styles.changeDescription}>{change.description}</Text>
                      <Text style={[styles.changeValue, {
                        color: change.type === 'improvement' ? '#10b981' : 
                              change.type === 'decline' ? '#ef4444' : '#6b7280'
                      }]}>
                        {change.change}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Empfehlung</Text>
                <Text style={styles.modalRecommendation}>{selectedReport.recommendation}</Text>
              </View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  latestAnalysisCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weeklyReportCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  allAnalysesCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  newBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 14,
    color: '#6b7280',
  },
  pdfButton: {
    backgroundColor: '#6b46c1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  pdfButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  analysisGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  analysisOverview: {
    alignItems: 'center',
    flex: 1,
  },
  analysisIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  analysisTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  analysisScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  analysisDetails: {
    flex: 1,
  },
  analysisDetailTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  analysisDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  analysisComment: {
    flex: 1,
  },
  analysisCommentTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  analysisCommentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  analysisActions: {
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#6b46c1',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  reportGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  reportMetric: {
    flex: 1,
    alignItems: 'center',
  },
  reportIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportMetricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportMetricValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6b46c1',
    marginBottom: 4,
  },
  reportScoreChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1e40af',
  },
  fullReportButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullReportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  analysesList: {
    gap: 16,
  },
  analysisListItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  analysisListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  analysisListIcon: {
    fontSize: 24,
  },
  analysisListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  analysisListDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  analysisListScore: {
    alignItems: 'center',
  },
  analysisListScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  analysisListScoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  analysisListComment: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  analysisListActions: {
    flexDirection: 'row',
    gap: 8,
  },
  analysisListAction: {
    flex: 1,
    backgroundColor: '#6b46c1',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  analysisListActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisListActionSecondary: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  analysisListActionSecondaryText: {
    color: '#374151',
    fontSize: 14,
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
  modalSection: {
    marginBottom: 32,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  modalInfoGrid: {
    gap: 16,
  },
  modalInfoItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modalMetric: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  modalMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b46c1',
    marginBottom: 4,
  },
  modalMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalComment: {
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  changesList: {
    gap: 12,
  },
  changeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
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
  modalRecommendation: {
    fontSize: 16,
    color: '#10b981',
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
});