// ERSETZEN Sie den KOMPLETTEN Inhalt von: src/services/cameraService.ts

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'expo-camera';
import { Alert, Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CameraResult, ImageOptions, CameraPermissionStatus } from '../types/camera.types';

export class CameraService {
  // Standard-Optionen für Bilder - VERBESSERT
  private static readonly DEFAULT_OPTIONS: ImageOptions = {
    quality: 0.7,        // Reduziert von 0.8 auf 0.7
    maxWidth: 800,       // Reduziert von 1024 auf 800
    maxHeight: 800,      // Reduziert von 1024 auf 800
    format: 'jpeg'
  };

  // Maximale Dateigröße in Bytes (2MB statt 4MB für bessere Performance)
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  /**
   * Prüft und fordert alle notwendigen Berechtigungen an
   */
  static async requestPermissions(): Promise<CameraPermissionStatus> {
    const status: CameraPermissionStatus = {
      camera: false,
      mediaLibrary: false
    };

    try {
      // Kamera-Berechtigung
      if (Platform.OS !== 'web') {
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        status.camera = cameraPermission.status === 'granted';

        if (!status.camera) {
          this.showPermissionAlert('Kamera', 'Fotos für die Analyse aufzunehmen');
        }
      }

      // Galerie-Berechtigung
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status.mediaLibrary = mediaLibraryPermission.status === 'granted';

      if (!status.mediaLibrary) {
        this.showPermissionAlert('Galerie', 'Bilder für die Analyse auszuwählen');
      }

      return status;
    } catch (error) {
      console.error('Permission request error:', error);
      return status;
    }
  }

  /**
   * Zeigt einen Alert für fehlende Berechtigungen
   */
  private static showPermissionAlert(type: string, purpose: string): void {
    Alert.alert(
      `${type}-Berechtigung erforderlich`,
      `Bitte erlauben Sie den ${type}-Zugriff, um ${purpose}.`,
      [
        { 
          text: 'Abbrechen', 
          style: 'cancel' 
        },
        { 
          text: 'Einstellungen öffnen', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  }

  /**
   * Nimmt ein Foto mit der Kamera auf
   */
  static async takePhoto(options: ImageOptions = {}): Promise<CameraResult> {
    try {
      console.log('📸 Starte Foto-Aufnahme...');
      
      // Berechtigungen prüfen
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        return { 
          success: false, 
          error: 'Keine Kamera-Berechtigung' 
        };
      }

      // Optionen vorbereiten
      const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

      // Kamera öffnen
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait-Format für Gesichter
        quality: finalOptions.quality!,
        base64: false, // Wir konvertieren später für bessere Kontrolle
      });

      if (result.canceled) {
        return { 
          success: false, 
          error: 'Abgebrochen' 
        };
      }

      const asset = result.assets[0];
      
      // Bild optimieren und Base64 konvertieren
      return await this.processImage(asset.uri, finalOptions);

    } catch (error) {
      console.error('Take photo error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Fehler beim Fotografieren' 
      };
    }
  }

  /**
   * Wählt ein Bild aus der Galerie
   */
  static async pickImage(options: ImageOptions = {}): Promise<CameraResult> {
    try {
      console.log('🖼️ Starte Bildauswahl...');
      
      // Berechtigungen prüfen
      const permissions = await this.requestPermissions();
      if (!permissions.mediaLibrary) {
        return { 
          success: false, 
          error: 'Keine Galerie-Berechtigung' 
        };
      }

      // Optionen vorbereiten
      const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

      // Galerie öffnen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait-Format
        quality: finalOptions.quality!,
        base64: false,
      });

      if (result.canceled) {
        return { 
          success: false, 
          error: 'Abgebrochen' 
        };
      }

      const asset = result.assets[0];
      
