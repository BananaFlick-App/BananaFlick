// 2️⃣ Load polyfills BEFORE any app code
import 'react-native-url-polyfill/auto';

// 3️⃣ Normal Expo bootstrap
import { registerRootComponent } from 'expo';
import App from './App';


registerRootComponent(App);
