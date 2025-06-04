// src/types/analysis.types.ts

export interface SkinAnalysisResult {
  skinType: 'Normal' | 'Trocken' | 'Fettig' | 'Mischhaut' | 'Sensibel';
  hydration: number; // 0-100
  oiliness: number; // 0-100
  sensitivity: number; // 0-100
  texture: 'Glatt' | 'Uneben' | 'Rau' | 'Feinporig' | 'Großporig';
  concerns: string[];
  ageEstimate: string;
  recommendations: {
    morning: string[];
    evening: string[];
    weekly: string[];
  };
  ingredients: {
    recommended: string[];
    avoid: string[];
  };
  confidence: number; // 0-100
}

export interface HairAnalysisResult {
  hairType: '1A' | '1B' | '1C' | '2A' | '2B' | '2C' | '3A' | '3B' | '3C' | '4A' | '4B' | '4C';
  structure: 'Glatt' | 'Wellig' | 'Lockig' | 'Kraus';
  thickness: 'Dünn' | 'Normal' | 'Dick';
  porosity: 'Niedrig' | 'Normal' | 'Hoch';
  damage: number; // 0-100
  scalp: 'Normal' | 'Trocken' | 'Fettig' | 'Sensibel';
  concerns: string[];
  color: string;
  recommendations: {
    products: string[];
    treatments: string[];
    styling: string[];
  };
  ingredients: {
    recommended: string[];
    avoid: string[];
  };
  confidence: number; // 0-100
}

export interface AnalysisError {
  code: string;
  message: string;
  details?: any;
}

export type AnalysisType = 'skin' | 'hair';

export interface AnalysisRequest {
  type: AnalysisType;
  imageBase64: string;
  userId?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: SkinAnalysisResult | HairAnalysisResult;
  error?: AnalysisError;
  timestamp: Date;
}