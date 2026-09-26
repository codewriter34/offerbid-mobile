# App Store resubmit — 1.0 after rejection (build 6)

Apple rejected 1.0 (6) for Guideline 1.2 (UGC), 2.3.6 (age rating), and 5.1.1 (WhatsApp required + no in-app deletion). Code for optional WhatsApp, Terms before sign-in, report, block, and account deletion is in this app, the web client, and the API.

## You must do in App Store Connect

1. **Age Rating → User-Generated Content = Yes**  
   App Information → Age Ratings. This is not a code change.

2. **Deploy the API first**  
   Production must run the Prisma migration `20260926180000_optional_phone_user_blocks` so register without WhatsApp, `UserBlock`, and feed filtering work. Then ship a **new iOS build (7 or higher)** and attach it to the rejected version (or a new 1.0.x).

3. **Review Notes — attach physical-device screen recordings** of:
   - Sign-in: required Terms + Privacy checkbox, links open `https://offerbid.co/terms` and `https://offerbid.co/privacy`
   - Listing detail: **Report listing** and **Block seller** (blocked sellers disappear from the feed; a report is created for OfferBid)
   - Profile: **Delete account** (two confirms, then signed out)

4. **Demo account** (if still requested):  
   `tamehpaul2+applereview@gmail.com` / `AppleReview2026!`  
   WhatsApp is optional. Reviewers can skip it at sign-up and add it later in Profile.

## Suggested Review Notes text

OfferBid is a local marketplace with user listings and offers.

WhatsApp is optional. Accounts can be created without a phone number. Users add WhatsApp in Profile, or when they accept a deal and want WhatsApp handoff.

Account deletion is in Profile → Delete account. It calls DELETE /users/me and removes the account.

UGC safety: users must agree to Terms of Service and Privacy Policy before sign-in (checkbox + tappable links). Any signed-in user can Report a listing and Block a seller. Blocking hides that seller from the feed immediately and notifies us for review.

Age Rating: User-Generated Content is set to Yes.

Recordings of terms, report, block, and delete-account are attached.
