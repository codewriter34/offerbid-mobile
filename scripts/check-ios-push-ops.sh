#!/usr/bin/env bash
# Validates local prerequisites for OfferBid iOS push (does not talk to Apple/Firebase/Render).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ok=0
fail=0

check() {
  local name="$1"
  shift
  if "$@"; then
    echo "OK  $name"
    ok=$((ok + 1))
  else
    echo "FAIL $name"
    fail=$((fail + 1))
  fi
}

check "GoogleService-Info.plist exists" test -f GoogleService-Info.plist
check "plist is gitignored" git check-ignore -q GoogleService-Info.plist
check "app.config references ios.googleServicesFile" grep -q "GoogleService-Info.plist" app.config.js
check "bundle id com.offerbid.app" grep -q "com.offerbid.app" app.config.js
check "expo-notifications production mode" grep -q "mode: 'production'" app.config.js
check "ios push docs present" test -f docs/ios-push-apns.md
check "ops checklist present" test -f docs/ops-ios-push-checklist.md

if [[ -f GoogleService-Info.plist ]]; then
  check "plist bundle id" grep -q "com.offerbid.app" GoogleService-Info.plist
  check "plist PROJECT_ID offerbid-59cd9" grep -q "offerbid-59cd9" GoogleService-Info.plist
fi

echo
echo "Passed: $ok  Failed: $fail"
if [[ "$fail" -gt 0 ]]; then
  echo "See docs/ops-ios-push-checklist.md for next steps."
  exit 1
fi
