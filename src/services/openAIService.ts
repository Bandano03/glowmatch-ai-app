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
  private static readonly SKIN_PROMPT = `Du bist ein erfahrener Dermatologe. Analysiere dieses Gesichtsbild.

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt. Keine Erklärungen davor oder danach!

Analysiere:
1. Hauttyp: Normal, Trocken, Fettig, Mischhaut oder Sensibel
2. Hydration: 0-100 (wie feucht ist die Haut?)
3. Öligkeit: 0-100 (wie ölig/glänzend?)
4. Sensitivität: 0-100 (Rötungen/Irritationen?)
5. Textur: Glatt, Uneben, Rau, Feinporig oder Großporig
6. Probleme: 2-4 sichtbare Hautprobleme
7. Alter: Schätzung als Bereich
8. Empfehlungen: Konkrete Morgen-, Abend- und Wochenroutine
9. Inhaltsstoffe: Was empfehlen, was vermeiden

ANTWORT-FORMAT (exakt so):
{
  "skinType": "Hauttyp",
  "hydration": 75,
  "oiliness": 30,
  "sensitivity": 20,
  "texture": "Textur",
  "concerns": ["Problem 1", "Problem 2", "Problem 3"],
  "ageEstimate": "25-30",
  "recommendations": {
    "morning": ["Reinigung", "Serum", "Feuchtigkeitscreme", "Sonnenschutz"],
    "evening": ["Reinigung", "Treatment", "Serum", "Nachtcreme"],
    "weekly": ["Peeling 1x", "Maske 2x", "Massage 1x"]
  },
  "ingredients": {
    "recommended": ["Hyaluronsäure", "Niacinamid", "Ceramide", "Vitamin C"],
    "avoid": ["Alkohol", "Duftstoffe", "Sulfate"]
  },
  "confidence": 85
}`;

  // VERBESSERTER HAARANALYSE PROMPT
  private static readonly HAIR_PROMPT = `Du bist ein Haar-Experte. Analysiere dieses Haar.

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt. Keine Erklärungen!

Analysiere:
1. Haartyp: 1A-4C (André Walker System)
2. Struktur: Glatt, Wellig, Lockig oder Kraus
3. Dicke: Dünn, Normal oder Dick
4. Porosität: Niedrig, Normal oder Hoch
5. Schäden: 0-100 (Spliss, Bruch, Trockenheit)
6. Kopfhaut: Normal, Trocken, Fettig oder Sensibel
7. Probleme: 2-4 sichtbare Haarprobleme
8. Farbe: Natürlich oder gefärbt
9. Empfehlungen: Produkte, Treatments, Styling-Tipps

ANTWORT-FORMAT (exakt so):
{
  "hairType": "2B",
  "structure": "Wellig",
  "thickness": "Normal",
  "porosity": "Normal",
  "damage": 35,
  "scalp": "Normal",
  "concerns": ["Spliss", "Frizz", "Trockenheit"],
  "color": "Naturbraun",
  "recommendations": {
    "products": ["Sulfatfreies Shampoo", "Conditioner", "Leave-in", "Curl Cream"],
    "treatments": ["Haarmaske wöchentlich", "Protein-Treatment monatlich", "Spitzenschnitt"],
    "styling": ["Plopping", "Diffusor", "Satin-Kissen", "Nicht täglich waschen"]
  },
  "ingredients": {
    "recommended": ["Arganöl", "Sheabutter", "Glycerin", "Keratin"],
    "avoid": ["Sulfate", "Alkohol", "Silikone"]
  },
  "confidence": 82
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
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.1,
            response_format: { type: "json_object" },
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
      this.logAPIResponse(response, 'skin');
      
      // VERBESSERTE JSON-EXTRAKTION
      let jsonMatch = response.match(/\{[\s\S]*\}/);

      // Fallback: Versuche andere JSON-Formate zu finden
      if (!jsonMatch) {
        // Suche nach JSON zwischen ```json und ```
        const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]];
        } else {
          // Suche nach dem ersten { bis zum letzten }
          const startIndex = response.indexOf('{');
          const lastIndex = response.lastIndexOf('}');
          if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            jsonMatch = [response.substring(startIndex, lastIndex + 1)];
          }
        }
      }
      
      if (!jsonMatch) {
        throw new Error('Kein JSON in der KI-Antwort gefunden');
      }
      
      try {
        const result = JSON.parse(jsonMatch[0]) as SkinAnalysisResult;
        this.validateSkinAnalysis(result);
        return result;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Rohe API Antwort:', response);
        
        // Fallback auf Demo-Daten bei Parse-Fehlern
        console.log('🔄 Fallback auf Demo-Daten wegen Parse-Fehler');
        throw new Error('KI-Antwort konnte nicht verarbeitet werden. Verwende Demo-Modus.');
      }
      
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
      this.logAPIResponse(response, 'hair');
      
      // VERBESSERTE JSON-EXTRAKTION
      let jsonMatch = response.match(/\{[\s\S]*\}/);

      // Fallback: Versuche andere JSON-Formate zu finden
      if (!jsonMatch) {
        // Suche nach JSON zwischen ```json und ```
        const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]];
        } else {
          // Suche nach dem ersten { bis zum letzten }
          const startIndex = response.indexOf('{');
          const lastIndex = response.lastIndexOf('}');
          if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            jsonMatch = [response.substring(startIndex, lastIndex + 1)];
          }
        }
      }
      
      if (!jsonMatch) {
        throw new Error('Kein JSON in der KI-Antwort gefunden');
      }
      
      try {
        const result = JSON.parse(jsonMatch[0]) as HairAnalysisResult;
        this.validateHairAnalysis(result);
        return result;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Rohe API Antwort:', response);
        
        // Fallback auf Demo-Daten bei Parse-Fehlern
        console.log('🔄 Fallback auf Demo-Daten wegen Parse-Fehler');
        throw new Error('KI-Antwort konnte nicht verarbeitet werden. Verwende Demo-Modus.');
      }
      
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

  // Debug-Funktion für Entwicklung
  static logAPIResponse(response: string, type: 'skin' | 'hair'): void {
    console.log(`=== ${type.toUpperCase()} ANALYSIS DEBUG ===`);
    console.log('Rohe Antwort:', response);
    console.log('Länge:', response.length);
    console.log('Erste 200 Zeichen:', response.substring(0, 200));
    console.log('Letzte 200 Zeichen:', response.substring(response.length - 200));
    console.log('=== ENDE DEBUG ===');
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