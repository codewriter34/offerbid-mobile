# OfferBid Mobile — Feature Tracking

Status legend: `[ ]` Not started | `[~]` In progress | `[x]` Complete | `[-]` Deferred

---

## MVP Features (4-week sprint target)

### Auth & Hub Selection (Dev A)
- [ ] Google Sign-In (One-Tap) integration
- [ ] JWT token storage (react-native-keychain)
- [ ] Token refresh flow
- [ ] Hub selection screen (Country -> City -> Neighborhood)
- [ ] Hub persistence on user profile
- [ ] Auth-gated navigation (no hub = force hub select)

### Listings & Feed (Dev A + Dev C)
- [ ] Create listing form (title, description, category, price, min bid)
- [ ] Image picker (up to 4 photos)
- [ ] Client-side image compression (react-native-image-resizer)
- [ ] Cloudinary upload integration
- [ ] Feed screen — hub-filtered listing fetch
- [ ] Category filter
- [ ] Price range filter
- [ ] Sort by recency
- [ ] Pull-to-refresh
- [ ] Infinite scroll pagination
- [ ] Listing detail screen (image carousel, seller info, bid history)

### Scam Guard (Dev A)
- [ ] 3 active listing limit for unverified users
- [ ] Limit check before listing creation
- [ ] Verification unlock flow (manual admin review for MVP)

### Bidding Engine (Dev B)
- [ ] Submit bid (custom offer amount)
- [ ] Bid validation (>= min_bid)
- [ ] Seller bid dashboard — incoming bids list
- [ ] Accept bid action
- [ ] Reject bid action
- [ ] Counter bid action (with new amount)
- [ ] Counter-offer loop (buyer receives counter -> can accept/reject/counter back)
- [ ] Countdown timer per bid (expiry enforcement)
- [ ] Max 3 active bids per item (anti-spam)
- [ ] Buyer "My Bids" tracking screen

### Real-time Updates (Dev B)
- [ ] Socket.io connection setup (wss://offerbid-api.onrender.com/realtime)
- [ ] Auth token in Socket.io handshake
- [ ] Live bid status updates (new bid, accepted, rejected, countered)
- [ ] Live listing status updates (sold, withdrawn)
- [ ] Reconnection handling

### Push Notifications (Dev B)
- [ ] Firebase project setup (FCM only, no Firebase Auth)
- [ ] FCM token capture on login
- [ ] FCM token registration with backend
- [ ] Notifee channel configuration (Android)
- [ ] Notification display (new bid, accepted, rejected, countered, expiring)
- [ ] Notification press -> navigate to relevant screen
- [ ] Background/killed-app notification handling

### WhatsApp Bridge (Dev B)
- [ ] Deep link builder (wa.me URL with pre-filled message)
- [ ] "Chat Seller on WhatsApp" button (post-acceptance only)
- [ ] Pre-filled message: item name, accepted price, suggested meetup
- [ ] Safety banner for public meetup locations

### Notification Center (Dev B + Dev C)
- [ ] In-app notification list (from API)
- [ ] Read/unread visual states
- [ ] Mark as read on tap
- [ ] Navigate to relevant screen on tap
- [ ] Unread count badge on tab

### Profile (Dev A + Dev C)
- [ ] Unified buyer/seller profile display
- [ ] User info (name, hub, verification status)
- [ ] My listings section
- [ ] Active listing count / scam guard status
- [ ] Hub change option
- [ ] Logout

### UI / Component Library (Dev C)
- [ ] Design tokens setup (colors, typography, spacing)
- [ ] Button component (primary, secondary, outline variants)
- [ ] ListingCard component
- [ ] BidCard component (with action buttons)
- [ ] CategoryBadge component
- [ ] CountdownTimer component
- [ ] EmptyState component
- [ ] LoadingSpinner component
- [ ] NotificationItem component
- [ ] Auth screen UI
- [ ] Hub selection screen UI
- [ ] Feed screen UI (cards, filters, empty/loading states)
- [ ] Listing detail screen UI
- [ ] Create listing screen UI (form, image picker)
- [ ] Bid dashboard screen UI (seller)
- [ ] My Bids screen UI (buyer)
- [ ] Profile screen UI
- [ ] Notification center screen UI

---

## Post-MVP Backlog (deferred until 100+ weekly organic trades)

- [-] In-app escrow via Mobile Money aggregators
- [-] Integrated in-app messaging (beyond WhatsApp bridge)
- [-] Seller verification badges
- [-] Automated auction-style timers
- [-] iOS App Store submission
- [-] Content moderation for listing photos

---

## Sprint Schedule (4 weeks)

| Week | Dev A (Logic) | Dev B (Logic) | Dev C (UI) |
|---|---|---|---|
| 1 | Auth + Hub Select logic, navigator | Socket.io setup, FCM/Notifee config | Theme/tokens, Auth + Hub Select screens |
| 2 | Create Listing + Cloudinary logic | Bid submission logic | Feed + ListingDetail + CreateListing screens |
| 3 | Feed + Scam Guard logic | Seller Dashboard + push wiring | BidDashboard + MyBids screens |
| 4 | Profile logic, bug fixes | WhatsApp bridge + notification center | Profile + NotificationCenter, polish |