      // Bild optimieren und Base64 konvertieren
      return await this.processImage(asset.uri, finalOptions);

    } catch (error) {
      console.error('Pick image error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Fehler bei der Bildauswahl' 
      };
    }
  }

  /**
   * Verarbeitet und optimiert ein Bild - STARK VERBESSERT
   */
  private static async processImage(
    uri: string, 
    options: ImageOptions
  ): Promise<CameraResult> {
    try {
      console.log('🔄 Verarbeite Bild:', uri);

      // Schritt 1: Bild-Informationen abrufen
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Bilddatei nicht gefunden');
      }

      const originalSize = fileInfo.size || 0;
      console.log('📊 Original Dateigröße:', this.formatFileSize(originalSize));

      // Schritt 2: Bild optimieren mit verbesserter Logik
      const optimized = await this.optimizeImage(uri, options, originalSize);

      // Schritt 3: In Base64 konvertieren
      const base64 = await FileSystem.readAsStringAsync(optimized.uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Schritt 4: Validieren
      if (!this.validateBase64(base64)) {
        throw new Error('Ungültiges Base64-Format');
      }

      const finalSize = base64.length * 0.75; // Ungefähre Größe in Bytes
      console.log('✅ Optimierte Größe:', this.formatFileSize(finalSize));
      console.log('💾 Komprimierung:', ((originalSize - finalSize) / originalSize * 100).toFixed(1) + '%');

      return {
        success: true,
        base64,
        uri: optimized.uri,
        width: optimized.width,
        height: optimized.height
      };

    } catch (error) {
      console.error('Process image error:', error);
      throw error;
    }
  }

  /**
   * Optimiert ein Bild für die API - KOMPLETT NEU UND VERBESSERT
   */
  private static async optimizeImage(
    uri: string, 
    options: ImageOptions,
    originalSize: number = 0
  ): Promise<ImageManipulator.ImageResult> {
    const { maxWidth = 800, maxHeight = 800, quality = 0.7, format = 'jpeg' } = options;

    // NEUE INTELLIGENTE KOMPRIMIERUNGSLOGIK
    let compressionQuality = quality;
    let finalWidth = maxWidth;
    let finalHeight = maxHeight;
    
    if (originalSize > 0) {
      if (originalSize > 10 * 1024 * 1024) {        // > 10MB - Sehr große Datei
        compressionQuality = 0.3;
        finalWidth = 600;
        finalHeight = 600;
        console.log('🚨 Sehr große Datei erkannt (>10MB), verwende maximale Komprimierung');
      } else if (originalSize > 5 * 1024 * 1024) {  // > 5MB - Große Datei
        compressionQuality = 0.4;
        finalWidth = 700;
        finalHeight = 700;
        console.log('⚠️ Große Datei erkannt (>5MB), verwende starke Komprimierung');
      } else if (originalSize > 2 * 1024 * 1024) {  // > 2MB - Mittlere Datei
        compressionQuality = 0.6;
        finalWidth = 800;
        finalHeight = 800;
        console.log('📱 Mittlere Datei erkannt (>2MB), verwende moderate Komprimierung');
      } else {
        // Kleinere Dateien: Verwende Standard-Einstellungen
        console.log('✅ Normale Dateigröße, verwende Standard-Komprimierung');
      }
    }

    console.log(`🔧 Komprimiere auf: ${finalWidth}x${finalHeight}, Qualität: ${compressionQuality}`);

    // Erste Komprimierung
    let result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: finalWidth,
            height: finalHeight
          }
        }
      ],
      {
        compress: compressionQuality,
        format: format === 'png' 
          ? ImageManipulator.SaveFormat.PNG 
          : ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );

    // ZUSÄTZLICHE ÜBERPRÜFUNG: Falls immer noch zu groß, nochmals komprimieren
    const resultInfo = await FileSystem.getInfoAsync(result.uri);
    const resultSize = resultInfo.size || 0;
    
    if (resultSize > this.MAX_FILE_SIZE) {
      console.log('⚠️ Bild immer noch zu groß nach erster Komprimierung, komprimiere erneut...');
      console.log('📊 Aktuelle Größe:', this.formatFileSize(resultSize));
      
      // Zweite, aggressivere Komprimierung
      result = await ImageManipulator.manipulateAsync(
        result.uri,
        [
          {
            resize: {
              width: Math.min(finalWidth * 0.8, 600), // 20% kleiner
              height: Math.min(finalHeight * 0.8, 600)
            }
          }
        ],
        {
          compress: 0.3, // Sehr starke Komprimierung
          format: ImageManipulator.SaveFormat.JPEG // Immer JPEG für beste Komprimierung
        }
      );

      const finalInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('✅ Finale Größe nach zweiter Komprimierung:', this.formatFileSize(finalInfo.size || 0));
    }

    return result;
  }

  /**
   * Validiert Base64-String - VERBESSERT
   */
  private static validateBase64(base64: string): boolean {
    try {
      // Prüfe ob String ein gültiges Base64-Format hat
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      
      // Mindestgröße prüfen (ca. 1KB)
      const minSize = 1000;
      
      // Maximalgröße prüfen (entspricht ca. 3MB nach Dekodierung)
      const maxSize = 4 * 1024 * 1024;
      
      if (!base64Regex.test(base64)) {
        console.error('❌ Ungültiges Base64-Format');
        return false;
      }
      
      if (base64.length < minSize) {
        console.error('❌ Bild zu klein:', this.formatFileSize(base64.length * 0.75));
        return false;
      }
      
      if (base64.length > maxSize) {
        console.error('❌ Bild zu groß:', this.formatFileSize(base64.length * 0.75));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Base64 Validierung fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Formatiert Dateigröße für Anzeige - VERBESSERT
   */
  private static formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Hilfsfunktion: Zeigt Auswahl-Dialog für Kamera oder Galerie
   */
  static async showImageSourceDialog(): Promise<CameraResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Foto auswählen',
        'Wie möchten Sie das Foto aufnehmen?',
        [
          {
            text: 'Kamera',
            onPress: async () => {
              const result = await this.takePhoto();
              resolve(result);
            }
          },
          {
            text: 'Galerie',
            onPress: async () => {
              const result = await this.pickImage();
              resolve(result);
            }
          },
          {
            text: 'Abbrechen',
            style: 'cancel',
            onPress: () => {
              resolve({ success: false, error: 'Abgebrochen' });
            }
          }
        ]
      );
    });
  }

  /**
   * Bereinigt temporäre Dateien - NEU HINZUGEFÜGT
   */
  static async cleanupTempFiles(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let cleanedCount = 0;

      for (const file of files) {
        if (file.includes('ImageManipulator') || file.includes('ImagePicker')) {
          try {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
            cleanedCount++;
          } catch (error) {
            // Ignoriere Fehler beim Löschen einzelner Dateien
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🗑️ ${cleanedCount} temporäre Bilddateien gelöscht`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Test-Funktion für Entwicklung - ERWEITERT
   */
  static async testCameraService(): Promise<void> {
    console.log('🧪 Teste Camera Service...\n');

    // 1. Berechtigungen testen
    console.log('1️⃣ Teste Berechtigungen...');
    const permissions = await this.requestPermissions();
    console.log('Kamera:', permissions.camera ? '✅' : '❌');
    console.log('Galerie:', permissions.mediaLibrary ? '✅' : '❌');

    // 2. Base64 Validierung testen
    console.log('\n2️⃣ Teste Base64 Validierung...');
    const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    console.log('Valid Base64:', this.validateBase64(validBase64) ? '✅' : '❌');
    console.log('Invalid Base64:', this.validateBase64('not-base64') ? '❌' : '✅');

    // 3. Cleanup testen
    console.log('\n3️⃣ Teste Cleanup...');
    await this.cleanupTempFiles();

    console.log('\n✅ Camera Service Test abgeschlossen!');
  }
}

// Export für einfacheren Import
export default CameraService;