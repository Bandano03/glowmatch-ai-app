// src/services/analysisService.ts

import { OpenAIService } from './openAIService';
import { FallbackAnalysisService } from './fallbackAnalysisService';
import { 
  SkinAnalysisResult, 
  HairAnalysisResult, 
  AnalysisType,
  AnalysisResponse 
} from '../types/analysis.types';
import * as SecureStore from 'expo-secure-store';
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
      // Cache prüfen
      if (useCache) {
        const cached = await this.getCachedAnalysis(imageBase64, type);
        if (cached) {
          return {
            success: true,
            data: cached,
            timestamp
          };
        }
      }

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

      // Ergebnis cachen
      if (useCache) {
        await this.cacheAnalysis(imageBase64, type, result);
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

  // Cache-Funktionen
  private static async getCachedAnalysis(
    imageBase64: string, 
    type: AnalysisType
  ): Promise<SkinAnalysisResult | HairAnalysisResult | null> {
    try {
      const key = this.getCacheKey(imageBase64, type);
      const cached = await SecureStore.getItemAsync(key);
      
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - new Date(timestamp).getTime();
      
      if (age > this.CACHE_DURATION) {
        await SecureStore.deleteItemAsync(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  private static async cacheAnalysis(
    imageBase64: string,
    type: AnalysisType,
    data: SkinAnalysisResult | HairAnalysisResult
  ): Promise<void> {
    try {
      const key = this.getCacheKey(imageBase64, type);
      await SecureStore.setItemAsync(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private static getCacheKey(imageBase64: string, type: AnalysisType): string {
    // Erstelle einen kurzen Hash aus dem Bild für den Cache-Key
    const imageHash = imageBase64.substring(0, 50);
    return `${this.CACHE_PREFIX}${type}_${imageHash}`;
  }

  // Alle Cache-Einträge löschen
  static async clearCache(): Promise<void> {
    // In einer echten App würden Sie hier alle Cache-Keys durchgehen
    console.log('Cache geleert');
  }

  // API Verbindung testen
  static async testConnection(): Promise<boolean> {
    return OpenAIService.testAPIConnection();
  }
}