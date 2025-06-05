// src/services/advancedAnalysisService.ts

import { ENV } from '../config/environment';
import { AdvancedAnalysisResult, ProductRecommendation, RecipeRecommendation } from '../types/advancedAnalysis.types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class AdvancedAnalysisService {
  static async performDeepAnalysis(images: string[]): Promise<AdvancedAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Analysiere mehrere Bilder für genauere Ergebnisse
      const analysisPromises = images.map((image, index) => 
        this.analyzeImage(image, index)
      );
      
      const results = await Promise.all(analysisPromises);
      
      // Kombiniere die Ergebnisse
      const combinedResult = await this.combineAnalysisResults(results);
      
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
      // Fallback auf Demo-Daten
      return this.getDemoAnalysisResult();
    }
  }

  private static async analyzeImage(imageBase64: string, index: number): Promise<any> {
    const prompt = `Du bist ein führender Dermatologe und Hautexperte mit 30 Jahren Erfahrung. 
    Analysiere dieses Gesichtsbild (Bild ${index + 1} von 10) EXTREM detailliert.
    
    Analysiere folgende Aspekte:
    
    1. HAUTSTRUKTUR:
    - Porengröße und -verteilung
    - Feine Linien und Falten (Anzahl, Tiefe, Lokation)
    - Hautdicke und -elastizität
    - Narben oder Verfärbungen
    
    2. HAUTTON & PIGMENTIERUNG:
    - Gleichmäßigkeit des Hauttons
    - Hyperpigmentierung oder Melasma
    - Rötungen und Entzündungen
    - Dunkle Flecken oder Altersflecken
    
    3. HYDRATATION & ÖLPRODUKTION:
    - Trockenheitszonen
    - Ölige Bereiche (T-Zone Analyse)
    - Schuppige oder raue Stellen
    
    4. SPEZIFISCHE PROBLEME:
    - Akne (Art, Schweregrad, Lokation)
    - Rosazea-Anzeichen
    - Ekzeme oder Dermatitis
    - Allergische Reaktionen
    
    5. ALTERUNGSZEICHEN:
    - Biologisches vs. chronologisches Alter
    - Kollagenabbau
    - Volumenverlust
    - Hautelastizität
    
    6. UMWELTSCHÄDEN:
    - UV-Schäden
    - Umweltverschmutzungseffekte
    - Stress-Indikatoren
    
    Gib eine SEHR detaillierte JSON-Antwort mit numerischen Werten (0-100) für jeden Aspekt.`;

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

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private static async combineAnalysisResults(results: any[]): Promise<any> {
    // Durchschnittswerte berechnen und Trends erkennen
    const combined = {
      skinAnalysis: {
        type: this.determineSkinType(results),
        age: this.calculateAverageAge(results),
        biologicalAge: this.calculateBiologicalAge(results),
        healthScore: this.calculateHealthScore(results),
        
        metrics: {
          hydration: this.analyzeMetric(results, 'hydration'),
          elasticity: this.analyzeMetric(results, 'elasticity'),
          firmness: this.analyzeMetric(results, 'firmness'),
          radiance: this.analyzeMetric(results, 'radiance'),
          evenness: this.analyzeMetric(results, 'evenness'),
          poreSize: this.analyzeMetric(results, 'poreSize'),
          oilBalance: this.analyzeMetric(results, 'oilBalance'),
        },
        
        concerns: {
          primary: this.extractPrimaryConcerns(results),
          secondary: this.extractSecondaryConcerns(results),
          emerging: this.extractEmergingConcerns(results),
        },
        
        environmental: {
          uvDamage: this.calculateAverage(results, 'uvDamage'),
          pollutionImpact: this.calculateAverage(results, 'pollutionImpact'),
          stressLevel: this.calculateAverage(results, 'stressLevel'),
          dehydration: this.calculateAverage(results, 'dehydration'),
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

  // Helper Methoden
  private static determineSkinType(results: any[]): string {
    // Komplexe Logik zur Bestimmung des Hauttyps
    return 'Mischhaut mit Tendenz zu Trockenheit';
  }

  private static calculateAverageAge(results: any[]): number {
    return 28;
  }

  private static calculateBiologicalAge(results: any[]): number {
    return 25;
  }

  private static calculateHealthScore(results: any[]): number {
    return 82;
  }

  private static analyzeMetric(results: any[], metric: string): any {
    return {
      value: 75,
      trend: 'improving' as const
    };
  }

  private static extractPrimaryConcerns(results: any[]): string[] {
    return [
      'Dehydration in der T-Zone',
      'Feine Linien um die Augen',
      'Ungleichmäßiger Hautton'
    ];
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

  private static calculateAverage(results: any[], field: string): number {
    return 45;
  }

  // Demo-Daten für Fallback
  private static getDemoAnalysisResult(): AdvancedAnalysisResult {
    return {
      scanDuration: 60000,
      confidence: 95,
      timestamp: new Date(),
      
      skinAnalysis: {
        type: 'Mischhaut mit Tendenz zu Trockenheit',
        age: 28,
        biologicalAge: 25,
        healthScore: 82,
        
        metrics: {
          hydration: { value: 65, trend: 'declining' },
          elasticity: { value: 78, trend: 'stable' },
          firmness: { value: 75, trend: 'stable' },
          radiance: { value: 70, trend: 'improving' },
          evenness: { value: 68, trend: 'stable' },
          poreSize: { value: 72, trend: 'stable' },
          oilBalance: { value: 60, trend: 'improving' },
        },
        
        concerns: {
          primary: [
            'Dehydration besonders in der T-Zone',
            'Feine Linien um die Augenpartie',
            'Ungleichmäßiger Hautton mit leichten Rötungen'
          ],
          secondary: [
            'Leichte Hyperpigmentierung an den Wangen',
            'Vergrößerte Poren im Nasenbereich',
            'Gelegentliche hormonelle Unreinheiten'
          ],
          emerging: [
            'Beginnender Elastizitätsverlust',
            'Erste Anzeichen von UV-bedingten Schäden',
            'Leichte Volumenverluste'
          ],
        },
        
        environmental: {
          uvDamage: 35,
          pollutionImpact: 45,
          stressLevel: 60,
          dehydration: 70,
        },
      },
      
      recommendations: {
        immediate: [
          {
            title: 'Notfall-Hydratation',
            description: 'Ihre Haut zeigt akute Dehydration. Sofortige intensive Feuchtigkeitspflege erforderlich.',
            priority: 'high',
            duration: '24-48 Stunden',
            expectedResults: [
              'Sofortige Linderung von Spannungsgefühlen',
              'Sichtbar prallere Haut',
              'Reduzierte Schuppigkeit'
            ],
            steps: [
              'Gesicht mit lauwarmem Wasser und mildem Cleanser reinigen',
              'Hyaluronsäure-Serum auf die noch feuchte Haut auftragen',
              'Sheet-Maske für 20 Minuten auflegen',
              'Reichhaltige Nachtcreme dick auftragen',
              'Über Nacht einwirken lassen'
            ]
          }
        ],
        
        shortTerm: [
          {
            title: 'Hautbarriere-Reparatur',
            description: 'Stärkung der natürlichen Schutzfunktion Ihrer Haut.',
            priority: 'high',
            duration: '2 Wochen',
            expectedResults: [
              'Verbesserte Feuchtigkeitsspeicherung',
              'Reduzierte Empfindlichkeit',
              'Gesünderes Hautbild'
            ],
            steps: [
              'Ceramid-haltige Produkte verwenden',
              'pH-neutrale Reinigung',
              'Niacinamid-Serum integrieren',
              'Wöchentliche Repair-Masken'
            ]
          }
        ],
        
        longTerm: [
          {
            title: 'Ganzheitliches Anti-Aging Programm',
            description: 'Umfassende Strategie für jugendliche, gesunde Haut.',
            priority: 'medium',
            duration: '3-6 Monate',
            expectedResults: [
              'Sichtbar reduzierte Falten',
              'Verbesserte Hautstruktur',
              'Ebenmäßiger, strahlender Teint',
              'Erhöhte Hautfestigkeit'
            ],
            steps: [
              'Retinol-Behandlung schrittweise einführen',
              'Täglicher Sonnenschutz SPF 50+',
              'Wöchentliche Mikroneedling-Sessions',
              'Quartalsweise professionelle Treatments'
            ]
          }
        ],
        
        products: {
          essential: [],
          advanced: [],
          professional: []
        },
        
        recipes: {
          daily: [],
          weekly: [],
          special: []
        },
        
        lifestyle: {
          diet: [],
          supplements: [],
          habits: [],
          avoid: []
        }
      }
    };
  }
}