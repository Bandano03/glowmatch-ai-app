// src/components/FaceScanner.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // NEUE expo-camera API
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const SCAN_DURATION = 5000; // 5 Sekunden pro Scan

interface FaceScannerProps {
  onScanComplete: (images: string[]) => void;
  onProgress: (progress: number) => void;
}

export function FaceScanner({ onScanComplete, onProgress }: FaceScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const cameraRef = useRef<any>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scanning) {
      startScanAnimation();
      captureMultipleImages();
    }
  }, [scanning]);

  const startScanAnimation = () => {
    // Scan-Linie Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Puls-Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation Animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  };

  const captureMultipleImages = async () => {
    const images: string[] = [];
    const captureCount = 10; // 10 Bilder während des Scans
    const interval = SCAN_DURATION / captureCount;

    for (let i = 0; i < captureCount; i++) {
      if (!scanning) break;
      
      // Progress update
      const progress = (i + 1) / captureCount;
      setScanProgress(progress);
      onProgress(progress);
      
      // Capture image
      if (cameraRef.current) {
        try {
          // Simuliere Bildaufnahme für jetzt
          // In einer echten App würden Sie hier takePictureAsync verwenden
          const fakeImage = `fake-image-${i}`;
          images.push(fakeImage);
          
          // Haptic feedback
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
          console.error('Capture error:', error);
        }
      }
      
      // Wait for next capture
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    setCapturedImages(images);
    onScanComplete(images);
    setScanning(false);
  };

  const startScan = () => {
    setScanning(true);
    setScanProgress(0);
    setCapturedImages([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Wir benötigen Ihre Erlaubnis, um die Kamera zu verwenden
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Erlaubnis erteilen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        {/* Scan Overlay */}
        <View style={styles.scanOverlay}>
          {/* Face Guide */}
          <View style={styles.faceGuide}>
            <Animated.View
              style={[
                styles.faceOutline,
                {
                  transform: [
                    { scale: pulseAnim },
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', '#6b46c1', 'transparent']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Scan Line */}
            {scanning && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-150, 150],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['transparent', '#6b46c1', 'transparent']}
                  style={styles.scanLineGradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </Animated.View>
            )}

            {/* Corner Markers */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <BlurView intensity={80} style={styles.instructionBlur}>
              <Text style={styles.instructionText}>
                {scanning
                  ? `Scanvorgang läuft... ${Math.round(scanProgress * 100)}%`
                  : 'Positionieren Sie Ihr Gesicht im Rahmen'}
              </Text>
              {scanning && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${scanProgress * 100}%` },
                    ]}
                  />
                </View>
              )}
            </BlurView>
          </View>

          {/* Scan Points */}
          {scanning && (
            <View style={styles.scanPoints}>
              {[...Array(20)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.scanPoint,
                    {
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      opacity: scanLineAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Start Button */}
          {!scanning && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startScan}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6b46c1', '#8b5cf6']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Scan starten</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
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
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutline: {
    width: 280,
    height: 380,
    borderWidth: 3,
    borderColor: '#6b46c1',
    borderRadius: 140,
    position: 'absolute',
  },
  gradient: {
    flex: 1,
    borderRadius: 140,
  },
  scanLine: {
    position: 'absolute',
    width: 300,
    height: 2,
  },
  scanLineGradient: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#6b46c1',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  instructions: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
  },
  instructionBlur: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6b46c1',
    borderRadius: 2,
  },
  scanPoints: {
    ...StyleSheet.absoluteFillObject,
  },
  scanPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#6b46c1',
    borderRadius: 2,
  },
  startButton: {
    position: 'absolute',
    bottom: 100,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  startButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Export
export default FaceScanner;