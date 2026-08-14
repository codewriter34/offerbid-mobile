# OfferBid Mobile — Development Log

Track daily progress, decisions, blockers, and notes here.

---

## 2026-08-14 — Project Scaffolding

**Author:** Adrian (Dev A)

### What was done
- Initialized React Native project structure (full scaffold, not RN CLI init)
- Created all config files: `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `.env.example`, `.eslintrc.js`, `.prettierrc.js`
- Set up path aliases (`@components/*`, `@services/*`, etc.) in tsconfig + babel
- Created full `src/` directory structure:
  - **9 screens** scaffolded: Auth, HubSelect, Feed, ListingDetail, CreateListing, BidDashboard, MyBids, Profile, NotificationCenter
  - **6 services**: apiClient, socketClient, authService, cloudinaryUpload, notifeeService, whatsappBridge
  - **5 hooks**: useAuth, useRealtimeBids, useListings, useBids, useNotifications
  - **8 shared components**: Button, ListingCard, BidCard, CategoryBadge, CountdownTimer, EmptyState, LoadingSpinner, NotificationItem
  - **Theme system**: colors (brand palette), typography, spacing/borderRadius
  - **Type definitions**: User, Listing, Bid, Hub, Notification, Navigation types
  - **Config**: API endpoints, hub config, app constants
  - **Store**: Zustand auth store
  - **Utils**: formatters, validators (stubs)
- Created navigation structure: RootNavigator (stack) + MainTabNavigator (bottom tabs)
- Wrote comprehensive README.md for continuous development
- Created docs/dev_log.md and docs/features.md
- Created `adrian-dev` branch and pushed to remote

### Decisions
- **State management:** Chose Zustand over Redux — lightweight, minimal boilerplate, sufficient for MVP
- **Path aliases:** Set up `@/` prefix aliases to avoid deep relative imports
- **Screen structure:** One folder per screen with barrel export for clean imports
- **Handoff pattern:** Screens scaffolded with TODO comments describing what needs to be implemented — Dev C can fill in UI, Dev A/B wire up logic

### Blockers
- None (initial scaffold)

### Next steps
- [ ] Run `npx react-native init` to generate android/ios native folders (or integrate into existing RN project)
- [ ] Install dependencies (`npm install`)
- [ ] Set up Firebase project + download `google-services.json`
- [ ] Configure Google Sign-In client IDs
- [ ] Set up Cloudinary account + upload preset
- [ ] Begin Week 1 tasks per dev split

---

## 2026-08-14 — Full Production Implementation (All Screens)

**Author:** Adrian (Dev A)

### What was done

**Foundation layer (services, stores, hooks, components):**
- Implemented `tokenStorage.ts` — secure JWT storage via react-native-keychain (store, get, clear)
- Implemented `apiClient.ts` — Axios instance with Bearer token interceptor + 401 auto-refresh with concurrent request queue
- Implemented `authService.ts` — Google Sign-In via `@react-native-google-signin`, POST to `/auth/google`, session restore, sign out
- Implemented `socketClient.ts` — Socket.io connection with auth token, reconnection (10 attempts, exponential backoff), room join/leave, event subscription
- Implemented `cloudinaryUpload.ts` — unsigned upload to Cloudinary, parallel multi-image upload with per-image error handling
- Implemented `notifeeService.ts` — Android channels (Bid Updates HIGH, General DEFAULT), FCM token capture/registration, background message handler, notification press events
- Implemented `whatsappBridge.ts` — phone formatting for CM/NG, pre-filled message with item/price/meetup, WhatsApp availability check
- Created 4 Zustand stores: `authStore` (user, hub, auth state), `listingStore` (listings, filters, pagination), `bidStore` (my bids, incoming, per-listing), `notificationStore` (notifications, unread count)
- Implemented 5 hooks: `useAuth` (bootstrap, sign in/out, FCM setup), `useListings` (fetch, filter, paginate, create), `useBids` (submit, update, fetch), `useRealtimeBids` (Socket.io subscriptions), `useNotifications` (fetch, mark read)
- Built 10 shared components: Button (5 variants: primary/secondary/outline/danger/ghost, 3 sizes, loading state), ListingCard, BidCard (with accept/reject/counter/WhatsApp actions), CategoryBadge (color per category), CountdownTimer (1s interval, urgent/expired states), EmptyState (with optional action button), LoadingSpinner, NotificationItem, ErrorView, SafetyBanner
- Implemented all utils: `formatPrice` (XAF/NGN), `formatRelativeTime`, `formatCountdown`, `truncateText`, `isValidBidAmount`, `isValidPhone` (CM/NG regex), `isValidListingTitle`, `isValidListingDescription`, `isValidPrice`, `isValidMinBid`

**Screens (all 11, production-quality):**
1. **AuthScreen** — Blue gradient hero, Google Sign-In button with loading/error handling, navigates to HubSelect or MainTabs based on hub_id
2. **HubSelectScreen** — 2-step picker (Country → Neighborhood), fetches hubs from API, saves selection via PATCH, loading/error states
3. **FeedScreen** — Hub-filtered listing feed, search input, category filter chips, pull-to-refresh, infinite scroll pagination, FAB to create listing, loading/empty/error states
4. **ListingDetailScreen** — Image carousel with page dots, category badge, price/min bid/time, description, "Make an Offer" button, bid history list, safety banner, seller accept/reject/counter actions
5. **CreateListingScreen** — Image picker grid (up to 4), category chips, full form validation, scam guard limit check, Cloudinary upload, submit to API
6. **SubmitBidScreen** — Modal with listing context (asking price, min bid), amount input, validates ≥ min_bid, POST to API
7. **CounterBidScreen** — Modal for seller counter-offers, shows current bid amount, submit counter via PATCH
8. **BidDashboardScreen** — Seller incoming bids list, accept/reject/counter actions, counter modal with amount input, real-time updates, refresh
9. **MyBidsScreen** — Buyer's bids with status tracking, counter-offer handling (accept/reject back), WhatsApp button on accepted bids, real-time updates
10. **NotificationCenterScreen** — Notification list with type-specific icons, read/unread states, tap to mark read + navigate to listing, refresh
11. **ProfileScreen** — Avatar with initial, name/hub/verification badge, stats row (active/sold/total), scam guard progress bar, my listings, change hub, sign out

**Navigation:**
- Auth-gated `RootNavigator` — conditional rendering: unauthenticated → Auth, no hub → HubSelect, authenticated → MainTabs + modal screens
- `MainTabNavigator` with 5 tabs (Feed, My Bids, Dashboard, Alerts, Profile), emoji icons, unread count badge on Alerts tab
- Added `SubmitBid` and `CounterBid` as modal-presented stack screens

**Package updates:**
- Bumped to React 18.3.1, RN 0.76.6, React Navigation 7.x, Zustand 5.x
- Added `react-native-image-picker` for photo selection
- Updated all deps to latest stable versions

### Decisions
- **React Navigation 7** — updated from v6 scaffold to v7 for latest API patterns
- **Zustand 5** — updated from v4 for latest store patterns
- **Emoji tab icons** — simple, no icon library dependency for MVP; replace with SVG icons later
- **Counter bid as modal** — both SubmitBid and CounterBid presented as modals for focused UX
- **Optimistic updates on notifications** — markAsRead updates store immediately, then PATCHes API
- **Image picker over camera** — using `react-native-image-picker` (gallery selection), camera capture deferred

### Blockers
- **Firebase/Google Sign-In credentials** — app is fully wired but needs google-services.json + OAuth client ID configured before auth works end-to-end. Logged in "Not Built Yet" in features.md.
- **Cloudinary account** — upload code is complete but needs CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in .env
- **Android native project** — no `android/` directory yet; need to run `npx react-native init` or create manually

### Next steps
- [ ] Generate android/ folder via `npx react-native init OfferBid --directory . --skip-install`
- [ ] Place google-services.json in android/app/
- [ ] Configure Google Sign-In OAuth client IDs in Google Cloud Console
- [ ] Set up Cloudinary account, create unsigned upload preset
- [ ] Fill in .env with all credentials
- [ ] `npm install` and test full flow on Android emulator
- [ ] Build price range slider component for feed filters
- [ ] Build admin verification request flow (submit for review)
- [ ] End-to-end testing with live API

---

## Template for future entries

```markdown
## YYYY-MM-DD — Title

**Author:** Name (Dev A/B/C)

### What was done
- ...

### Decisions
- ...

### Blockers
- ...

### Next steps
- [ ] ...
```
