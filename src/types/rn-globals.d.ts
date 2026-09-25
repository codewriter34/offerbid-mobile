// This project's tsconfig only pulls in the "es2021" lib (no "dom"), so the
// Web Crypto `crypto` global that react-native-get-random-values installs
// onto `global` isn't otherwise typed.
export {};

declare global {
  interface Crypto {
    getRandomValues<T extends ArrayBufferView>(array: T): T;
  }
  // eslint-disable-next-line no-var
  var crypto: Crypto;
}
