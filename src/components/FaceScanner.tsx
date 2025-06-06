// src/components/FaceScanner.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera/legacy';
import * as FaceDetector from 'expo-face-detector';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FaceScannerProps {
  onScanComplete: (images: { uri: string; base64?: string }[]) => void;
  onProgress?: (progress: number) => void;
}

export function FaceScanner({ onScanComplete, onProgress }: FaceScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.front);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImages, setCapturedImages] = useState<{ uri: string; base64?: string }[]>([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [scanMessage, setScanMessage] = useState('Position your face in the circle');
  
  const cameraRef = useRef<Camera>(null);
  const scanAnimation = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    scanAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1
    );
  }, []);

  const animatedScannerStyle = useAnimatedStyle(() => {
    const scale = interpolate(scanAnimation.value, [0, 1], [0.9, 1.1]);
    const opacity = interpolate(scanAnimation.value, [0, 1], [0.3, 0.8]);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const handleFacesDetected = ({ faces }: { faces: FaceDetector.FaceFeature[] }) => {
    if (faces.length > 0) {
      setFaceDetected(true);
      const face = faces[0];
      
      // Check if face is centered and properly sized
      const faceCenterX = face.bounds.origin.x + face.bounds.size.width / 2;
      const faceCenterY = face.bounds.origin.y + face.bounds.size.height / 2;
      const screenCenterX = width / 2;
      const screenCenterY = height / 2;
      
      const iscentered = 
        Math.abs(faceCenterX - screenCenterX) < 50 &&
        Math.abs(faceCenterY - screenCenterY) < 100;
      
      if (iscentered && !isScanning) {
        setScanMessage('Perfect! Hold still...');
      }
    } else {
      setFaceDetected(false);
      setScanMessage('Position your face in the circle');
    }
  };

  const startScanning = async () => {
    if (!faceDetected || isScanning) return;
    
    setIsScanning(true);
    setScanMessage('Scanning in progress...');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Start capturing multiple images
    await captureMultipleImages();
  };

  const captureMultipleImages = async () => {
    const images: { uri: string; base64?: string }[] = [];
    const captureCount = 5; // Reduziert auf 5 Bilder für bessere Qualität
    
    for (let i = 0; i < captureCount; i++) {
      setScanProgress((i + 1) / captureCount);
      onProgress?.((i + 1) / captureCount);
      
      // Update scan message
      setScanMessage(`Capturing image ${i + 1}/${captureCount}...`);
      
      // Warte kurz vor der Aufnahme für besseren Fokus
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Capture image
      if (cameraRef.current) {
        try {
          console.log(`Capturing image ${i + 1}/${captureCount}...`);
          
          // Bild aufnehmen mit besseren Einstellungen
          const photo = await cameraRef.current.takePictureAsync({
            quality: 1, // Maximale Qualität
            skipProcessing: false,
            base64: false,
          });

          if (photo && photo.uri) {
            console.log('Photo captured, processing...');
            
            // Bild verarbeiten mit besserer Qualität
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              photo.uri,
              [{ resize: { width: 1500 } }], // Höhere Auflösung
              { 
                compress: 0.95, // Minimale Kompression
                format: ImageManipulator.SaveFormat.JPEG 
              }
            );

            // Zu Base64 konvertieren
            const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log(`Image ${i + 1} processed, base64 length: ${base64.length}`);

            if (base64 && base64.length > 0) {
              images.push({
                uri: manipulatedImage.uri,
                base64: base64
              });
              
              // Update captured images for preview
              setCapturedImages([...images]);
              
              // Haptic feedback
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        } catch (error) {
          console.error(`Capture error for image ${i + 1}:`, error);
        }
      }
      
      // Längere Pause zwischen Aufnahmen für besseren Fokus
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setScanMessage('Scan complete!');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Wait a moment before calling onScanComplete
    setTimeout(() => {
      if (images.length > 0) {
        console.log(`Scan complete! Captured ${images.length} images`);
        onScanComplete(images);
      } else {
        Alert.alert('Error', 'No images captured. Please try again.');
        setIsScanning(false);
        setScanProgress(0);
        setCapturedImages([]);
      }
    }, 1000);
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPermissionText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.accurate,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.overlay}>
          {/* Top section */}
          <View style={styles.topSection}>
            <Text style={styles.title}>Face Scanner</Text>
            <Text style={styles.subtitle}>{scanMessage}</Text>
          </View>

          {/* Center scanning area */}
          <View style={styles.scannerContainer}>
            <Animated.View style={[styles.scanner, animatedScannerStyle]}>
              <View style={styles.scannerInner}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </Animated.View>
            
            {faceDetected && (
              <Ionicons 
                name="checkmark-circle" 
                size={32} 
                color="#4CAF50" 
                style={styles.faceDetectedIcon}
              />
            )}
          </View>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            {!isScanning ? (
              <TouchableOpacity
                style={[styles.captureButton, !faceDetected && styles.captureButtonDisabled]}
                onPress={startScanning}
                disabled={!faceDetected}
              >
                <LinearGradient
                  colors={faceDetected ? ['#6b46c1', '#8b5cf6'] : ['#ccc', '#999']}
                  style={styles.captureButtonGradient}
                >
                  <Ionicons name="scan" size={32} color="#fff" />
                  <Text style={styles.captureButtonText}>Start Scan</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${scanProgress * 100}%` }]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(scanProgress * 100)}% Complete
                </Text>
              </View>
            )}

            {/* Image preview */}
            {capturedImages.length > 0 && (
              <View style={styles.imagePreview}>
                <Text style={styles.imagePreviewText}>
                  {capturedImages.length} images captured
                </Text>
              </View>
            )}
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  scannerContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanner: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 3,
    borderColor: '#6b46c1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerInner: {
    width: '90%',
    height: '90%',
    borderRadius: width * 0.35,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  faceDetectedIcon: {
    position: 'absolute',
    bottom: -50,
  },
  bottomSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    width: width * 0.8,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6b46c1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  imagePreview: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  imagePreviewText: {
    fontSize: 14,
    color: '#fff',
  },
  noPermissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default FaceScanner;