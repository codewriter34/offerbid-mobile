// Must be imported before anything else touches crypto.getRandomValues —
// this polyfills it via a native RNG, which Olm's legacy (asm.js) build
// relies on for key generation. See src/services/signal/olmLoader.ts.
import 'react-native-get-random-values';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
