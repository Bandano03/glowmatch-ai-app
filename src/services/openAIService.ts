// src/services/openAIService.ts

import { ENV } from '../config/environment';
import { 
  SkinAnalysisResult, 
  HairAnalysisResult, 
  AnalysisError,
  AnalysisType 
} from '../types/analysis.types';

// OpenAI API Konfiguration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 Sekunde

export class OpenAIService {
  private static apiKey = ENV.OPENAI_API_KEY;

  // Hilfsfunktion für API Calls mit Retry-Logic
  private static async makeAPICall(messages: any[], maxTokens: number = 1000): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o', // KORRIGIERTES MODEL!
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.3, // Niedrig für konsistente Ergebnisse
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Spezifische Fehlerbehandlung
          if (response.status === 401) {
            throw new Error('API Key ungültig. Bitte prüfen Sie Ihren OpenAI API Key.');
          } else if (response.status === 429) {
            throw new Error('Rate Limit erreicht. Bitte versuchen Sie es später erneut.');
          } else if (response.status === 400) {
            throw new Error('Ungültige Anfrage. Bild möglicherweise zu groß oder beschädigt.');
          }
          
          throw new Error(errorData.error?.message || `API Fehler: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

      } catch (error) {
        lastError = error as Error;
        console.error(`API Versuch ${attempt + 1} fehlgeschlagen:`, error);
        
        // Nicht erneut versuchen bei bestimmten Fehlern
        if (error.message.includes('API Key ungültig') || 
            error.message.includes('Rate Limit')) {
          throw error;
        }

        // Warte vor erneutem Versuch
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Unbekannter Fehler bei der API-Anfrage');
  }

  // Hautanalyse
  static async analyzeSkin(imageBase64: string): Promise<SkinAnalysisResult> {
    const prompt = `Du bist ein erfahrener Dermatologe mit 20 Jahren Erfahrung. Analysiere dieses Gesichtsbild sehr detailliert und professionell.

WICHTIG: Antworte NUR mit einem validen JSON-Objekt, keine zusätzlichen Erklärungen.

Analysiere folgende Aspekte:
1. Hauttyp (Normal/Trocken/Fettig/Mischhaut/Sensibel)
2. Hydratationslevel (0-100, wobei 100 = perfekt hydriert)
3. Öligkeitsgrad (0-100, wobei 100 = sehr ölig)
4. Sensitivität (0-100, wobei 100 = sehr sensibel)
5. Hauttextur (Glatt/Uneben/Rau/Feinporig/Großporig)
6. Sichtbare Hautprobleme (mindestens 2-3 spezifische Probleme)
7. Geschätztes Alter der Person
8. Detaillierte Produktempfehlungen für Morgen-, Abend- und Wochenroutine
9. Spezifische Inhaltsstoffe die empfohlen werden und vermieden werden sollten

Antworte im folgenden JSON-Format:
{
  "skinType": "Hauttyp",
  "hydration": Zahl,
  "oiliness": Zahl,
  "sensitivity": Zahl,
  "texture": "Textur",
  "concerns": ["Problem1", "Problem2", "Problem3"],
  "ageEstimate": "20-25",
  "recommendations": {
    "morning": ["Produkt/Schritt 1", "Produkt/Schritt 2", "Produkt/Schritt 3", "Produkt/Schritt 4"],
    "evening": ["Produkt/Schritt 1", "Produkt/Schritt 2", "Produkt/Schritt 3", "Produkt/Schritt 4"],
    "weekly": ["Treatment 1", "Treatment 2", "Treatment 3"]
  },
  "ingredients": {
    "recommended": ["Inhaltsstoff1", "Inhaltsstoff2", "Inhaltsstoff3", "Inhaltsstoff4"],
    "avoid": ["Inhaltsstoff1", "Inhaltsstoff2", "Inhaltsstoff3"]
  },
  "confidence": Zahl zwischen 0-100
}`;

    try {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ];

      const response = await this.makeAPICall(messages, 1500);
      
      // JSON aus der Antwort extrahieren
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat von der KI');
      }
      
      const result = JSON.parse(jsonMatch[0]) as SkinAnalysisResult;
      
      // Validierung der Ergebnisse
      this.validateSkinAnalysis(result);
      
      return result;
    } catch (error) {
      console.error('Skin analysis error:', error);
      throw error;
    }
  }

  // Haaranalyse
  static async analyzeHair(imageBase64: string): Promise<HairAnalysisResult> {
    const prompt = `Du bist ein professioneller Haar-Experte und Trichologe. Analysiere dieses Haarbild sehr detailliert.

WICHTIG: Antworte NUR mit einem validen JSON-Objekt, keine zusätzlichen Erklärungen.

Analysiere folgende Aspekte:
1. Haartyp nach dem Hair Type System (1A-4C)
2. Haarstruktur (Glatt/Wellig/Lockig/Kraus)
3. Haardicke (Dünn/Normal/Dick)
4. Porosität (Niedrig/Normal/Hoch)
5. Schädigungsgrad (0-100, wobei 100 = stark geschädigt)
6. Kopfhautzustand (Normal/Trocken/Fettig/Sensibel)
7. Sichtbare Probleme (mindestens 2-3 spezifische Probleme)
8. Haarfarbe (natürlich oder gefärbt)
9. Detaillierte Empfehlungen für Produkte, Treatments und Styling

Antworte im folgenden JSON-Format:
{
  "hairType": "2B",
  "structure": "Wellig",
  "thickness": "Normal",
  "porosity": "Normal",
  "damage": Zahl,
  "scalp": "Normal",
  "concerns": ["Problem1", "Problem2", "Problem3"],
  "color": "Beschreibung der Haarfarbe",
  "recommendations": {
    "products": ["Produkt1", "Produkt2", "Produkt3", "Produkt4"],
    "treatments": ["Treatment1", "Treatment2", "Treatment3"],
    "styling": ["Tipp1", "Tipp2", "Tipp3"]
  },
  "ingredients": {
    "recommended": ["Inhaltsstoff1", "Inhaltsstoff2", "Inhaltsstoff3", "Inhaltsstoff4"],
    "avoid": ["Inhaltsstoff1", "Inhaltsstoff2", "Inhaltsstoff3"]
  },
  "confidence": Zahl zwischen 0-100
}`;

    try {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ];

      const response = await this.makeAPICall(messages, 1500);
      
      // JSON aus der Antwort extrahieren
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat von der KI');
      }
      
      const result = JSON.parse(jsonMatch[0]) as HairAnalysisResult;
      
      // Validierung der Ergebnisse
      this.validateHairAnalysis(result);
      
      return result;
    } catch (error) {
      console.error('Hair analysis error:', error);
      throw error;
    }
  }

  // Validierungsfunktionen
  private static validateSkinAnalysis(result: SkinAnalysisResult): void {
    const requiredFields = [
      'skinType', 'hydration', 'oiliness', 'sensitivity', 
      'texture', 'concerns', 'ageEstimate', 'recommendations', 
      'ingredients', 'confidence'
    ];

    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Fehlendes Feld in der Analyse: ${field}`);
      }
    }

    // Werte-Validierung
    if (result.hydration < 0 || result.hydration > 100) {
      throw new Error('Hydration muss zwischen 0 und 100 liegen');
    }
    if (result.oiliness < 0 || result.oiliness > 100) {
      throw new Error('Oiliness muss zwischen 0 und 100 liegen');
    }
    if (result.sensitivity < 0 || result.sensitivity > 100) {
      throw new Error('Sensitivity muss zwischen 0 und 100 liegen');
    }
  }

  private static validateHairAnalysis(result: HairAnalysisResult): void {
    const requiredFields = [
      'hairType', 'structure', 'thickness', 'porosity', 
      'damage', 'scalp', 'concerns', 'color', 
      'recommendations', 'ingredients', 'confidence'
    ];

    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Fehlendes Feld in der Analyse: ${field}`);
      }
    }

    // Werte-Validierung
    if (result.damage < 0 || result.damage > 100) {
      throw new Error('Damage muss zwischen 0 und 100 liegen');
    }
  }

  // Test-Funktion
  static async testAPIConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.ok) {
        console.log('✅ OpenAI API Verbindung erfolgreich!');
        return true;
      } else {
        console.error('❌ OpenAI API Verbindung fehlgeschlagen:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ OpenAI API Test fehlgeschlagen:', error);
      return false;
    }
  }
}