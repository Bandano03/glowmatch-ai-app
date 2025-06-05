// src/services/openAIService.ts

import { ENV } from '../config/environment';
import { 
  SkinAnalysisResult, 
  HairAnalysisResult, 
  AnalysisError,
  AnalysisType 
} from '../types/analysis.types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class OpenAIService {
  private static apiKey = ENV.OPENAI_API_KEY;

  // VERBESSERTER HAUTANALYSE PROMPT
  private static readonly SKIN_PROMPT = `Du bist ein erfahrener Dermatologe mit 25 Jahren Erfahrung. 

ANALYSIERE DIESES GESICHTSBILD SEHR DETAILLIERT:

1. HAUTTYP BESTIMMUNG:
   - Betrachte T-Zone (Stirn, Nase, Kinn) separat von Wangen
   - Achte auf Porengröße und Sichtbarkeit
   - Bewerte Ölproduktion vs. Trockenheit
   - Bestimme: Normal/Trocken/Fettig/Mischhaut/Sensibel

2. DETAILBEWERTUNG (0-100 Skala):
   - Hydration: Wie gut durchfeuchtet ist die Haut?
   - Öligkeit: Wie stark glänzt die Haut?
   - Sensitivität: Sichtbare Rötungen oder Irritationen?

3. TEXTUR ANALYSE:
   - Poren: Feinporig/Großporig/Ungleichmäßig
   - Glätte: Glatt/Uneben/Rau
   - Unreinheiten: Mitesser, Pickel, Narben

4. HAUTPROBLEME IDENTIFIZIEREN:
   - Mindestens 2-4 spezifische Probleme benennen
   - Z.B. "Trockenheit an den Wangen", "Glanz in der T-Zone"

5. ALTERSSCHÄTZUNG:
   - Bereich angeben: z.B. "25-30 Jahre"

6. DETAILLIERTE EMPFEHLUNGEN:
   - Morgenroutine: 4-6 konkrete Schritte
   - Abendroutine: 4-6 konkrete Schritte  
   - Wochenbehandlungen: 2-4 Treatments

7. INHALTSSTOFFE:
   - 4-6 empfohlene Inhaltsstoffe
   - 3-4 zu vermeidende Inhaltsstoffe

ANTWORTE NUR MIT DIESEM JSON-FORMAT:
{
  "skinType": "Hauttyp hier",
  "hydration": Zahl_0_bis_100,
  "oiliness": Zahl_0_bis_100,
  "sensitivity": Zahl_0_bis_100,
  "texture": "Textur hier",
  "concerns": ["Problem 1", "Problem 2", "Problem 3"],
  "ageEstimate": "Altersbereich",
  "recommendations": {
    "morning": ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4"],
    "evening": ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4"],
    "weekly": ["Treatment 1", "Treatment 2", "Treatment 3"]
  },
  "ingredients": {
    "recommended": ["Inhaltsstoff 1", "Inhaltsstoff 2", "Inhaltsstoff 3", "Inhaltsstoff 4"],
    "avoid": ["Meide 1", "Meide 2", "Meide 3"]
  },
  "confidence": Zahl_70_bis_95
}`;

  // VERBESSERTER HAARANALYSE PROMPT
  private static readonly HAIR_PROMPT = `Du bist ein Haar-Experte und Trichologie-Spezialist.

ANALYSIERE DIESES HAAR SEHR GENAU:

1. HAARTYP BESTIMMUNG (André Walker System):
   - Typ 1 (Gerade): 1A (sehr dünn), 1B (mittel), 1C (dick)
   - Typ 2 (Wellig): 2A (leicht), 2B (mittel), 2C (stark)
   - Typ 3 (Lockig): 3A (große Locken), 3B (mittlere), 3C (kleine)
   - Typ 4 (Kraus): 4A (weich), 4B (drahtiger), 4C (sehr kraus)

2. STRUKTUR EIGENSCHAFTEN:
   - Struktur: Glatt/Wellig/Lockig/Kraus
   - Dicke: Dünn/Normal/Dick
   - Porosität: Niedrig/Normal/Hoch (erkennbar am Glanz)

3. ZUSTAND BEWERTUNG (0-100):
   - Schädigung: Spliss, Bruch, Trockenheit
   - Gesundheit: Allgemeiner Zustand

4. KOPFHAUT ANALYSE:
   - Normal/Trocken/Fettig/Sensibel
   - Sichtbare Probleme: Schuppen, Rötungen

5. SICHTBARE PROBLEME:
   - 2-4 spezifische Haarprobleme
   - Z.B. "Spliss in den Spitzen", "Frizz bei Feuchtigkeit"

6. FARBE BESCHREIBUNG:
   - Natürliche Farbe oder Färbung erkennen

7. EMPFEHLUNGEN:
   - Produkte: 4-5 spezifische Produkttypen
   - Treatments: 3-4 Behandlungen
   - Styling: 4-5 Styling-Tipps

8. INHALTSSTOFFE:
   - Empfohlene und zu vermeidende Inhaltsstoffe

ANTWORTE NUR MIT DIESEM JSON-FORMAT:
{
  "hairType": "2B",
  "structure": "Wellig",
  "thickness": "Normal", 
  "porosity": "Normal",
  "damage": Zahl_0_bis_100,
  "scalp": "Normal",
  "concerns": ["Problem 1", "Problem 2", "Problem 3"],
  "color": "Farbbeschreibung",
  "recommendations": {
    "products": ["Produkt 1", "Produkt 2", "Produkt 3", "Produkt 4"],
    "treatments": ["Treatment 1", "Treatment 2", "Treatment 3"],
    "styling": ["Tipp 1", "Tipp 2", "Tipp 3", "Tipp 4"]
  },
  "ingredients": {
    "recommended": ["Inhaltsstoff 1", "Inhaltsstoff 2", "Inhaltsstoff 3"],
    "avoid": ["Meide 1", "Meide 2", "Meide 3"]
  },
  "confidence": Zahl_70_bis_95
}`;

  private static async makeAPICall(messages: any[], maxTokens: number = 1500): Promise<any> {
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
            model: 'gpt-4o', // AKTUALISIERT auf neuestes Model
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.2, // Niedriger für konsistentere Ergebnisse
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
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
        
        if (error.message.includes('API Key ungültig') || 
            error.message.includes('Rate Limit')) {
          throw error;
        }

        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Unbekannter Fehler bei der API-Anfrage');
  }

  static async analyzeSkin(imageBase64: string): Promise<SkinAnalysisResult> {
    try {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: this.SKIN_PROMPT },
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

      const response = await this.makeAPICall(messages, 2000);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat von der KI');
      }
      
      const result = JSON.parse(jsonMatch[0]) as SkinAnalysisResult;
      this.validateSkinAnalysis(result);
      
      return result;
    } catch (error) {
      console.error('Skin analysis error:', error);
      throw error;
    }
  }

  static async analyzeHair(imageBase64: string): Promise<HairAnalysisResult> {
    try {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: this.HAIR_PROMPT },
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

      const response = await this.makeAPICall(messages, 2000);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat von der KI');
      }
      
      const result = JSON.parse(jsonMatch[0]) as HairAnalysisResult;
      this.validateHairAnalysis(result);
      
      return result;
    } catch (error) {
      console.error('Hair analysis error:', error);
      throw error;
    }
  }

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

    if (result.damage < 0 || result.damage > 100) {
      throw new Error('Damage muss zwischen 0 und 100 liegen');
    }
  }

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