// src/services/cameraService.ts

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'expo-camera';
import { Alert, Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CameraResult, ImageOptions, CameraPermissionStatus } from '../types/camera.types';

export class CameraService {
  // Standard-Optionen für Bilder
  private static readonly DEFAULT_OPTIONS: ImageOptions = {
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    format: 'jpeg'
  };

  // Maximale Dateigröße in Bytes (4MB für OpenAI API)
  private static readonly MAX_FILE_SIZE = 4 * 1024 * 1024;

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
   * Verarbeitet und optimiert ein Bild
   */
  private static async processImage(
    uri: string, 
    options: ImageOptions
  ): Promise<CameraResult> {
    try {
      console.log('📸 Verarbeite Bild:', uri);

      // Schritt 1: Bild-Informationen abrufen
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Bilddatei nicht gefunden');
      }

      console.log('📊 Original Dateigröße:', this.formatFileSize(fileInfo.size));

      // Schritt 2: Bild optimieren
      const optimized = await this.optimizeImage(uri, options, fileInfo.size);

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
   * Optimiert ein Bild für die API
   */
  private static async optimizeImage(
    uri: string, 
    options: ImageOptions,
    originalSize?: number
  ): Promise<ImageManipulator.ImageResult> {
    const { maxWidth = 1024, maxHeight = 1024, quality = 0.8, format = 'jpeg' } = options;

    // Bestimme Komprimierungsqualität basierend auf Originalgröße
    let compressionQuality = quality;
    if (originalSize && originalSize > this.MAX_FILE_SIZE) {
      // Stärkere Komprimierung für große Dateien
      compressionQuality = Math.min(quality, 0.7);
      console.log('⚠️ Große Datei erkannt, erhöhe Komprimierung');
    }

    // Array von Manipulationen
    const manipulations: ImageManipulator.Action[] = [];

    // Größe anpassen
    manipulations.push({
      resize: {
        width: maxWidth,
        height: maxHeight
      }
    });

    // Bild manipulieren
    const result = await ImageManipulator.manipulateAsync(
      uri,
      manipulations,
      {
        compress: compressionQuality,
        format: format === 'png' 
          ? ImageManipulator.SaveFormat.PNG 
          : ImageManipulator.SaveFormat.JPEG,
        base64: false // Wir machen das separat für bessere Kontrolle
      }
    );

    return result;
  }

  /**
   * Validiert Base64-String
   */
  private static validateBase64(base64: string): boolean {
    // Prüfe ob String ein gültiges Base64-Format hat
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    // Mindestgröße prüfen (ca. 10KB)
    const minSize = 10000;
    
    if (!base64Regex.test(base64)) {
      console.error('❌ Ungültiges Base64-Format');
      return false;
    }
    
    if (base64.length < minSize) {
      console.error('❌ Bild zu klein');
      return false;
    }
    
    return true;
  }

  /**
   * Formatiert Dateigröße für Anzeige
   */
  private static formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unbekannt';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
   * Test-Funktion für Entwicklung
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

    console.log('\n✅ Camera Service Test abgeschlossen!');
  }
}

// Export für einfacheren Import
export default CameraService;