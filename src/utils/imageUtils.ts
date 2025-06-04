// src/utils/imageUtils.ts

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export class ImageUtils {
  /**
   * Erstellt ein Thumbnail von einem Bild
   */
  static async createThumbnail(
    uri: string, 
    size: number = 150
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: size, height: size } }],
        { 
          compress: 0.7, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      return uri; // Fallback auf Original
    }
  }

  /**
   * Rotiert ein Bild wenn nötig (basierend auf EXIF-Daten)
   */
  static async correctImageRotation(uri: string): Promise<string> {
    try {
      // In Expo wird die Rotation normalerweise automatisch korrigiert
      // Diese Funktion ist ein Platzhalter für zukünftige Erweiterungen
      return uri;
    } catch (error) {
      console.error('Rotation correction error:', error);
      return uri;
    }
  }

  /**
   * Konvertiert Bild zu Grayscale (für spezielle Analysen)
   */
  static async convertToGrayscale(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ grayscale: true }],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error('Grayscale conversion error:', error);
      return uri;
    }
  }

  /**
   * Speichert Base64 Bild als Datei
   */
  static async saveBase64AsFile(
    base64: string, 
    filename: string
  ): Promise<string | null> {
    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });
      return fileUri;
    } catch (error) {
      console.error('Save base64 error:', error);
      return null;
    }
  }

  /**
   * Löscht temporäre Bilddateien
   */
  static async cleanupTempImages(): Promise<void> {
    try {
      const directory = FileSystem.documentDirectory;
      if (!directory) return;

      const files = await FileSystem.readDirectoryAsync(directory);
      const imageFiles = files.filter(file => 
        file.endsWith('.jpg') || 
        file.endsWith('.jpeg') || 
        file.endsWith('.png')
      );

      for (const file of imageFiles) {
        const fileUri = `${directory}${file}`;
        const info = await FileSystem.getInfoAsync(fileUri);
        
        // Lösche Dateien älter als 24 Stunden
        if (info.exists && info.modificationTime) {
          const age = Date.now() - info.modificationTime * 1000;
          if (age > 24 * 60 * 60 * 1000) {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            console.log('🗑️ Gelöscht:', file);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Prüft ob ein Bild ein Gesicht enthält (Platzhalter)
   */
  static async containsFace(uri: string): Promise<boolean> {
    // In einer echten App würden Sie hier eine Gesichtserkennung verwenden
    // z.B. mit ML Kit oder einer anderen Library
    // Für jetzt geben wir immer true zurück
    return true;
  }

  /**
   * Gibt Bild-Metadaten zurück
   */
  static async getImageMetadata(uri: string): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  } | null> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return null;

      // Für detaillierte Dimensionen müssen wir das Bild laden
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [], // Keine Manipulationen
        { base64: false }
      );

      return {
        width: manipResult.width,
        height: manipResult.height,
        size: info.size || 0,
        type: uri.endsWith('.png') ? 'png' : 'jpeg'
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }
}

export default ImageUtils;