// src/types/camera.types.ts

export interface CameraResult {
  success: boolean;
  base64?: string;
  uri?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface ImageOptions {
  quality?: number;          // 0-1 (0.8 = 80% Qualität)
  maxWidth?: number;         // Maximale Breite in Pixel
  maxHeight?: number;        // Maximale Höhe in Pixel
  format?: 'jpeg' | 'png';   // Bildformat
}

export interface CameraPermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
}

export type ImageSource = 'camera' | 'gallery';