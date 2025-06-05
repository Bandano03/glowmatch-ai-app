// src/services/personalizationService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinAnalysisResult, HairAnalysisResult } from '../types/analysis.types';

interface UserProfile {
  age: number;
  skinConcerns: string[];
  lifestyle: 'busy' | 'moderate' | 'extensive';
  budget: 'low' | 'medium' | 'high';
  preferences: {
    naturalProducts: boolean;
    fragrance: boolean;
    crueltyFree: boolean;
  };
}

interface PersonalizedRecommendation {
  type: 'morning' | 'evening' | 'weekly';
  steps: Array<{
    step: number;
    action: string;
    product: string;
    reason: string;
    duration: string;
  }>;
  tips: string[];
  warnings: string[];
}

export class PersonalizationService {
  
  // BENUTZER-PROFIL LADEN
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  // BENUTZER-PROFIL SPEICHERN
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // PERSONALISIERTE HAUTPFLEGE-ROUTINE ERSTELLEN
  static async createPersonalizedSkinRoutine(
    analysis: SkinAnalysisResult,
    userProfile?: UserProfile
  ): Promise<PersonalizedRecommendation[]> {
    
    const profile = userProfile || await this.getUserProfile();
    const season = this.getCurrentSeason();
    
    const morningRoutine = this.buildMorningRoutine(analysis, profile, season);
    const eveningRoutine = this.buildEveningRoutine(analysis, profile, season);
    const weeklyTreatments = this.buildWeeklyTreatments(analysis, profile);

    return [morningRoutine, eveningRoutine, weeklyTreatments];
  }

  // MORGENROUTINE ERSTELLEN
  private static buildMorningRoutine(
    analysis: SkinAnalysisResult,
    profile: UserProfile | null,
    season: string
  ): PersonalizedRecommendation {
    
    const isQuickRoutine = profile?.lifestyle === 'busy';
    const steps = [];

    // Schritt 1: Reinigung
    steps.push({
      step: 1,
      action: 'Gesicht reinigen',
      product: analysis.skinType === 'Trocken' ? 
        'Cremiger Cleanser' : 
        analysis.skinType === 'Fettig' ? 
        'Gel-Cleanser' : 
        'Milder Schaumreiniger',
      reason: `Optimale Reinigung für ${analysis.skinType} Haut`,
      duration: '1-2 Minuten'
    });

    // Schritt 2: Toner (wenn nicht eilig)
    if (!isQuickRoutine) {
      steps.push({
        step: 2,
        action: 'Toner auftragen',
        product: analysis.sensitivity > 50 ? 
          'Alkoholfreier Toner' : 
          'Balancierender Toner',
        reason: 'Bereitet die Haut auf nachfolgende Pflege vor',
        duration: '30 Sekunden'
      });
    }

    // Schritt 3: Serum
    const serumType = analysis.hydration < 50 ? 
      'Hyaluronsäure-Serum' :
      analysis.concerns.some(c => c.includes('Unreinheiten')) ?
      'Niacinamid-Serum' :
      'Vitamin C Serum';

    steps.push({
      step: isQuickRoutine ? 2 : 3,
      action: 'Serum auftragen',
      product: serumType,
      reason: this.getSerumReason(serumType),
      duration: '1 Minute'
    });

    // Schritt 4: Feuchtigkeitscreme
    steps.push({
      step: isQuickRoutine ? 3 : 4,
      action: 'Feuchtigkeitscreme',
      product: this.getMoisturizerForSkinType(analysis.skinType, season),
      reason: 'Spendet Feuchtigkeit und schützt die Hautbarriere',
      duration: '1 Minute'
    });

    // Schritt 5: Sonnenschutz
    steps.push({
      step: isQuickRoutine ? 4 : 5,
      action: 'Sonnenschutz auftragen',
      product: analysis.sensitivity > 50 ? 
        'Mineralischer Sonnenschutz SPF 30+' : 
        'Breitband-Sonnenschutz SPF 30+',
      reason: 'Schützt vor UV-Schäden und vorzeitiger Hautalterung',
      duration: '1 Minute'
    });

    return {
      type: 'morning',
      steps,
      tips: [
        'Warten Sie 2-3 Minuten zwischen den Schritten',
        'Tragen Sie Produkte von dünnflüssig zu dickflüssig auf',
        'Bei Eile: Kombinieren Sie Feuchtigkeitscreme mit SPF'
      ],
      warnings: analysis.sensitivity > 50 ? [
        'Bei Irritationen Routine pausieren',
        'Neue Produkte einzeln einführen'
      ] : []
    };
  }

