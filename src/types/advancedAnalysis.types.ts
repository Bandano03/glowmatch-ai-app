// src/types/advancedAnalysis.types.ts

export interface FaceScanPoint {
  x: number;
  y: number;
  confidence: number;
}

export interface FaceScanResult {
  landmarks: FaceScanPoint[];
  regions: {
    forehead: SkinRegionAnalysis;
    cheeks: SkinRegionAnalysis;
    nose: SkinRegionAnalysis;
    chin: SkinRegionAnalysis;
    undereyes: SkinRegionAnalysis;
  };
  overall: {
    symmetry: number;
    skinQuality: number;
    hydrationMap: number[][];
  };
}

export interface SkinRegionAnalysis {
  texture: number;
  pores: number;
  lines: number;
  pigmentation: number;
  redness: number;
  oiliness: number;
}

export interface AdvancedAnalysisResult {
  // Basis-Infos
  scanDuration: number;
  confidence: number;
  timestamp: Date;
  
  // Detaillierte Hautanalyse
  skinAnalysis: {
    type: string;
    age: number;
    biologicalAge: number;
    healthScore: number;
    
    // Detailmetriken
    metrics: {
      hydration: { value: number; trend: 'improving' | 'stable' | 'declining' };
      elasticity: { value: number; trend: 'improving' | 'stable' | 'declining' };
      firmness: { value: number; trend: 'improving' | 'stable' | 'declining' };
      radiance: { value: number; trend: 'improving' | 'stable' | 'declining' };
      evenness: { value: number; trend: 'improving' | 'stable' | 'declining' };
      poreSize: { value: number; trend: 'improving' | 'stable' | 'declining' };
      oilBalance: { value: number; trend: 'improving' | 'stable' | 'declining' };
    };
    
    // Problembereiche
    concerns: {
      primary: string[];
      secondary: string[];
      emerging: string[];
    };
    
    // Umweltfaktoren
    environmental: {
      uvDamage: number;
      pollutionImpact: number;
      stressLevel: number;
      dehydration: number;
    };
  };
  
  // Detaillierte Empfehlungen
  recommendations: {
    immediate: ActionPlan[];
    shortTerm: ActionPlan[]; // 1-2 Wochen
    longTerm: ActionPlan[]; // 1-3 Monate
    
    // Produkt-Empfehlungen
    products: {
      essential: ProductRecommendation[];
      advanced: ProductRecommendation[];
      professional: ProductRecommendation[];
    };
    
    // DIY Rezepte
    recipes: {
      daily: RecipeRecommendation[];
      weekly: RecipeRecommendation[];
      special: RecipeRecommendation[];
    };
    
    // Lifestyle
    lifestyle: {
      diet: string[];
      supplements: string[];
      habits: string[];
      avoid: string[];
    };
  };
  
  // Vergleich zu letzter Analyse
  comparison?: {
    lastAnalysisDate: Date;
    improvements: string[];
    deteriorations: string[];
    overallTrend: 'much_better' | 'better' | 'stable' | 'worse' | 'much_worse';
  };
}

export interface ActionPlan {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  duration: string;
  expectedResults: string[];
  steps: string[];
}

export interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  keyIngredients: string[];
  benefits: string[];
  usage: string;
  image?: string;
  matchScore: number; // 0-100
}

export interface RecipeRecommendation {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  ingredients: string[];
  benefits: string[];
  matchScore: number;
}