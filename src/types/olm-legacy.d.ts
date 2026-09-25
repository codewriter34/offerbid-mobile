// @matrix-org/olm's package.json does not declare a "types"/"typings" field,
// and we deliberately import the "olm_legacy.js" subpath (the pure asm.js
// build, not the default wasm one) — see src/services/signal/olmLoader.ts for
// why. Neither of those is covered by the package's own index.d.ts resolution,
// so we hand-declare the subset of the API this app actually uses.
declare module '@matrix-org/olm/olm_legacy.js' {
  namespace Olm {
    class Account {
      constructor();
      free(): void;
      create(): void;
      identity_keys(): string;
      sign(message: string | Uint8Array): string;
      one_time_keys(): string;
      mark_keys_as_published(): void;
      max_number_of_one_time_keys(): number;
      generate_one_time_keys(numberOfKeys: number): void;
      remove_one_time_keys(session: Session): void;
      pickle(key: string | Uint8Array): string;
      unpickle(key: string | Uint8Array, pickle: string): void;
    }

    class Session {
      constructor();
      free(): void;
      pickle(key: string | Uint8Array): string;
      unpickle(key: string | Uint8Array, pickle: string): void;
      create_outbound(
        account: Account,
        theirIdentityKey: string,
        theirOneTimeKey: string,
      ): void;
      create_inbound(account: Account, oneTimeKeyMessage: string): void;
      create_inbound_from(
        account: Account,
        identityKey: string,
        oneTimeKeyMessage: string,
      ): void;
      session_id(): string;
      has_received_message(): boolean;
      matches_inbound(oneTimeKeyMessage: string): boolean;
      matches_inbound_from(identityKey: string, oneTimeKeyMessage: string): boolean;
      encrypt(plaintext: string): {type: 0 | 1; body: string};
      decrypt(messageType: number, message: string): string;
      describe(): string;
    }

    class Utility {
      constructor();
      free(): void;
      sha256(input: string | Uint8Array): string;
      ed25519_verify(key: string, message: string | Uint8Array, signature: string): void;
    }

    function init(opts?: object): Promise<void>;
    function get_library_version(): [number, number, number];
    const PRIVATE_KEY_LENGTH: number;
  }

  export = Olm;
}
