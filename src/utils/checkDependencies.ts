// src/utils/checkDependencies.ts

export const checkDependencies = async () => {
  const missing: string[] = [];
  
  const dependencies = [
    { name: 'expo-camera', import: () => import('expo-camera') },
    { name: 'expo-media-library', import: () => import('expo-media-library') },
    { name: 'expo-image-picker', import: () => import('expo-image-picker') },
    { name: 'expo-file-system', import: () => import('expo-file-system') },
    { name: 'expo-image-manipulator', import: () => import('expo-image-manipulator') },
    { name: 'expo-secure-store', import: () => import('expo-secure-store') },
    { name: 'expo-haptics', import: () => import('expo-haptics') },
    { name: 'expo-blur', import: () => import('expo-blur') },
    { name: 'react-native-progress', import: () => import('react-native-progress') },
  ];

  for (const dep of dependencies) {
    try {
      await dep.import();
      console.log(`✅ ${dep.name} ist installiert`);
    } catch (error) {
      console.error(`❌ ${dep.name} fehlt!`);
      missing.push(dep.name);
    }
  }

  if (missing.length > 0) {
    console.error('\n⚠️ Fehlende Dependencies:', missing);
    console.log('\nBitte installieren mit:');
    missing.forEach(dep => {
      console.log(`npx expo install ${dep}`);
    });
  } else {
    console.log('\n✅ Alle Dependencies sind korrekt installiert!');
  }

  return missing.length === 0;
};

// Test ausführen
if (__DEV__) {
  checkDependencies();
}