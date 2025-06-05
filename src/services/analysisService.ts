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

  // Hauptanalyse-Funktion - NUR echte Bilder, KEINE Demo-Daten
  static async analyze(
    imageBase64: string, 
    type: AnalysisType,
    useCache: boolean = true
  ): Promise<AnalysisResponse> {
    const timestamp = new Date();

    try {
      // Validiere das Bild
      if (!imageBase64 || imageBase64.length < 1000) {
        throw new Error('Kein gültiges Bild vorhanden. Bitte nehmen Sie ein Foto auf.');
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
        // KEINE Demo-Daten mehr!
        if (!isOnline) {
          throw new Error('Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.');
        } else if (!hasAPIKey) {
          throw new Error('Die Analyse ist momentan nicht verfügbar. Bitte kontaktieren Sie den Support.');
        }
      }

      return {
        success: true,
        data: result,
        timestamp
      };

    } catch (error) {
      console.error('Analysis error:', error);
      
      // KEINE Demo-Daten - Fehler zurückgeben!
      return {
        success: false,  // WICHTIG: false statt true
        data: undefined,  // WICHTIG: undefined statt Demo-Daten
        error: {
          code: 'ANALYSIS_ERROR',
          message: this.getErrorMessage(error),
          details: error
        },
        timestamp
      };
    }
  }

  // Benutzerfreundliche Fehlermeldungen
  private static getErrorMessage(error: any): string {
    const errorMessage = error?.message || '';

    if (errorMessage.includes('Internetverbindung')) {
      return errorMessage;
    } else if (errorMessage.includes('dunkel')) {
      return 'Das Bild ist zu dunkel. Bitte sorgen Sie für bessere Beleuchtung.';
    } else if (errorMessage.includes('unscharf')) {
      return 'Das Bild ist unscharf. Bitte halten Sie die Kamera ruhig.';
    } else if (errorMessage.includes('Gesicht') || errorMessage.includes('kein Gesicht')) {
      return 'Kein Gesicht erkannt. Bitte positionieren Sie Ihr Gesicht mittig im Bild.';
    } else if (errorMessage.includes('Haar') || errorMessage.includes('keine Haare')) {
      return 'Keine Haare erkannt. Bitte stellen Sie sicher, dass Ihre Haare gut sichtbar sind.';
    } else if (errorMessage.includes('API Key')) {
      return 'Die Analyse ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.';
    } else if (errorMessage.includes('Rate Limit')) {
      return 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
    }

    return 'Die Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es mit einem anderen Bild.';
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