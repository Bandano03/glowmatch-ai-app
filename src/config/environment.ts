// src/config/environment.ts

// Type-sichere Environment Variables für React Native
interface EnvironmentVariables {
  OPENAI_API_KEY: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  APP_ENV: 'development' | 'production';
  API_TIMEOUT: number;
}

// React Native Environment Variables lesen
const validateEnv = (): EnvironmentVariables => {
  // In React Native werden env variables über Constants.expoConfig gelesen
  let OPENAI_API_KEY = '';
  let SUPABASE_URL = '';
  let SUPABASE_ANON_KEY = '';
  let APP_ENV = 'development';
  let API_TIMEOUT = 30000;

  try {
    // Versuche Expo Constants zu verwenden
    const Constants = require('expo-constants').default;
    const extra = Constants.expoConfig?.extra || {};
    
    OPENAI_API_KEY = extra.OPENAI_API_KEY || '';
    SUPABASE_URL = extra.SUPABASE_URL || '';
    SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || '';
    APP_ENV = extra.APP_ENV || 'development';
    API_TIMEOUT = parseInt(extra.API_TIMEOUT || '30000');
  } catch (error) {
    console.warn('⚠️ Expo Constants nicht verfügbar, verwende Fallback-Werte');
    
    // Fallback für Development
    OPENAI_API_KEY = 'sk-proj-IhrOpenAIKeyHier'; // Ersetzen Sie durch Ihren echten Key
    SUPABASE_URL = 'https://gtvajpsjnymcjzesnzth.supabase.co';
    SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmFqcHNqbnltY2p6ZXNuenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NTQxNzEsImV4cCI6MjA2NDQzMDE3MX0.v1NANA5U1_7_dgdKSDgu9NedQSYnZWnTWc0sRVi5trE';
    APP_ENV = 'development';
    API_TIMEOUT = 30000;
  }

  const env = {
    OPENAI_API_KEY,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    APP_ENV: APP_ENV as 'development' | 'production',
    API_TIMEOUT,
  };

  // Kritische Validierung - nur warnen, nicht crashen
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'sk-proj-IhrOpenAIKeyHier') {
    console.warn('⚠️ OPENAI_API_KEY ist nicht gesetzt oder ist noch der Platzhalter!');
    console.warn('⚠️ Die App wird im Demo-Modus laufen');
  }

  if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.startsWith('sk-')) {
    console.warn('⚠️ OPENAI_API_KEY scheint ungültig zu sein (sollte mit sk- beginnen)');
  }

  return env as EnvironmentVariables;
};

// Export für die App
export const ENV = validateEnv();

// Helper für sichere API Key Verwendung
export const getOpenAIHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`,
});

// Utility Funktion um zu prüfen ob API Key verfügbar ist
export const hasValidAPIKey = (): boolean => {
  return !!(ENV.OPENAI_API_KEY && 
           ENV.OPENAI_API_KEY !== 'sk-proj-IhrOpenAIKeyHier' && 
           ENV.OPENAI_API_KEY.startsWith('sk-'));
};