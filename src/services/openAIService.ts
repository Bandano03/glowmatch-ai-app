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
            model: 'gpt-4o-mini', // AKTUALISIERTES MODEL!
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
    // Validiere Bild
    if (!imageBase64 || imageBase64.length < 1000) {
      throw new Error('Bild ist zu klein oder ungültig. Bitte nehmen Sie ein neues Foto auf.');
    }

    const prompt = `Du bist ein erfahrener Dermatologe mit 20 Jahren Erfahrung. Analysiere dieses Gesichtsbild sehr detailliert und professionell.

WICHTIG: 
1. Wenn das Bild zu dunkel, unscharf oder kein Gesicht zeigt, antworte mit einem Fehler-JSON:
   {"error": true, "errorMessage": "Beschreibung des Problems (z.B. 'Bild zu dunkel', 'Kein Gesicht erkannt', 'Bild unscharf')"}
2. Antworte NUR mit einem validen JSON-Objekt, keine zusätzlichen Erklärungen.

Wenn das Bild analysierbar ist, analysiere folgende Aspekte:
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
      
      const result = JSON.parse(jsonMatch[0]) as any;

      // Prüfe ob die KI einen Fehler zurückgegeben hat
      if (result.error === true) {
        throw new Error(result.errorMessage || 'Das Bild konnte nicht analysiert werden. Bitte achten Sie auf gute Beleuchtung und dass das Gesicht gut sichtbar ist.');
      }

      // Sicherstellen dass alle erforderlichen Felder vorhanden sind
      if (!result.recommendations) {
        result.recommendations = { morning: [], evening: [], weekly: [] };
      }
      if (!result.ingredients) {
        result.ingredients = { recommended: [], avoid: [] };
      }
      if (!result.concerns || !Array.isArray(result.concerns)) {
        result.concerns = [];
      }

      // Validierung der Ergebnisse
      this.validateSkinAnalysis(result as SkinAnalysisResult);
      
      return result as SkinAnalysisResult;
    } catch (error) {
      console.error('Skin analysis error:', error);
      throw error;
    }
  }

  // Haaranalyse
  static async analyzeHair(imageBase64: string): Promise<HairAnalysisResult> {
    // Validiere Bild
    if (!imageBase64 || imageBase64.length < 1000) {
      throw new Error('Bild ist zu klein oder ungültig. Bitte nehmen Sie ein neues Foto auf.');
    }

    const prompt = `Du bist ein professioneller Haar-Experte und Trichologe. Analysiere dieses Haarbild sehr detailliert.

WICHTIG: 
1. Wenn das Bild zu dunkel, unscharf oder keine Haare zeigt, antworte mit einem Fehler-JSON:
   {"error": true, "errorMessage": "Beschreibung des Problems (z.B. 'Bild zu dunkel', 'Keine Haare erkannt', 'Bild unscharf')"}
2. Antworte NUR mit einem validen JSON-Objekt, keine zusätzlichen Erklärungen.

