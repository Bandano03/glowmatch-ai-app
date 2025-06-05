// src/services/fallbackAnalysisService.ts

import { SkinAnalysisResult, HairAnalysisResult } from '../types/analysis.types';

export class FallbackAnalysisService {
  
  // VERBESSERTE HAUTANALYSE DEMO-DATEN
  static getSkinAnalysisDemo(): SkinAnalysisResult {
    const variations = [
      {
        skinType: 'Mischhaut' as const,
        hydration: 72,
        oiliness: 45,
        sensitivity: 25,
        texture: 'Feinporig' as const,
        concerns: [
          'Leichte Trockenheit an den Wangen',
          'Glanz in der T-Zone',
          'Vereinzelte Unreinheiten am Kinn',
          'Erste feine Linien um die Augen'
        ],
        ageEstimate: '25-30',
        confidence: 87
      },
      {
        skinType: 'Normal' as const,
        hydration: 85,
        oiliness: 25,
        sensitivity: 15,
        texture: 'Glatt' as const,
        concerns: [
          'Gelegentliche Trockenheit im Winter',
          'Leichte Rötungen nach dem Sport',
          'Wenige Mitesser auf der Nase'
        ],
        ageEstimate: '22-28',
        confidence: 91
      },
      {
        skinType: 'Trocken' as const,
        hydration: 45,
        oiliness: 15,
        sensitivity: 40,
        texture: 'Rau' as const,
        concerns: [
          'Starke Trockenheit besonders an Wangen',
          'Schuppige Bereiche an der Stirn',
          'Spannungsgefühl nach dem Waschen',
          'Feine Linien durch Dehydration'
        ],
        ageEstimate: '30-35',
        confidence: 89
      }
    ];

    const randomVariation = variations[Math.floor(Math.random() * variations.length)];

    return {
      ...randomVariation,
      recommendations: {
        morning: [
          'Sanfte Reinigung mit cremigem Cleanser',
          'Feuchtigkeitsspendendes Serum mit Hyaluronsäure',
          'Leichte Tagescreme für den Hauttyp',
          'Sonnenschutz SPF 30+ auftragen',
          'Bei trockenen Stellen: zusätzliche Feuchtigkeitscreme'
        ],
        evening: [
          'Make-up gründlich entfernen (doppelte Reinigung)',
          'Mildes Peeling 2x pro Woche',
          'Nährendes Gesichtsöl oder Serum',
          'Reichhaltige Nachtcreme auftragen',
          'Augencreme für die Augenpartie'
        ],
        weekly: [
          'Feuchtigkeitsmaske 2x pro Woche',
          'Sanftes Enzympeeling 1x pro Woche',
          'Gesichtsmassage mit Öl für bessere Durchblutung',
          'Dampfbad zur Porenöffnung vor der Reinigung'
        ]
      },
      ingredients: {
        recommended: [
          'Hyaluronsäure für intensive Feuchtigkeit',
          'Ceramide für die Hautbarriere',
          'Niacinamid gegen Unreinheiten',
          'Retinol für Anti-Aging (abends)',
          'Vitamin C für Schutz und Ausstrahlung',
          'Peptide für Hauterneuerung'
        ],
        avoid: [
          'Alkohol denat. (austrocknend)',
          'Starke Duftstoffe und ätherische Öle',
          'Aggressive Sulfate in Reinigern',
          'Hochkonzentrierte Säuren täglich'
        ]
      }
    };
  }

