// src/services/analysisService.ts

import { OpenAIService } from './openAIService';
import { FallbackAnalysisService } from './fallbackAnalysisService';
import { 
  SkinAnalysisResult, 
  HairAnalysisResult, 
  AnalysisType,
  AnalysisResponse 
} from '../types/analysis.types';
import { ENV } from '../config/environment';

export class AnalysisService {
  private static readonly CACHE_PREFIX = 'analysis_cache_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

  // Hauptanalyse-Funktion mit Fallback
  static async analyze(
    imageBase64: string, 
    type: AnalysisType,
    useCache: boolean = true
  ): Promise<AnalysisResponse> {
    const timestamp = new Date();

    try {
      // Cache temporär deaktiviert wegen SecureStore Issues
      // TODO: AsyncStorage implementieren für Cache

      // Prüfe ob wir online sind und API Key haben
      const isOnline = await this.checkOnlineStatus();
      const hasAPIKey = !!ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY !== 'sk-proj-IhrOpenAIKeyHier';

      let result: SkinAnalysisResult | HairAnalysisResult;

      if (isOnline && hasAPIKey) {
        // Echte API-Analyse
        console.log('🔄 Führe echte KI-Analyse durch...');
        result = type === 'skin' 
          ? await OpenAIService.analyzeSkin(imageBase64)
          : await OpenAIService.analyzeHair(imageBase64);
      } else {
        // Fallback auf Demo-Daten
        console.log('📱 Verwende Demo-Daten (Offline-Modus)');
        result = type === 'skin'
          ? FallbackAnalysisService.getSkinAnalysisDemoWithVariation()
          : FallbackAnalysisService.getHairAnalysisDemoWithVariation();
      }

      return {
        success: true,
        data: result,
        timestamp
      };

    } catch (error) {
      console.error('Analysis error:', error);
      
      // Bei Fehler: Fallback auf Demo-Daten
      const fallbackResult = type === 'skin'
        ? FallbackAnalysisService.getSkinAnalysisDemo()
        : FallbackAnalysisService.getHairAnalysisDemo();

      return {
        success: true,
        data: fallbackResult,
        error: {
          code: 'ANALYSIS_FALLBACK',
          message: 'Analyse nicht verfügbar, Demo-Daten werden angezeigt',
          details: error.message
        },
        timestamp
      };
    }
  }

  // Online-Status prüfen
  private static async checkOnlineStatus(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`
        }
      });
      return response.ok || response.status === 401; // 401 = API Key falsch, aber online
    } catch {
      return false;
    }
  }

  // Alle Cache-Einträge löschen
  static async clearCache(): Promise<void> {
    // Placeholder für zukünftige Implementation
    console.log('Cache clearing not implemented yet');
  }

  // API Verbindung testen
  static async testConnection(): Promise<boolean> {
    return OpenAIService.testAPIConnection();
  }
}