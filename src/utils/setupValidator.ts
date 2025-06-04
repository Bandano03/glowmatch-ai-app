// src/utils/setupValidator.ts
import { ENV } from '../config/environment';

export const validateSetup = () => {
  console.log('🔍 Setup-Validierung läuft...\n');
  
  const checks = {
    'OpenAI API Key': !!ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.startsWith('sk-'),
    'Environment': ENV.APP_ENV === 'development' || ENV.APP_ENV === 'production',
    'Timeout konfiguriert': ENV.API_TIMEOUT > 0,
    'Supabase (optional)': !ENV.SUPABASE_URL || ENV.SUPABASE_URL.includes('supabase.co'),
  };
  
  let allPassed = true;
  
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
    if (!passed && !check.includes('optional')) {
      allPassed = false;
    }
  });
  
  if (allPassed) {
    console.log('\n🎉 Setup erfolgreich! Sie können mit Teil 2 fortfahren.');
  } else {
    console.log('\n⚠️ Bitte beheben Sie die Fehler bevor Sie fortfahren.');
  }
  
  return allPassed;
};