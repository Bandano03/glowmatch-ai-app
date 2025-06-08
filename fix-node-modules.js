// fix-node-modules.js
const fs = require('fs');
const path = require('path');

const tsConfig = {
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "allowJs": true,
    "skipLibCheck": true
  }
};

const targetPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'tsconfig.json');

try {
  fs.writeFileSync(targetPath, JSON.stringify(tsConfig, null, 2));
  console.log('✅ Fixed expo-modules-core');
} catch (error) {
  console.error('Error:', error);
}