Wenn das Bild analysierbar ist, analysiere folgende Aspekte:
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
      
      const result = JSON.parse(jsonMatch[0]) as any;

      // Prüfe ob die KI einen Fehler zurückgegeben hat
      if (result.error === true) {
        throw new Error(result.errorMessage || 'Das Bild konnte nicht analysiert werden. Bitte achten Sie auf gute Beleuchtung und dass die Haare gut sichtbar sind.');
      }

      // Sicherstellen dass alle erforderlichen Felder vorhanden sind
      if (!result.recommendations) {
        result.recommendations = { products: [], treatments: [], styling: [] };
      }
      if (!result.ingredients) {
        result.ingredients = { recommended: [], avoid: [] };
      }
      if (!result.concerns || !Array.isArray(result.concerns)) {
        result.concerns = [];
      }
      
      // Validierung der Ergebnisse
      this.validateHairAnalysis(result as HairAnalysisResult);
      
      return result as HairAnalysisResult;
    } catch (error) {
      console.error('Hair analysis error:', error);
      throw error;
    }
  }

  // NEUE METHODE: Erweiterte Analyse für mehrere Bilder
  static async analyzeMultipleImages(
    images: string[], 
    type: AnalysisType, 
    analysisDepth: 'basic' | 'advanced' = 'advanced'
  ): Promise<any> {
    const prompt = analysisDepth === 'advanced' 
      ? this.getAdvancedAnalysisPrompt(type)
      : this.getBasicAnalysisPrompt(type);

    try {
      // Erstelle Content Array mit allen Bildern
      const imageContent = images.map((image, index) => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:image/jpeg;base64,${image}`,
          detail: 'high' as const
        }
      }));

      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: prompt },
            ...imageContent
          ]
        }
      ];

      const response = await this.makeAPICall(messages, 3000); // Mehr Tokens für detaillierte Analyse
      
      // JSON aus der Antwort extrahieren
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat von der KI');
      }
      
      const result = JSON.parse(jsonMatch[0]);

      // Prüfe ob die KI einen Fehler zurückgegeben hat
      if (result.error === true) {
        throw new Error(result.errorMessage || 'Die Bilder konnten nicht analysiert werden.');
      }

      return result;
    } catch (error) {
      console.error('Multiple image analysis error:', error);
      throw error;
    }
  }

  // Erweiterte Analyse-Prompts
  private static getAdvancedAnalysisPrompt(type: AnalysisType): string {
    if (type === 'skin') {
      return `Du bist ein weltführender Dermatologe mit 30 Jahren Erfahrung und analysierst mehrere hochauflösende Bilder eines Gesichts.

WICHTIG: 
- Wenn die Bilder zu dunkel, unscharf oder kein Gesicht erkennbar ist, antworte mit: {"error": true, "errorMessage": "Beschreibung des Problems"}
- Ansonsten antworte NUR mit dem vollständigen JSON-Objekt ohne zusätzliche Erklärungen.

Führe eine EXTREM detaillierte Analyse durch:

1. HAUTSTRUKTUR-MAPPING:
   - Analysiere jede Gesichtsregion separat (Stirn, Wangen, Nase, Kinn, Augenbereich)
   - Porengröße und -verteilung (0-100 für jede Region)
   - Hautdicke und Elastizität (0-100)
   - Mikro-Relief und Textur-Unregelmäßigkeiten

2. ALTERUNGSANALYSE:
   - Chronologisches vs. biologisches Alter
   - Kollagenabbau-Level (0-100)
   - Elastin-Qualität (0-100)
   - Volumenverlust in verschiedenen Bereichen

3. PIGMENTIERUNG & HAUTTON:
   - Melanin-Verteilung
   - Hyperpigmentierung (Lokation, Intensität)
   - Melasma-Risiko (0-100)
   - Vaskuläre Läsionen

4. HYDRATATIONS-MAPPING:
   - Trans-epidermaler Wasserverlust (geschätzt)
   - Lokale Trockenheitszonen
   - Lipidbarriere-Status (0-100)

5. UMWELTSCHÄDEN:
   - UV-Schäden (0-100)
   - Pollution-Impact (0-100)
   - Blue-Light-Schäden (0-100)
   - Stress-Marker (0-100)

6. DETAILLIERTE EMPFEHLUNGEN:
   - Sofortmaßnahmen (24-48h)
   - Kurzfristige Ziele (2 Wochen)
   - Langfristige Strategie (3-6 Monate)
   - Spezifische Produkte mit Wirkstoffkonzentrationen
   - Professionelle Treatments

Antworte im komplexen JSON-Format mit allen numerischen Bewertungen und Arrays.`;
    } else {
      return `Du bist ein führender Trichologe und Haar-Experte. Analysiere diese Bilder für eine vollständige Haar- und Kopfhautdiagnose.

WICHTIG: 
- Wenn die Bilder zu dunkel, unscharf oder keine Haare zeigen, antworte mit: {"error": true, "errorMessage": "Beschreibung des Problems"}
- Ansonsten nur JSON-Antwort.

Analysiere:
1. Haarstruktur-Details für jede Haarregion
2. Kopfhaut-Gesundheit in verschiedenen Zonen
3. Schädigungsgrad pro Haarlänge
4. Detaillierte Behandlungsempfehlungen

Gib detailliertes JSON zurück.`;
    }
  }

  private static getBasicAnalysisPrompt(type: AnalysisType): string {
    return type === 'skin' 
      ? `Analysiere dieses Hautbild und gib eine grundlegende Bewertung. Wenn das Bild nicht analysierbar ist, antworte mit {"error": true, "errorMessage": "Grund"}.`
      : `Analysiere dieses Haarbild und gib eine grundlegende Bewertung. Wenn das Bild nicht analysierbar ist, antworte mit {"error": true, "errorMessage": "Grund"}.`;
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