  // VERBESSERTE HAARANALYSE DEMO-DATEN
  static getHairAnalysisDemo(): HairAnalysisResult {
    const variations = [
      {
        hairType: '2B' as const,
        structure: 'Wellig' as const,
        thickness: 'Normal' as const,
        porosity: 'Normal' as const,
        damage: 35,
        scalp: 'Normal' as const,
        concerns: [
          'Leichter Spliss in den Spitzen',
          'Frizz bei hoher Luftfeuchtigkeit',
          'Ungleichmäßige Wellenstruktur',
          'Trockenheit in den Längen'
        ],
        color: 'Naturbraun mit leichten Highlights',
        confidence: 82
      },
      {
        hairType: '1B' as const,
        structure: 'Glatt' as const,
        thickness: 'Dick' as const,
        porosity: 'Niedrig' as const,
        damage: 20,
        scalp: 'Normal' as const,
        concerns: [
          'Haar wirkt manchmal platt und leblos',
          'Schwer zu stylen - hält keine Locken',
          'Wird schnell fettig am Ansatz'
        ],
        color: 'Naturblond',
        confidence: 88
      },
      {
        hairType: '3A' as const,
        structure: 'Lockig' as const,
        thickness: 'Normal' as const,
        porosity: 'Hoch' as const,
        damage: 50,
        scalp: 'Trocken' as const,
        concerns: [
          'Starker Frizz und unkontrollierbare Locken',
          'Sehr trockene Spitzen',
          'Locken fallen schnell aus',
          'Schwer kämmbar wenn trocken'
        ],
        color: 'Dunkelbraun mit Balayage',
        confidence: 85
      }
    ];

    const randomVariation = variations[Math.floor(Math.random() * variations.length)];

    return {
      ...randomVariation,
      recommendations: {
        products: [
          'Sulfatfreies Feuchtigkeits-Shampoo',
          'Intensive Protein-Conditioner',
          'Leave-in Conditioner mit Arganöl',
          'Curl-Defining Cream für Struktur',
          'Anti-Frizz Serum für die Spitzen'
        ],
        treatments: [
          'Wöchentliche Tiefenpflege-Haarmaske',
          'Monatliches Protein-Treatment für Stärkung',
          'Olaplex-Behandlung alle 6-8 Wochen',
          'Regelmäßiger Spitzenschnitt (alle 8-10 Wochen)',
          'Kopfhautmassage mit natürlichen Ölen'
        ],
        styling: [
          'Plopping-Methode für definierte Wellen',
          'Diffusor bei niedriger Temperatur verwenden',
          'Satin-Kissenbezug gegen Reibung',
          'Protective Styles über Nacht',
          'Nicht täglich waschen (2-3x pro Woche optimal)',
          'Mikroplop-Technik für weniger Frizz'
        ]
      },
      ingredients: {
        recommended: [
          'Arganöl für Geschmeidigkeit',
          'Sheabutter für intensive Pflege',
          'Glycerin für Feuchtigkeit',
          'Hydrolysiertes Keratin für Reparatur',
          'Kokosöl (sparsam verwenden)',
          'Aloe Vera für Beruhigung',
          'Panthenol (Pro-Vitamin B5)'
        ],
        avoid: [
          'Sulfate (SLS/SLES) - zu aggressive Reinigung',
          'Austrocknende Alkohole (Denat.)',
          'Schwere Silikone (bei CG-Methode)',
          'Mineralöl - kann Aufbau verursachen',
          'Parabene (optional vermeiden)'
        ]
      }
    };
  }

  // ZUFÄLLIGE VARIATIONEN FÜR REALISTISCHE ERGEBNISSE
  static addRandomVariation(value: number, range: number = 10): number {
    const variation = (Math.random() - 0.5) * range;
    return Math.round(Math.max(0, Math.min(100, value + variation)));
  }

  // HAUTANALYSE MIT ZUFÄLLIGEN VARIATIONEN
  static getSkinAnalysisDemoWithVariation(): SkinAnalysisResult {
    const base = this.getSkinAnalysisDemo();
    return {
      ...base,
      hydration: this.addRandomVariation(base.hydration, 8),
      oiliness: this.addRandomVariation(base.oiliness, 10),
      sensitivity: this.addRandomVariation(base.sensitivity, 5),
      confidence: this.addRandomVariation(base.confidence, 3)
    };
  }

  // HAARANALYSE MIT ZUFÄLLIGEN VARIATIONEN
  static getHairAnalysisDemoWithVariation(): HairAnalysisResult {
    const base = this.getHairAnalysisDemo();
    return {
      ...base,
      damage: this.addRandomVariation(base.damage, 8),
      confidence: this.addRandomVariation(base.confidence, 4)
    };
  }

  // SAISONALE ANPASSUNGEN
  static getSeasonalAdjustments() {
    const month = new Date().getMonth();
    const season = month >= 2 && month <= 4 ? 'spring' :
                  month >= 5 && month <= 7 ? 'summer' :
                  month >= 8 && month <= 10 ? 'autumn' : 'winter';

    const adjustments = {
      spring: {
        skinTips: ['Leichtere Feuchtigkeitscreme verwenden', 'Allergien beachten'],
        hairTips: ['Mehr Feuchtigkeit wegen Pollenbelastung']
      },
      summer: {
        skinTips: ['Höherer Sonnenschutz SPF 50+', 'Öl-freie Produkte'],
        hairTips: ['UV-Schutz für das Haar', 'Salzwasser gut ausspülen']
      },
      autumn: {
        skinTips: ['Reichhaltigere Pflege beginnen', 'Sanfte Peelings'],
        hairTips: ['Gegen trockene Heizungsluft schützen']
      },
      winter: {
        skinTips: ['Extra reichhaltige Pflege', 'Raumluft befeuchten'],
        hairTips: ['Intensive Haarkuren', 'Mützen aus natürlichen Materialien']
      }
    };

    return adjustments[season];
  }
}