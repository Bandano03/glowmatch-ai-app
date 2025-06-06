// src/services/advancedAnalysisService.ts

import { ENV } from '../config/environment';
import { AdvancedAnalysisResult, ProductRecommendation, RecipeRecommendation } from '../types/advancedAnalysis.types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class AdvancedAnalysisService {
  static async performDeepAnalysis(images: string[]): Promise<AdvancedAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validiere Bilder
      if (!images || images.length === 0) {
        throw new Error('Keine Bilder vorhanden');
      }

      // Filtere undefined/null Bilder heraus
      const validImages = images.filter(img => img && img.length > 100);
      
      if (validImages.length === 0) {
        throw new Error('Keine gültigen Bilder gefunden');
      }

      // Analysiere mehrere Bilder für genauere Ergebnisse
      const analysisPromises = validImages.map((image, index) => 
        this.analyzeImage(image, index).catch(err => {
          console.error(`Fehler bei Bild ${index}:`, err);
          return null; // Returniere null bei Fehler statt zu crashen
        })
      );
      
      const results = await Promise.all(analysisPromises);
      
      // Filtere null-Ergebnisse heraus
      const validResults = results.filter(r => r !== null);
      
      if (validResults.length === 0) {
        throw new Error('Keine Bilder konnten analysiert werden');
      }
      
      // Kombiniere die Ergebnisse
      const combinedResult = await this.combineAnalysisResults(validResults);
      
      // Hole Produkt- und Rezeptempfehlungen
      const recommendations = await this.getDetailedRecommendations(combinedResult);
      
      return {
        ...combinedResult,
        recommendations,
        scanDuration: Date.now() - startTime,
        confidence: 95,
        timestamp: new Date(),
      };
      
    } catch (error) {
      console.error('Advanced analysis error:', error);
      // Bei echtem Fehler: Keine Demo-Daten, sondern Fehler werfen
      throw new Error('Die erweiterte Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.');
    }
  }

  private static async analyzeImage(imageBase64: string, index: number): Promise<any> {
    // Validiere Bild
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Ungültiges Bild');
    }

    const prompt = `Du bist ein führender Dermatologe und Hautexperte mit 30 Jahren Erfahrung. 
    Analysiere dieses Gesichtsbild (Bild ${index + 1}) EXTREM detailliert.
    
    WICHTIG: 
    - Wenn das Bild zu dunkel, unscharf oder kein Gesicht zeigt, antworte mit: {"error": true, "errorMessage": "Beschreibung des Problems"}
    - Ansonsten antworte NUR mit einem validen JSON-Objekt ohne zusätzliche Erklärungen.
    
    Wenn das Bild analysierbar ist, gib ein JSON mit folgender Struktur zurück:
    {
      "hydration": Zahl 0-100,
      "elasticity": Zahl 0-100,
      "firmness": Zahl 0-100,
      "radiance": Zahl 0-100,
      "evenness": Zahl 0-100,
      "poreSize": Zahl 0-100,
      "oilBalance": Zahl 0-100,
      "uvDamage": Zahl 0-100,
      "pollutionImpact": Zahl 0-100,
      "stressLevel": Zahl 0-100,
      "dehydration": Zahl 0-100,
      "skinType": "Normal/Trocken/Fettig/Mischhaut/Sensibel",
      "age": Zahl,
      "concerns": ["Concern1", "Concern2", "Concern3"]
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

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.2,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Fehler: ${response.status}`);
      }

      const data = await response.json();
      
      // Sichere Extraktion der Antwort
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Keine Antwort von der API erhalten');
      }

      // Parse JSON sicher
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Prüfe auf Fehler in der Antwort
      if (result.error === true) {
        throw new Error(result.errorMessage || 'Bild konnte nicht analysiert werden');
      }

      // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
      return {
        hydration: result.hydration || 50,
        elasticity: result.elasticity || 50,
        firmness: result.firmness || 50,
        radiance: result.radiance || 50,
        evenness: result.evenness || 50,
        poreSize: result.poreSize || 50,
        oilBalance: result.oilBalance || 50,
        uvDamage: result.uvDamage || 30,
        pollutionImpact: result.pollutionImpact || 30,
        stressLevel: result.stressLevel || 40,
        dehydration: result.dehydration || 40,
        skinType: result.skinType || 'Normal',
        age: result.age || 25,
        concerns: result.concerns || []
      };

    } catch (error) {
      console.error(`Fehler bei Bildanalyse ${index}:`, error);
      throw error;
    }
  }

  private static async combineAnalysisResults(results: any[]): Promise<any> {
    // Sicherstellen dass results ein Array ist und Elemente hat
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Keine gültigen Analyseergebnisse');
    }

    // Sichere Durchschnittswerte berechnen
    const calculateSafeAverage = (field: string) => {
      const values = results
        .map(r => r?.[field])
        .filter(v => typeof v === 'number' && !isNaN(v));
      
      if (values.length === 0) return 50; // Standardwert
      return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    };

    // Sichere Metrik-Analyse
    const analyzeMetricSafe = (metric: string) => {
      const value = calculateSafeAverage(metric);
      // Trend-Berechnung würde hier normalerweise historische Daten nutzen
      return {
        value,
        trend: 'stable' as const
      };
    };

    const combined = {
      skinAnalysis: {
        type: this.determineSkinType(results),
        age: calculateSafeAverage('age'),
        biologicalAge: calculateSafeAverage('age') - 3, // Vereinfachte Berechnung
        healthScore: 80, // Vereinfachte Berechnung
        
        metrics: {
          hydration: analyzeMetricSafe('hydration'),
          elasticity: analyzeMetricSafe('elasticity'),
          firmness: analyzeMetricSafe('firmness'),
          radiance: analyzeMetricSafe('radiance'),
          evenness: analyzeMetricSafe('evenness'),
          poreSize: analyzeMetricSafe('poreSize'),
          oilBalance: analyzeMetricSafe('oilBalance'),
        },
        
        concerns: {
          primary: this.extractPrimaryConcerns(results),
          secondary: this.extractSecondaryConcerns(results),
          emerging: this.extractEmergingConcerns(results),
        },
        
        environmental: {
          uvDamage: calculateSafeAverage('uvDamage'),
          pollutionImpact: calculateSafeAverage('pollutionImpact'),
          stressLevel: calculateSafeAverage('stressLevel'),
          dehydration: calculateSafeAverage('dehydration'),
        },
      }
    };
    
    return combined;
  }

  private static async getDetailedRecommendations(analysis: any): Promise<any> {
    const recommendations = {
      immediate: [
        {
          title: 'Sofortige Hydratation',
          description: 'Ihre Haut zeigt Anzeichen von Dehydration. Beginnen Sie sofort mit einer intensiven Feuchtigkeitspflege.',
          priority: 'high' as const,
          duration: '1-2 Tage',
          expectedResults: [
            'Reduzierte Spannungsgefühle',
            'Verbesserte Hautelastizität',
            'Strahlenderer Teint'
          ],
          steps: [
            'Gesicht mit lauwarmem Wasser reinigen',
            'Hyaluronsäure-Serum auftragen',
            'Reichhaltige Feuchtigkeitscreme verwenden',
            '2-3L Wasser täglich trinken'
          ]
        }
      ],
      
      shortTerm: [
        {
          title: 'Porenverfeinernde Routine',
          description: 'Reduzieren Sie sichtbare Poren mit gezielter Pflege.',
          priority: 'medium' as const,
          duration: '2 Wochen',
          expectedResults: [
            'Verfeinerte Poren',
            'Glattere Hauttextur',
            'Reduzierte Talgproduktion'
          ],
          steps: [
            'BHA-Peeling 2x wöchentlich',
            'Tonerde-Maske 1x wöchentlich',
            'Niacinamid-Serum täglich'
          ]
        }
      ],
      
      longTerm: [
        {
          title: 'Anti-Aging Protokoll',
          description: 'Langfristige Strategie gegen Hautalterung.',
          priority: 'medium' as const,
          duration: '3 Monate',
          expectedResults: [
            'Reduzierte feine Linien',
            'Verbesserte Hautfestigkeit',
            'Ebenmäßigerer Hautton'
          ],
          steps: [
            'Retinol schrittweise einführen',
            'Vitamin C am Morgen',
            'Peptid-Seren integrieren'
          ]
        }
      ],
      
      products: await this.getProductRecommendations(analysis),
      recipes: await this.getRecipeRecommendations(analysis),
      
      lifestyle: {
        diet: [
          'Omega-3 reiche Lebensmittel (Lachs, Walnüsse)',
          'Antioxidantien (Beeren, grüner Tee)',
          'Vitamin C (Zitrusfrüchte, Paprika)',
          'Kollagen-fördernde Lebensmittel'
        ],
        supplements: [
          'Kollagen-Peptide (10g täglich)',
          'Vitamin D3 (1000 IE)',
          'Omega-3 Fettsäuren',
          'Biotin für Hautgesundheit'
        ],
        habits: [
          '7-8 Stunden Schlaf',
          'Tägliche Gesichtsmassage',
          'Stress-Management durch Meditation',
          'Regelmäßige Bewegung'
        ],
        avoid: [
          'Rauchen',
          'Übermäßiger Alkoholkonsum',
          'Zu heißes Wasser beim Waschen',
          'Aggressive Peelings'
        ]
      }
    };
    
    return recommendations;
  }

  private static async getProductRecommendations(analysis: any): Promise<any> {
    // Diese würden normalerweise aus einer Datenbank kommen
    return {
      essential: [
        {
          id: 'p1',
          name: 'Hydrating Serum',
          brand: 'La Roche-Posay',
          type: 'Serum',
          price: 35,
          keyIngredients: ['Hyaluronsäure', 'Vitamin B5', 'Thermal Wasser'],
          benefits: ['Intensive Feuchtigkeit', 'Beruhigt die Haut', 'Stärkt Hautbarriere'],
          usage: 'Morgens und abends nach der Reinigung',
          matchScore: 95
        },
        {
          id: 'p2',
          name: 'Retinol 0.3%',
          brand: 'The Ordinary',
          type: 'Treatment',
          price: 8,
          keyIngredients: ['Retinol', 'Squalane'],
          benefits: ['Anti-Aging', 'Verfeinert Poren', 'Glättet Hautstruktur'],
          usage: 'Abends, 2-3x pro Woche',
          matchScore: 88
        }
      ],
      advanced: [
        {
          id: 'p3',
          name: 'Vitamin C + E + Ferulic',
          brand: 'Skinceuticals',
          type: 'Serum',
          price: 165,
          keyIngredients: ['15% Vitamin C', 'Vitamin E', 'Ferulasäure'],
          benefits: ['Antioxidativer Schutz', 'Aufhellung', 'Kollagenproduktion'],
          usage: 'Morgens vor Sonnenschutz',
          matchScore: 92
        }
      ],
      professional: [
        {
          id: 'p4',
          name: 'Professional Peel',
          brand: 'Dermalogica',
          type: 'Treatment',
          price: 89,
          keyIngredients: ['Milchsäure', 'Salicylsäure', 'Enzyme'],
          benefits: ['Professionelle Exfoliation', 'Sofortige Ergebnisse'],
          usage: 'Wöchentlich beim Kosmetiker',
          matchScore: 85
        }
      ]
    };
  }

  private static async getRecipeRecommendations(analysis: any): Promise<any> {
    return {
      daily: [
        {
          id: 'r1',
          name: 'Grüner Tee Toner',
          difficulty: 'easy' as const,
          prepTime: 10,
          ingredients: [
            '1 Tasse grüner Tee (abgekühlt)',
            '1 EL Apfelessig',
            '5 Tropfen Teebaumöl'
          ],
          benefits: ['Antioxidantien', 'Poren verfeinernd', 'Entzündungshemmend'],
          matchScore: 90
        }
      ],
      weekly: [
        {
          id: 'r2',
          name: 'Honig-Kurkuma Maske',
          difficulty: 'easy' as const,
          prepTime: 15,
          ingredients: [
            '2 EL Manuka Honig',
            '1 TL Kurkuma',
            '1 TL Joghurt'
          ],
          benefits: ['Aufhellend', 'Antibakteriell', 'Beruhigend'],
          matchScore: 88
        }
      ],
      special: [
        {
          id: 'r3',
          name: 'Luxus Kaviar Maske',
          difficulty: 'medium' as const,
          prepTime: 30,
          ingredients: [
            '1 EL Kaviar-Extrakt',
            '1 Eigelb',
            '1 TL Arganöl',
            '1 Ampulle Kollagen'
          ],
          benefits: ['Anti-Aging', 'Straffend', 'Nährend'],
          matchScore: 85
        }
      ]
    };
  }

  // Helper Methoden - Sichere Implementierungen
  private static determineSkinType(results: any[]): string {
    if (!results || results.length === 0) return 'Normal';
    
    // Sammle alle Hauttypen
    const skinTypes = results
      .map(r => r?.skinType)
      .filter(type => type);
    
    if (skinTypes.length === 0) return 'Normal';
    
    // Finde den häufigsten Hauttyp
    const typeCount: Record<string, number> = {};
    skinTypes.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    let maxCount = 0;
    let dominantType = 'Normal';
    
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });
    
    return dominantType;
  }

  private static extractPrimaryConcerns(results: any[]): string[] {
    if (!results || results.length === 0) return ['Keine spezifischen Probleme erkannt'];
    
    // Sammle alle Concerns
    const allConcerns: string[] = [];
    results.forEach(r => {
      if (r?.concerns && Array.isArray(r.concerns)) {
        allConcerns.push(...r.concerns);
      }
    });
    
    if (allConcerns.length === 0) return ['Keine spezifischen Probleme erkannt'];
    
    // Zähle Häufigkeit
    const concernCount: Record<string, number> = {};
    allConcerns.forEach(concern => {
      concernCount[concern] = (concernCount[concern] || 0) + 1;
    });
    
    // Sortiere nach Häufigkeit und nehme die Top 3
    return Object.entries(concernCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([concern]) => concern);
  }

  private static extractSecondaryConcerns(results: any[]): string[] {
    // Vereinfachte Implementierung
    return [
      'Leichte Hyperpigmentierung',
      'Vergrößerte Poren auf der Nase'
    ];
  }

  private static extractEmergingConcerns(results: any[]): string[] {
    // Vereinfachte Implementierung
    return [
      'Beginnender Elastizitätsverlust',
      'Erste Anzeichen von UV-Schäden'
    ];
  }
}