  // ABENDROUTINE ERSTELLEN
  private static buildEveningRoutine(
    analysis: SkinAnalysisResult,
    profile: UserProfile | null,
    season: string
  ): PersonalizedRecommendation {
    
    const steps = [];
    const useRetinol = profile?.age && profile.age > 25;

    // Doppelte Reinigung
    steps.push({
      step: 1,
      action: 'Make-up/Sonnenschutz entfernen',
      product: 'Reinigungsöl oder Mizellenwasser',
      reason: 'Entfernt wasserfeste Produkte gründlich',
      duration: '2 Minuten'
    });

    steps.push({
      step: 2,
      action: 'Zweite Reinigung',
      product: this.getCleanserForSkinType(analysis.skinType),
      reason: 'Entfernt Reste und bereitet Haut auf Pflege vor',
      duration: '1-2 Minuten'
    });

    // Treatment (3x pro Woche)
    if (useRetinol) {
      steps.push({
        step: 3,
        action: 'Treatment (Mo/Mi/Fr)',
        product: analysis.sensitivity > 50 ? 
          'Retinol 0.25%' : 
          'Retinol 0.5%',
        reason: 'Fördert Zellerneuerung und reduziert Alterszeichen',
        duration: '30 Sekunden'
      });
    }

    // Serum
    const eveningSerum = analysis.hydration < 50 ? 
      'Hyaluronsäure-Serum' :
      'Nährende Peptide';

    steps.push({
      step: useRetinol ? 4 : 3,
      action: 'Pflegeserum',
      product: eveningSerum,
      reason: 'Intensive Pflege über Nacht',
      duration: '1 Minute'
    });

    // Nachtcreme
    steps.push({
      step: useRetinol ? 5 : 4,
      action: 'Nachtcreme',
      product: this.getNightMoisturizerForSkinType(analysis.skinType),
      reason: 'Regeneriert und nährt die Haut über Nacht',
      duration: '1-2 Minuten'
    });

    return {
      type: 'evening',
      steps,
      tips: [
        'Retinol langsam einführen (1x pro Woche beginnen)',
        'Bei Retinol-Verwendung morgens extra Sonnenschutz',
        'Augencreme nicht vergessen'
      ],
      warnings: [
        'Retinol nicht mit Vitamin C oder AHA/BHA mischen',
        'Bei Schwangerschaft: Retinol vermeiden'
      ]
    };
  }

  // WÖCHENTLICHE BEHANDLUNGEN
  private static buildWeeklyTreatments(
    analysis: SkinAnalysisResult,
    profile: UserProfile | null
  ): PersonalizedRecommendation {
    
    const steps = [];

    // Peeling
    steps.push({
      step: 1,
      action: 'Sanftes Peeling (1x pro Woche)',
      product: analysis.sensitivity > 50 ? 
        'Enzym-Peeling' : 
        'BHA-Peeling 2%',
      reason: 'Entfernt abgestorbene Hautzellen',
      duration: '5-10 Minuten'
    });

    // Maske für Hauttyp
    const maskType = analysis.skinType === 'Trocken' ? 
      'Feuchtigkeitsmaske' :
      analysis.skinType === 'Fettig' ? 
      'Tonerde-Maske' :
      'Ausgleichende Maske';

    steps.push({
      step: 2,
      action: 'Gesichtsmaske (2x pro Woche)',
      product: maskType,
      reason: `Spezielle Pflege für ${analysis.skinType} Haut`,
      duration: '15-20 Minuten'
    });

    // Gesichtsmassage
    steps.push({
      step: 3,
      action: 'Gesichtsmassage (2x pro Woche)',
      product: 'Gesichtsöl oder Jade-Roller',
      reason: 'Verbessert Durchblutung und entspannt',
      duration: '5-10 Minuten'
    });

    return {
      type: 'weekly',
      steps,
      tips: [
        'Peelings nicht an aufeinanderfolgenden Tagen',
        'Masken auf gereinigte Haut auftragen',
        'Massage am besten abends'
      ],
      warnings: [
        'Bei Hautirritationen Treatments pausieren',
        'Nicht alle Treatments am selben Tag'
      ]
    };
  }

  // HILFSFUNKTIONEN
  private static getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private static getSerumReason(serumType: string): string {
    switch (serumType) {
      case 'Hyaluronsäure-Serum':
        return 'Spendet intensive Feuchtigkeit';
      case 'Niacinamid-Serum':
        return 'Reduziert Unreinheiten und verkleinert Poren';
      case 'Vitamin C Serum':
        return 'Schützt vor freien Radikalen und hellt auf';
      default:
        return 'Verbessert den allgemeinen Hautzustand';
    }
  }

  private static getMoisturizerForSkinType(skinType: string, season: string): string {
    const isWinter = season === 'winter';
    
    switch (skinType) {
      case 'Trocken':
        return isWinter ? 'Reichhaltige Feuchtigkeitscreme' : 'Nährende Tagescreme';
      case 'Fettig':
        return 'Leichte, ölfreie Feuchtigkeitscreme';
      case 'Mischhaut':
        return 'Ausgleichende Feuchtigkeitscreme';
      case 'Sensibel':
        return 'Beruhigende, parfümfreie Creme';
      default:
        return 'Leichte Tagescreme';
    }
  }

  private static getCleanserForSkinType(skinType: string): string {
    switch (skinType) {
      case 'Trocken':
        return 'Cremiger Reiniger';
      case 'Fettig':
        return 'Schäumender Gel-Cleanser';
      case 'Mischhaut':
        return 'Milder Schaumreiniger';
      case 'Sensibel':
        return 'Sanfter, parfümfreier Cleanser';
      default:
        return 'Milder Reiniger';
    }
  }

  private static getNightMoisturizerForSkinType(skinType: string): string {
    switch (skinType) {
      case 'Trocken':
        return 'Reichhaltige Nachtcreme';
      case 'Fettig':
        return 'Leichte Nachtpflege';
      case 'Mischhaut':
        return 'Ausgleichende Nachtcreme';
      case 'Sensibel':
        return 'Beruhigende Nachtpflege';
      default:
        return 'Regenerierende Nachtcreme';
    }
  }
}