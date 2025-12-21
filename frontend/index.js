// 2️⃣ Load polyfills BEFORE any app code
import './src/utils/url-polyfill';

// 3️⃣ Normal Expo bootstrap
import { registerRootComponent } from 'expo';
import App from './App';


registerRootComponent(App);
