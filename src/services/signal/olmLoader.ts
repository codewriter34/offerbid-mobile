// Loads @matrix-org/olm (Apache-2.0 — chosen over GPL/AGPL Signal-branded
// ports for licensing safety in this closed-source app) and initializes it
// exactly once.
//
// *** Why the "legacy" (asm.js) build and not the default WASM one ***
// Hermes has no `WebAssembly` global, so the package's default entry point
// (`olm.js` + `olm.wasm`, loaded via `require('@matrix-org/olm')`) cannot run
// on this app's JS engine. The package also ships `olm_legacy.js`, a pure
// asm.js build produced by the same Emscripten toolchain with `WASM=0`, which
// has no WebAssembly dependency — verified directly by inspecting the shipped
// file: the only two occurrences of the string "WebAssembly" in
// node_modules/@matrix-org/olm/olm_legacy.js are inside a dead
// `WebAssembly.instantiateStreaming(...)` fallback branch that Emscripten
// leaves in the bundle but which is never reached when the module is built
// without a companion .wasm file (there is no olm_legacy.wasm; nothing ever
// fetches one). This is also the documented approach used by Matrix's own
// React Native (Element) client for running Olm under Hermes/JSC.
//
// Olm's internal RNG picks its random source with
// `typeof window !== 'undefined' ? window.crypto.getRandomValues(...) : ...`.
// React Native sets `global.window = global` (see RN's InitializeCore), so
// this branch is taken, and `window.crypto` must be polyfilled — that's what
// `react-native-get-random-values` (imported at the very top of index.js,
// before anything else) provides.
//
// Confidence: HIGH that this loads and runs under Hermes (verified from the
// shipped bundle's contents), but it has NOT been exercised on a real device/
// simulator as part of this change — see the final report for what a human
// should verify.
import Olm from '@matrix-org/olm/olm_legacy.js';

let readyPromise: Promise<typeof Olm> | null = null;

export function ensureOlmReady(): Promise<typeof Olm> {
  if (!readyPromise) {
    readyPromise = Olm.init().then(() => Olm);
  }
  return readyPromise;
}
