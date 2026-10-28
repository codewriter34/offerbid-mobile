# OfferBid iOS push — ops checklist

Firebase project: **`offerbid-59cd9`**  
iOS bundle id: **`com.offerbid.app`**

Secrets are never committed. Do not reuse TrustBridge/BloodConnect keys.

---

## 1. Apple Developer → APNs Auth Key (manual)

1. Open [Apple Developer → Keys](https://developer.apple.com/account/resources/authkeys/list).
2. Create a key with **Apple Push Notifications service (APNs)** enabled.
3. Download the `.p8` once. Record:
   - Key ID
   - Team ID ([Membership](https://developer.apple.com/account))
4. Store the `.p8` outside the repo (password manager / secure drive).

## 2. Firebase Console → upload APNs + download plist (manual)

1. Open [Firebase Console](https://console.firebase.google.com/project/offerbid-59cd9).
2. Project settings → Your apps → confirm/add **iOS** app with bundle id `com.offerbid.app`.
3. Download **`GoogleService-Info.plist`**.
4. Project settings → **Cloud Messaging** → Apple app configuration → upload:
   - APNs Auth Key (`.p8`)
   - Key ID
   - Team ID
5. Project settings → Service accounts → Generate new private key (JSON) for Nest Admin if Render vars are empty. Same project only.

## 3. Place plist locally (after download)

```bash
# From Downloads (adjust path):
cp ~/Downloads/GoogleService-Info.plist \
  /Users/tamehchana/projects/offerbid/offerbid-mobile/GoogleService-Info.plist

# Must stay gitignored
cd /Users/tamehchana/projects/offerbid/offerbid-mobile
git check-ignore -v GoogleService-Info.plist
./scripts/check-ios-push-ops.sh
```

EAS: add the same file as a secret / file env for iOS builds if CI builds without a local copy.

## 4. Render API env (manual if CLI workspace ≠ OfferBid)

Dashboard → **offerbid-api** → Environment → set:

| Key | Value |
|-----|--------|
| `FIREBASE_PROJECT_ID` | `offerbid-59cd9` (or value from service account JSON) |
| `FIREBASE_CLIENT_EMAIL` | from service account JSON |
| `FIREBASE_PRIVATE_KEY` | from JSON; keep `\n` newlines as Render expects |
| `CORS_ORIGINS` | `https://offerbid.co,https://www.offerbid.co` |
| `IDENTITY_AUTO_APPROVE` | `false` |
| `APP_ENV` | `production` (or `stage` on stage) |

Do **not** set `FIREBASE_SERVICE_ACCOUNT_PATH` on Render.

Current local `render` CLI is logged into **Sams Pull_A_Part**, not OfferBid — use the dashboard or `render login` with the OfferBid owner account.

## 5. Deal migration on deploy

`prisma/migrations/20260904120000_add_deals` ships with the API feature branch. Render `start:prod` runs `prisma migrate deploy` on boot.

After the API PR is merged/deployed:

```bash
curl -sS https://offerbid-api.onrender.com/api/v1/health/ready
# expect: {"status":"ready",...}
```

Confirm `deals` table exists in Neon if needed.

## 6. Device verification

1. EAS iOS build (dev client or TestFlight) — not Expo Go.
2. Sign in → allow notifications.
3. DB `devices`: long FCM token, `platform = IOS` (not `ExponentPushToken`, not 64-char hex).
4. Accept a bid → push arrives; tap opens listing.

## Blocked until you provide

- [ ] APNs `.p8` uploaded in Firebase (or Key ID / Team ID + file for you to upload)
- [ ] `GoogleService-Info.plist` for `com.offerbid.app` placed in mobile root
- [ ] Render `FIREBASE_*` filled on the OfferBid service
- [ ] Physical iPhone verification
