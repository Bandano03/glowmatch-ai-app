// src/services/fallbackAnalysisService.ts

import { SkinAnalysisResult, HairAnalysisResult } from '../types/analysis.types';

export class FallbackAnalysisService {
  // Demo-Daten für Hautanalyse
  static getSkinAnalysisDemo(): SkinAnalysisResult {
    return {
      skinType: 'Mischhaut',
      hydration: 72,
      oiliness: 45,
      sensitivity: 25,
      texture: 'Feinporig',
      concerns: [
        'Leichte Trockenheit an den Wangen',
        'Glanz in der T-Zone',
        'Vereinzelte Unreinheiten',
        'Erste feine Linien'
      ],
      ageEstimate: '25-30',
      recommendations: {
        morning: [
          'Sanfte Reinigung mit mildem Gel-Cleanser',
          'Ausgleichendes Toner ohne Alkohol',
          'Leichtes Hyaluronsäure-Serum',
          'Mattierende Feuchtigkeitscreme für T-Zone',
          'Mineralischer Sonnenschutz SPF 30+'
        ],
        evening: [
          'Doppelte Reinigung (Öl + Schaum)',
          'BHA Toner (2-3x pro Woche)',
          'Niacinamid-Serum 10%',
          'Retinol 0.3% (2x pro Woche anfangen)',
          'Reichhaltige Nachtcreme für trockene Bereiche'
        ],
        weekly: [
          'Tonerde-Maske für T-Zone (1x)',
          'Feuchtigkeitsmaske für Wangen (2x)',
          'Sanftes AHA-Peeling (1x)',
          'Gesichtsmassage mit Jade-Roller'
        ]
      },
      ingredients: {
        recommended: [
          'Hyaluronsäure',
          'Niacinamid',
          'Salicylsäure (BHA)',
          'Ceramide',
          'Peptide',
          'Grüner Tee Extrakt',
          'Zink'
        ],
        avoid: [
          'Alkohol denat.',
          'Künstliche Duftstoffe',
          'Mineralöl',
          'Aggressive Sulfate',
          'Ätherische Öle in hoher Konzentration'
        ]
      },
      confidence: 85
    };
  }

  // Demo-Daten für Haaranalyse
  static getHairAnalysisDemo(): HairAnalysisResult {
    return {
      hairType: '2B',
      structure: 'Wellig',
      thickness: 'Normal',
      porosity: 'Normal',
      damage: 35,
      scalp: 'Normal',
      concerns: [
        'Leichter Spliss in den Spitzen',
        'Frizz bei Feuchtigkeit',
        'Ungleichmäßige Wellenstruktur',
        'Trockenheit in den Längen'
      ],
      color: 'Naturbraun mit leichten Highlights',
      recommendations: {
        products: [
          'Sulfatfreies Feuchtigkeits-Shampoo',
          'Protein-Balance Conditioner',
          'Leave-in Conditioner mit Arganöl',
          'Curl-Defining Cream',
          'Anti-Frizz Serum für die Spitzen'
        ],
        treatments: [
          'Wöchentliche Tiefenpflege-Maske',
          'Monatliches Protein-Treatment',
          'Olaplex-Behandlung alle 6 Wochen',
          'Regelmäßiger Spitzenschnitt (alle 8-10 Wochen)'
        ],
        styling: [
          'Plopping-Methode für definierte Wellen',
          'Diffusor bei niedriger Temperatur',
          'Satin-Kissenbezug verwenden',
          'Protective Styles über Nacht',
          'Nicht täglich waschen (2-3x pro Woche)'
        ]
      },
      ingredients: {
        recommended: [
          'Arganöl',
          'Sheabutter',
          'Glycerin',
          'Hydrolysiertes Keratin',
          'Kokosöl (in Maßen)',
          'Aloe Vera',
          'Panthenol'
        ],
        avoid: [
          'Sulfate (SLS/SLES)',
          'Austrocknende Alkohole',
          'Silikone (bei CG-Methode)',
          'Mineralöl',
          'Parabene'
        ]
      },
      confidence: 82
    };
  }

  // Zufällige Variation für realistischere Demo-Daten
  static addRandomVariation(value: number, range: number = 10): number {
    const variation = (Math.random() - 0.5) * range;
    return Math.round(Math.max(0, Math.min(100, value + variation)));
  }

  // Erweiterte Demo-Daten mit Variation
  static getSkinAnalysisDemoWithVariation(): SkinAnalysisResult {
    const base = this.getSkinAnalysisDemo();
    return {
      ...base,
      hydration: this.addRandomVariation(base.hydration),
      oiliness: this.addRandomVariation(base.oiliness),
      sensitivity: this.addRandomVariation(base.sensitivity),
      confidence: this.addRandomVariation(base.confidence, 5)
    };
  }

  static getHairAnalysisDemoWithVariation(): HairAnalysisResult {
    const base = this.getHairAnalysisDemo();
    return {
      ...base,
      damage: this.addRandomVariation(base.damage),
      confidence: this.addRandomVariation(base.confidence, 5)
    };
  }
}