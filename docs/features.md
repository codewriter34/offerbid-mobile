# OfferBid Mobile — Feature Tracking

Status legend: `[ ]` Not started | `[~]` In progress | `[x]` Complete | `[-]` Deferred

---

## Built

| Feature | Screen(s) | Date | Notes |
|---|---|---|---|
| Google Sign-In (One-Tap) | Auth | 2026-08-14 | Full flow: Google ID token → NestJS verify → JWT issuance → keychain storage |
| JWT token storage | Auth (service layer) | 2026-08-14 | react-native-keychain, access + refresh stored securely |
| Token refresh flow | apiClient interceptor | 2026-08-14 | 401 → auto-refresh → retry queue for concurrent requests |
| Hub selection (Country → City → Neighborhood) | HubSelect | 2026-08-14 | Fetches hubs from API, 2-step picker, persists via PATCH |
| Hub persistence on user profile | HubSelect → API | 2026-08-14 | Stored server-side, restored on session restore |
| Auth-gated navigation | RootNavigator | 2026-08-14 | Conditional rendering: Auth → HubSelect → MainTabs based on state |
| Create listing form | CreateListing | 2026-08-14 | Title, description, category, starting price, min bid with full validation |
| Image picker (up to 4 photos) | CreateListing | 2026-08-14 | react-native-image-picker, visual grid with remove |
| Cloudinary upload integration | cloudinaryUpload service | 2026-08-14 | Unsigned upload, parallel multi-image, error handling per image |
| Feed screen — hub-filtered listing fetch | Feed | 2026-08-14 | Fetches by user's hub_id, loading/empty/error states |
| Category filter | Feed | 2026-08-14 | Horizontal chip row, "All" option, filters applied to API call |
| Sort by recency | Feed | 2026-08-14 | Default sort, passed as query param |
| Pull-to-refresh | Feed | 2026-08-14 | RefreshControl, resets to page 1 |
| Infinite scroll pagination | Feed | 2026-08-14 | onEndReached → loadMore, hasMore flag, loading footer |
| Listing detail screen | ListingDetail | 2026-08-14 | Image carousel with dots, description, bid list, safety banner |
| Scam Guard (3-listing limit) | CreateListing + Profile | 2026-08-14 | Checks active count, blocks create, shows progress bar on profile |
| Submit bid (custom offer amount) | SubmitBid | 2026-08-14 | Validates ≥ min_bid, POST to API, success/error alerts |
| Bid validation (≥ min_bid) | SubmitBid + validators | 2026-08-14 | isValidBidAmount util, enforced in UI |
| Seller bid dashboard | BidDashboard | 2026-08-14 | Incoming bids list, refresh, real-time subscription |
| Accept/Reject/Counter actions | BidDashboard + BidCard | 2026-08-14 | Confirmation alerts, PATCH to API, counter modal |
| Counter-offer loop | BidDashboard + MyBids | 2026-08-14 | Countered bids shown to buyer with accept/reject, seller counter modal |
| Countdown timer per bid | CountdownTimer component | 2026-08-14 | 1s interval, formatted HH:MM:SS, urgent/expired states, onExpired callback |
| Max 3 active bids per item | Config constant | 2026-08-14 | MAX_ACTIVE_BIDS_PER_ITEM = 3, enforced server-side |
| Buyer "My Bids" tracking | MyBids | 2026-08-14 | Grouped by active/resolved, status badges, real-time updates |
| Socket.io connection | socketClient service | 2026-08-14 | Auth in handshake, reconnection (10 attempts, exponential backoff), room join/leave |
| Live bid/listing status updates | useRealtimeBids hook | 2026-08-14 | Subscribes to bid:new, bid:updated, listing:updated, notification:new events |
| Reconnection handling | socketClient service | 2026-08-14 | Auto-reconnect, server disconnect → manual reconnect after 5s |
| FCM token capture/registration | notifeeService | 2026-08-14 | Token captured on login, registered with backend, refresh listener |
| Notifee Android channels | notifeeService | 2026-08-14 | "Bid Updates" (HIGH) and "General" (DEFAULT) channels |
| Notification tap → navigate | NotificationCenter | 2026-08-14 | Parses payload.listing_id, navigates to ListingDetail |
| Background/killed-app handling | notifeeService | 2026-08-14 | setBackgroundMessageHandler + onBackgroundEvent |
| WhatsApp deep link builder | whatsappBridge service | 2026-08-14 | Phone formatting (CM/NG), pre-filled message, currency |
| "Chat Seller on WhatsApp" button | BidCard (post-acceptance) | 2026-08-14 | Green button on accepted bids, opens wa.me URL |
| Safety banner for public meetups | SafetyBanner component | 2026-08-14 | Shown on ListingDetail, mentions hub location |
| In-app notification list | NotificationCenter | 2026-08-14 | FlatList from API, refresh, emoji icons per type |
| Read/unread visual states | NotificationItem | 2026-08-14 | Yellow background for unread, blue dot indicator |
| Mark as read on tap | NotificationCenter | 2026-08-14 | Optimistic update + API PATCH |
| Unread count badge on tab | MainTabNavigator | 2026-08-14 | tabBarBadge from notification store, red badge |
| Unified buyer/seller profile | Profile | 2026-08-14 | Avatar, name, hub, verification badge, stats row |
| My listings section on profile | Profile | 2026-08-14 | Lists all user's listings with ListingCard |
| Scam guard status on profile | Profile | 2026-08-14 | Progress bar showing X/3 active listings |
| Hub change option | Profile | 2026-08-14 | "Change Location" button → HubSelect screen |
| Logout | Profile | 2026-08-14 | Confirmation alert, clears tokens/state, navigates to Auth |
| Design tokens system | theme/ | 2026-08-14 | Colors (#FBC91B primary), typography, spacing, borderRadius |
| Shared component library | components/ | 2026-08-14 | Button (5 variants), ListingCard, BidCard, CategoryBadge, CountdownTimer, EmptyState, LoadingSpinner, NotificationItem, ErrorView, SafetyBanner |
| Zustand state management | store/ | 2026-08-14 | authStore, listingStore, bidStore, notificationStore |
| API client with interceptors | apiClient service | 2026-08-14 | Bearer token injection, 401 refresh with request queue |
| Utility functions | utils/ | 2026-08-14 | formatPrice (XAF/NGN), formatRelativeTime, formatCountdown, validators |
| DELETE /listings/:id | ListingDetail | 2026-08-22 | Seller deletes own listing, blocked if accepted bid exists, cascades pending bids |
| PATCH /listings/:id | EditListing (new screen) | 2026-08-22 | Update title, description, prices, category, images on active listings |
| PATCH /users/me — profile update | Profile | 2026-08-22 | Partial update: name, city, location, address, primaryIntent, phone |
| GET /users/:id/profile — public profile | SellerProfile (new screen) | 2026-08-22 | Shows fullName, avatar, verified badge, active listing count; no email/phone |
| POST /listings/:id/view — view count | ListingDetail | 2026-08-22 | Atomic increment on detail screen load, no auth required, fire-and-forget |
| GET /listings/:id/similar | ListingDetail | 2026-08-22 | Up to 6 active listings in same category + location, shown in horizontal scroll |
| DELETE /notifications/:id | NotificationCenter | 2026-08-22 | Long-press to delete, optimistic removal from store |
| Edit listing screen | EditListing | 2026-08-22 | Modal form pre-filled from current listing data, full validation, image management |
| Seller profile screen | SellerProfile | 2026-08-22 | Public profile view with avatar, verification status, active listing count |
| Listing view count display | ListingDetail | 2026-08-22 | Shows view count next to posted time on listing detail |

---

## Not Built Yet

| Feature | Sprint Week | Blocker / Note |
|---|---|---|
| Price range filter on feed | Week 3 | UI exists in filter row, API param wired but slider UI not built |
| Search text filtering | Week 2 | TextInput exists, submit wired, needs backend search endpoint confirmation |
| ID verification unlock flow | Week 3 | Manual admin review — needs admin panel or API endpoint for verification requests |
| Firebase project setup | Week 1 | **BLOCKER**: Needs google-services.json downloaded and placed in android/app/ |
| Google Sign-In client IDs | Week 1 | **BLOCKER**: Needs OAuth client ID configured in Google Cloud Console |
| Cloudinary account | Week 2 | **BLOCKER**: Needs cloud name and unsigned upload preset configured in .env |
| Android native project (android/) | Pre-sprint | Need to run `npx react-native init` or manually create android folder |
| Play Store distribution | Post-sprint | Deferred to after MVP testing |

---

## Future Features (Post-MVP)

| Feature | Priority | Notes |
|---|---|---|
| In-app escrow via Mobile Money | High | MoMo/Orange Money aggregator integration — deferred until 100+ weekly trades |
| Integrated in-app messaging | Medium | Beyond WhatsApp bridge — full chat between buyer/seller |
| Seller verification badges | Medium | Visual trust indicators after ID verification |
| Automated auction-style timers | Low | Auto-accept highest bid when timer expires |
| iOS App Store submission | Medium | RN codebase is iOS-ready, needs Apple developer account + signing |
| Content moderation for photos | Medium | Flag-and-review system for prohibited items — manual for MVP |
| Price range slider UI | Low | Replace text inputs with a range slider component on Feed |
| Notification grouping | Low | Group notifications by listing on Android |
| Offline-first caching | Medium | Cache listings/bids for 3G/unstable connections |
| Analytics/tracking | Medium | Track offer acceptance rate, WhatsApp bridge clicks, seller repeat rate |

---

## Sprint Schedule (4 weeks)

| Week | Dev A (Logic) | Dev B (Logic) | Dev C (UI) |
|---|---|---|---|
| 1 | Auth + Hub Select logic, navigator | Socket.io setup, FCM/Notifee config | Theme/tokens, Auth + Hub Select screens |
| 2 | Create Listing + Cloudinary logic | Bid submission logic | Feed + ListingDetail + CreateListing screens |
| 3 | Feed + Scam Guard logic | Seller Dashboard + push wiring | BidDashboard + MyBids screens |
| 4 | Profile logic, bug fixes | WhatsApp bridge + notification center | Profile + NotificationCenter, polish |
