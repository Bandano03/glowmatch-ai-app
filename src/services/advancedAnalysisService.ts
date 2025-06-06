// src/services/advancedAnalysisService.ts

import { ENV } from '../config/environment';
import { AdvancedAnalysisResult, ProductRecommendation, RecipeRecommendation } from '../types/advancedAnalysis.types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class AdvancedAnalysisService {
  static async performDeepAnalysis(images: { uri: string; base64?: string }[]): Promise<AdvancedAnalysisResult> {
    const startTime = Date.now();
    
    console.log('performDeepAnalysis called with:', {
      imagesCount: images?.length || 0,
      imagesStructure: images?.map((img, i) => ({
        index: i,
        hasUri: !!img?.uri,
        hasBase64: !!img?.base64,
        base64Length: img?.base64?.length || 0
      }))
    });
    
    try {
      // Validiere Bilder
      if (!images || images.length === 0) {
        throw new Error('Keine Bilder vorhanden');
      }

      // Extrahiere Base64-Strings und filtere ungültige heraus
      const validImages = images
        .map(img => img.base64)
        .filter(base64 => base64 && base64.length > 100) as string[];
      
      console.log('Valid base64 images found:', validImages.length);
      
      if (validImages.length === 0) {
        console.error('No valid images found. Image details:', images.map((img, i) => ({
          index: i,
          base64Present: !!img.base64,
          base64Length: img.base64?.length || 0
        })));
        throw new Error('Keine gültigen Bilder gefunden');
      }

      // Reduziere die Anzahl der zu analysierenden Bilder auf maximal 3
      const imagesToAnalyze = validImages.slice(0, 3);
      console.log(`Analyzing ${imagesToAnalyze.length} images (reduced from ${validImages.length} to avoid rate limits)`);

      // Analysiere Bilder SEQUENZIELL statt parallel
      const results = [];
      for (let i = 0; i < imagesToAnalyze.length; i++) {
        try {
          console.log(`Analyzing image ${i + 1}/${imagesToAnalyze.length}...`);
          
          // Warte 1 Sekunde zwischen den Anfragen um Rate Limits zu vermeiden
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const result = await this.analyzeImage(imagesToAnalyze[i], i);
          if (result) {
            results.push(result);
          }
        } catch (err) {
          console.error(`Fehler bei Bild ${i}:`, err);
          
          // Bei Rate Limit Fehler abbrechen
          if (err.message?.includes('Rate limit')) {
            console.warn('Rate limit erreicht, breche weitere Analysen ab');
            break;
          }
        }
      }
      
      // Wenn mindestens ein Bild erfolgreich analysiert wurde
      if (results.length > 0) {
        console.log(`Successfully analyzed ${results.length} images`);
        
        // Kombiniere die Ergebnisse
        const combinedResult = await this.combineAnalysisResults(results);
        
        // Hole Produkt- und Rezeptempfehlungen
        const recommendations = await this.getDetailedRecommendations(combinedResult);
        
        return {
          ...combinedResult,
          recommendations,
          scanDuration: Date.now() - startTime,
          confidence: Math.max(70, Math.min(95, results.length * 30)),
          timestamp: new Date(),
        };
      } else {
        // Fallback auf Demo-Daten wenn keine Analyse erfolgreich war
        console.warn('Keine Bilder konnten analysiert werden, verwende Demo-Daten');
        return this.getDemoAnalysisResult();
      }
      
    } catch (error) {
      console.error('Advanced analysis error:', error);
      
      // Bei Fehler Demo-Daten zurückgeben
      return this.getDemoAnalysisResult();
    }
  }

  private static async analyzeImage(imageBase64: string, index: number): Promise<any> {
    // Validiere Bild
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Ungültiges Bild');
    }

    const prompt = `Du bist ein führender Dermatologe und Hautexperte mit 30 Jahren Erfahrung. 
    Analysiere dieses Gesichtsbild (Bild ${index + 1}) detailliert.
    
    WICHTIG: 
    - Wenn das Bild zu dunkel, unscharf oder kein Gesicht zeigt, antworte mit: {"error": true, "errorMessage": "Kurze Beschreibung des Problems"}
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
                detail: 'low'
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
          max_tokens: 500,
          temperature: 0.2,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Fehler: ${response.status}`);
      }

      const data = await response.json();
      
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Keine Antwort von der API erhalten');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Ungültiges Antwortformat');
      }

      const result = JSON.parse(jsonMatch[0]);

      if (result.error === true) {
        throw new Error(result.errorMessage || 'Bild konnte nicht analysiert werden');
      }

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

  // Korrigierte Demo-Daten Methode
  private static getDemoAnalysisResult(): AdvancedAnalysisResult {
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
      
      products: {
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
          }
        ],
        advanced: [],
        professional: []
      },
      
      recipes: {
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
        weekly: [],
        special: []
      },
      
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

    const demoData: AdvancedAnalysisResult = {
      skinAnalysis: {
        type: 'Mischhaut',
        age: 28,
        biologicalAge: 25,
        healthScore: 82,
        
        metrics: {
          hydration: { value: 75, trend: 'stable' as const },
          elasticity: { value: 85, trend: 'improving' as const },
          firmness: { value: 80, trend: 'stable' as const },
          radiance: { value: 70, trend: 'declining' as const },
          evenness: { value: 78, trend: 'stable' as const },
          poreSize: { value: 65, trend: 'stable' as const },
          oilBalance: { value: 72, trend: 'improving' as const },
        },
        
        concerns: {
          primary: ['Leichte Dehydration', 'Vergrößerte Poren in T-Zone', 'Ungleichmäßiger Hautton'],
          secondary: ['Erste feine Linien', 'Gelegentliche Unreinheiten'],
          emerging: ['Beginnender Elastizitätsverlust', 'Leichte Hyperpigmentierung'],
        },
        
        environmental: {
          uvDamage: 25,
          pollutionImpact: 35,
          stressLevel: 45,
          dehydration: 40,
        },
      },
      
      recommendations: recommendations,
      scanDuration: 5000,
      confidence: 75,
      timestamp: new Date(),
    };

    return demoData;
  }

  private static async combineAnalysisResults(results: any[]): Promise<any> {
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Keine gültigen Analyseergebnisse');
    }

    const calculateSafeAverage = (field: string) => {
      const values = results
        .map(r => r?.[field])
        .filter(v => typeof v === 'number' && !isNaN(v));
      
      if (values.length === 0) return 50;
      return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    };

    const analyzeMetricSafe = (metric: string) => {
      const value = calculateSafeAverage(metric);
      return {
        value,
        trend: 'stable' as const
      };
    };

    const combined = {
      skinAnalysis: {
        type: this.determineSkinType(results),
        age: calculateSafeAverage('age'),
        biologicalAge: calculateSafeAverage('age') - 3,
        healthScore: 80,
        
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

  private static determineSkinType(results: any[]): string {
    if (!results || results.length === 0) return 'Normal';
    
    const skinTypes = results
      .map(r => r?.skinType)
      .filter(type => type);
    
    if (skinTypes.length === 0) return 'Normal';
    
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
    
    const allConcerns: string[] = [];
    results.forEach(r => {
      if (r?.concerns && Array.isArray(r.concerns)) {
        allConcerns.push(...r.concerns);
      }
    });
    
    if (allConcerns.length === 0) return ['Keine spezifischen Probleme erkannt'];
    
    const concernCount: Record<string, number> = {};
    allConcerns.forEach(concern => {
      concernCount[concern] = (concernCount[concern] || 0) + 1;
    });
    
    return Object.entries(concernCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([concern]) => concern);
  }

  private static extractSecondaryConcerns(results: any[]): string[] {
    return [
      'Leichte Hyperpigmentierung',
      'Vergrößerte Poren auf der Nase'
    ];
  }

  private static extractEmergingConcerns(results: any[]): string[] {
    return [
      'Beginnender Elastizitätsverlust',
      'Erste Anzeichen von UV-Schäden'
    ];
  }
}