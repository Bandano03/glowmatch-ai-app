// In src/services/analysisService.ts

// Ersetzen Sie die getCacheKey Funktion:
private static getCacheKey(imageBase64: string, type: AnalysisType): string {
  // Erstelle einen sicheren Hash aus dem Bild für den Cache-Key
  // Verwende nur alphanumerische Zeichen
  const imageHash = imageBase64
    .substring(0, 20)
    .replace(/[^a-zA-Z0-9]/g, ''); // Entferne alle nicht-alphanumerischen Zeichen
  
  const timestamp = Date.now().toString();
  return `analysis_${type}_${imageHash}_${timestamp}`;
}

// Alternative: Keine Cache-Verwendung (einfachste Lösung)
// Kommentieren Sie einfach die Cache-Aufrufe aus:

static async analyze(
  imageBase64: string, 
  type: AnalysisType,
  useCache: boolean = true
): Promise<AnalysisResponse> {
  const timestamp = new Date();

  try {
    // Cache vorübergehend deaktiviert wegen SecureStore Issues
    // if (useCache) {
    //   const cached = await this.getCachedAnalysis(imageBase64, type);
    //   if (cached) {
    //     return {
    //       success: true,
    //       data: cached,
    //       timestamp
    //     };
    //   }
    // }

    // Prüfe ob wir online sind und API Key haben
    const isOnline = await this.checkOnlineStatus();
    const hasAPIKey = !!ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY !== 'sk-proj-IhrOpenAIKeyHier';

    let result: SkinAnalysisResult | HairAnalysisResult;

    if (isOnline && hasAPIKey) {
      // Echte API-Analyse
      console.log('🔄 Führe echte KI-Analyse durch...');
      result = type === 'skin' 
        ? await OpenAIService.analyzeSkin(imageBase64)
        : await OpenAIService.analyzeHair(imageBase64);
    } else {
      // Fallback auf Demo-Daten
      console.log('📱 Verwende Demo-Daten (Offline-Modus)');
      result = type === 'skin'
        ? FallbackAnalysisService.getSkinAnalysisDemoWithVariation()
        : FallbackAnalysisService.getHairAnalysisDemoWithVariation();
    }

    // Cache vorübergehend deaktiviert
    // if (useCache) {
    //   await this.cacheAnalysis(imageBase64, type, result);
    // }

    return {
      success: true,
      data: result,
      timestamp
    };

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Bei Fehler: Fallback auf Demo-Daten
    const fallbackResult = type === 'skin'
      ? FallbackAnalysisService.getSkinAnalysisDemo()
      : FallbackAnalysisService.getHairAnalysisDemo();

    return {
      success: true,
      data: fallbackResult,
      error: {
        code: 'ANALYSIS_FALLBACK',
        message: 'Analyse nicht verfügbar, Demo-Daten werden angezeigt',
        details: error.message
      },
      timestamp
    };
  }
}