
// index.ts
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent ruft AppRegistry.registerComponent('main', () => App) auf;
// Es stellt auch sicher, dass die Umgebung korrekt eingerichtet wird
registerRootComponent(App);
