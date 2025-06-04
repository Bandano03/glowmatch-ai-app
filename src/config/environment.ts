// src/config/environment.ts

// Type-sichere Environment Variables
interface EnvironmentVariables {
  OPENAI_API_KEY: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  APP_ENV: 'development' | 'production';
  API_TIMEOUT: number;
}

// Validierung der Environment Variables
const validateEnv = (): EnvironmentVariables => {
  const env = {
    OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  };

  // Kritische Validierung
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ist nicht gesetzt! Bitte .env Datei prüfen.');
  }

  if (!env.OPENAI_API_KEY.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY scheint ungültig zu sein (sollte mit sk- beginnen)');
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