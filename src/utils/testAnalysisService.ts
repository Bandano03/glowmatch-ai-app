// src/utils/testAnalysisService.ts

import { AnalysisService } from '../services/analysisService';

export async function testAnalysisServices() {
  console.log('🧪 Teste Analysis Services...\n');

  // 1. API Verbindung testen
  console.log('1️⃣ Teste OpenAI API Verbindung...');
  const apiConnected = await AnalysisService.testConnection();
  console.log(apiConnected ? '✅ API verbunden' : '❌ API nicht erreichbar');

  // 2. Demo-Analyse testen (mit Fake Base64)
  console.log('\n2️⃣ Teste Demo-Analyse...');
  const fakeImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  try {
    const skinResult = await AnalysisService.analyze(fakeImage, 'skin', false);
    console.log('✅ Hautanalyse erfolgreich:', {
      skinType: skinResult.data?.skinType,
      confidence: skinResult.data?.confidence
    });

    const hairResult = await AnalysisService.analyze(fakeImage, 'hair', false);
    console.log('✅ Haaranalyse erfolgreich:', {
      hairType: hairResult.data?.hairType,
      confidence: hairResult.data?.confidence
    });
  } catch (error) {
    console.error('❌ Analyse fehlgeschlagen:', error);
  }

  console.log('\n✅ Service-Tests abgeschlossen!');
}

// In App.tsx aufrufen zum Testen:
// import { testAnalysisServices } from './src/utils/testAnalysisService';
// useEffect(() => { testAnalysisServices(); }, []);