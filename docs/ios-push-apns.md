# iOS push (APNs via Firebase)

OfferBid delivers iOS notifications as: **Nest → Firebase Admin (FCM) → APNs**.

Do not register Expo push tokens (`ExponentPushToken…`) or raw APNs hex with `POST /devices`. The API expects an **FCM registration token**.

## One-time console setup

1. Apple Developer → Keys → create an **APNs Auth Key** (`.p8`). Note Key ID and Team ID.
2. Firebase Console → add/select the iOS app with bundle id `com.offerbid.app`.
3. Download `GoogleService-Info.plist` into the mobile repo root (gitignored).
4. Firebase → Project settings → Cloud Messaging → Apple app → upload the `.p8` + Key ID + Team ID.
5. Ensure Nest Admin SDK credentials are from the **same** Firebase project (`FIREBASE_*` on Render).

## App / EAS

- `app.config.js` sets `ios.googleServicesFile`, `UIBackgroundModes: remote-notification`, and `expo-notifications` `mode: 'production'` with `enableBackgroundRemoteNotifications: true`.
- Build with **EAS / development client** (not Expo Go) so `@react-native-firebase/messaging` is present.
- After login, `pushService.getFCMToken()` uses Firebase Messaging on iOS and registers via `POST /devices`.

## Verify

1. Physical iPhone, permission granted, signed in.
2. DB `devices` row: long FCM-style token, `platform = IOS`.
3. Accept a bid → push arrives (background and killed). Tap opens the listing.

Android push paths are intentionally unchanged in this hardening pass.

For the full production ops checklist (Apple key, Firebase upload, Render env, migration, device verify), see [ops-ios-push-checklist.md](./ops-ios-push-checklist.md).
