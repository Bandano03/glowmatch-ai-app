// src/hooks/useCamera.ts

import { useState, useCallback, useEffect } from 'react';
import CameraService from '../services/cameraService';
import { CameraResult, ImageSource } from '../types/camera.types';
import * as Haptics from 'expo-haptics';

interface UseCameraReturn {
  isLoading: boolean;
  error: string | null;
  lastImage: CameraResult | null;
  takePhoto: () => Promise<CameraResult>;
  pickImage: () => Promise<CameraResult>;
  selectImage: (source?: ImageSource) => Promise<CameraResult>;
  clearError: () => void;
  clearImage: () => void;
}

export function useCamera(): UseCameraReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastImage, setLastImage] = useState<CameraResult | null>(null);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      setLastImage(null);
      setError(null);
    };
  }, []);

  // Foto aufnehmen
  const takePhoto = useCallback(async (): Promise<CameraResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Haptisches Feedback beim Start
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await CameraService.takePhoto();
      
      if (result.success) {
        setLastImage(result);
        // Erfolgs-Feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.error || 'Unbekannter Fehler');
        // Fehler-Feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Fotografieren';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bild aus Galerie wählen
  const pickImage = useCallback(async (): Promise<CameraResult> => {
    setIsLoading(true);
    setError(null);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await CameraService.pickImage();
      
      if (result.success) {
        setLastImage(result);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.error || 'Unbekannter Fehler');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler bei der Bildauswahl';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bild auswählen (zeigt Dialog)
  const selectImage = useCallback(async (source?: ImageSource): Promise<CameraResult> => {
    if (source === 'camera') {
      return takePhoto();
    } else if (source === 'gallery') {
      return pickImage();
    } else {
      // Zeige Auswahl-Dialog
      setIsLoading(true);
      const result = await CameraService.showImageSourceDialog();
      setIsLoading(false);
      
      if (result.success) {
        setLastImage(result);
      } else if (result.error && result.error !== 'Abgebrochen') {
        setError(result.error);
      }
      
      return result;
    }
  }, [takePhoto, pickImage]);

  // Fehler löschen
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Bild löschen
  const clearImage = useCallback(() => {
    setLastImage(null);
  }, []);

  return {
    isLoading,
    error,
    lastImage,
    takePhoto,
    pickImage,
    selectImage,
    clearError,
    clearImage
  };
}

export default useCamera;