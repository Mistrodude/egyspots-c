# AI Handoff — EgySpots (Read This First, Every Session)

Last updated: 2026-05-01 (session 8)

---

## What This Project Is

**EgySpots** is a mobile-first web app (Capacitor-wrapped for iOS/Android) for young Cairenes to discover and share real-time hangout spots — car meets, street carts, shisha spots, open-air hangouts, pop-ups.

Think "Snapchat Maps meets street culture." Core loop: open map → see what's live nearby → check in when you're there → post a 6-hour story.

**Firebase project:** `egyspots-dc9c1`
**GitHub:** `https://github.com/Mistrodude/egyspots-c`
**Branch:** `main`
**Local path (Mac):** `/Users/mohamedkamel/Desktop/egyspots-c`

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite | JSX only (no TypeScript in frontend). |
| Styling | Inline styles only | All styles are inline JS objects using theme tokens from `src/theme.js` via `useTheme()`. Zero CSS classes, zero Tailwind. |
| Maps | Leaflet + CARTO tiles | Free. Dark tiles: `cartocdn.com/dark_all`. Light: OpenStreetMap. No Mapbox. |
| Backend | Firebase (`egyspots-dc9c1`) | Firestore, Auth (email + Google + Apple), Storage. Spark (free) tier. |
| Mobile | Capacitor v8 | Config: `capacitor.config.json`. |
| State | React Context API | 5 contexts: `AuthContext`, `SpotsContext`, `ThemeContext`, `NotificationsContext`, `StoriesContext`. |
| Tests | Vitest + @testing-library/react | Config: `vitest.config.js`. Run from terminal: `npm test`. Cannot run inside Claude Code's bash sandbox (IPC restriction). |
| Font | Outfit (Google Fonts) | `fontFamily: 'Outfit, sans-serif'` everywhere. |
| Cloud Functions | Firebase Functions v2 | `functions/src/index.ts` — `deleteUserData` onCall function. |

**Environment variables** (in `.env` — never commit):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```
No Mapbox token needed — maps are free via Leaflet/CARTO.

---

## Spot Categories (current — do NOT use old values)

```js
export const CATEGORIES = ['All', 'Street Cart', 'Car Meet', 'Hangout', 'Pop-Up', 'Open Air'];
// Internal category values stored in Firestore:
// 'street_cart' | 'car_meet' | 'hangout' | 'pop_up' | 'open_air'
```

Old categories `'Cafe'`, `'coffee'`, `'food'`, `'Traditional'` are **removed**. Never use them.

---

## File Structure (current)

```
egyspots-c/
├── src/
│   ├── App.jsx                      # Root shell — overlay priority stack + tab routing
│   ├── main.jsx                     # Entry: ThemeProvider > AuthProvider > SpotsProvider > NotificationsProvider > StoriesProvider > App
│   ├── firebase.js                  # Firebase init; exports: auth, db, storage
│   ├── theme.js                     # DARK and LIGHT token objects
│   ├── index.css                    # Global resets + Outfit font + keyframe animations
│   │
│   ├── context/
│   │   ├── AuthContext.jsx          # Auth state + signIn/signUp/signInGoogle/signInApple/logOut/updateUserProfile/toggleSaveSpot
│   │   ├── SpotsContext.jsx         # Firestore spots listener + checkIn() + submitReport() + checkinHistory
│   │   ├── ThemeContext.jsx         # Dark/light toggle; exposes t (tokens), isDark, toggleTheme
│   │   ├── NotificationsContext.jsx # Listens to notifications/{id}; exposes unreadCount, markRead, markAllRead
│   │   └── StoriesContext.jsx       # Listens to stories where expiresAt > now; storiesBySpot map
│   │
│   ├── utils/
│   │   ├── geo.js                   # haversineMeters(a,b), CHECKIN_RADIUS_M=200, STORY_RADIUS_M=300, MIN_SPOT_DISTANCE_M=300
│   │   └── openStatus.js            # getOpenStatus(operatingHours) → {isOpen, label} | null; DEFAULT_HOURS()
│   │
│   ├── screens/
│   │   ├── ExploreScreen.jsx        # Map tab — Leaflet map + draggable bottom sheet + category pills
│   │   ├── DiscoverScreen.jsx       # Explore tab — trending/active/new spots discovery feed
│   │   ├── StoriesTab.jsx           # Stories tab — horizontal story rings + spot grid
│   │   ├── StoryViewerScreen.jsx    # Full-screen story viewer with progress bars + swipe-down to close
│   │   ├── AddStoryScreen.jsx       # Post a story — photo picker + spot selector + proximity check + notifies founder
│   │   ├── SpotDetailScreen.jsx     # Spot detail — hero, stories bar, founder, tags, gallery+lightbox, rating, report
│   │   ├── ChatScreen.jsx           # Full-screen spot chat (spots/{spotId}/messages subcollection)
│   │   ├── SearchScreen.jsx         # Search overlay with nearby/popular filters
│   │   ├── ProfileScreen.jsx        # User profile — stats, check-in history (with timestamps), stories (tap-to-view), founded spots
│   │   ├── AuthScreen.jsx           # Sign in / Sign up + Google + Apple
│   │   ├── OnboardingScreen.jsx     # 3-slide onboarding (shown once, stored in localStorage)
│   │   ├── NotificationsScreen.jsx  # In-app notifications (checkin_at_your_spot, new_story types)
│   │   ├── EditProfileScreen.jsx    # Edit profile — uploads photo to Firebase Storage; blob URL cleanup
│   │   ├── SettingsScreen.jsx       # Settings — theme, legal, delete account
│   │   ├── AddSpotScreen.jsx        # Create a new spot — GPS-locked, cover photo upload, 300m min distance
│   │   └── EditSpotScreen.jsx       # Edit spot (founders only) — all fields + operating hours editor + delete with confirm
│   │
│   ├── components/
│   │   ├── MapView.jsx              # Leaflet map — rotation gesture (150% container trick), compass button, user dot
│   │   ├── SpotCard.jsx             # Spot list card — emoji/gradient placeholder (NO external images), open/closed badge
│   │   ├── BottomNav.jsx            # 4 tabs + center FAB (3 states: check-in / checked-in / story)
│   │   ├── StoryRing.jsx            # Circular avatar with gold/grey story ring
│   │   ├── ReportModal.jsx          # Bottom sheet report modal
│   │   ├── Icons.jsx                # All SVG icons as React components
│   │   ├── Loading.jsx              # Full-screen spinner
│   │   ├── CrowdBadge.jsx           # Crowd level pill badge
│   │   └── Avatar.jsx               # Initials avatar
│   │
│   ├── data/
│   │   └── spots.js                 # SPOTS_SEED (8 spots), CATEGORIES, SPOT_TAGS, SPOT_TAG_LABELS, filterSpots()
│   │
│   └── test/
│       ├── spots.test.js
│       ├── theme.test.js
│       ├── SpotCard.test.jsx
│       ├── AuthScreen.test.jsx
│       ├── SpotsContext.test.jsx
│       └── StoriesContext.test.jsx
│
├── functions/
│   ├── src/index.ts                 # deleteUserData Cloud Function (v2 onCall)
│   ├── package.json
│   └── tsconfig.json
│
├── public/
│   ├── privacy.html
│   └── terms.html
│
├── capacitor.config.json
├── firestore.rules
├── storage.rules
├── vite.config.js
├── vitest.config.js
└── package.json
```

**Deleted:** `src/screens/CheckInModal.jsx` — removed entirely, check-in is one-tap from FAB or SpotDetailScreen button.

---

## How App.jsx Works

State-driven routing. Overlay priority order (top = highest):
1. `authOpen` → AuthScreen
2. `notifOpen` → NotificationsScreen
3. `settingsOpen` → SettingsScreen
4. `editProfileOpen` → EditProfileScreen
5. `addSpotOpen` → AddSpotScreen
6. `addStoryOpen` → AddStoryScreen (receives `defaultSpotId` prop)
7. `editSpotOpen + editSpotTarget` → EditSpotScreen
8. `storyViewerSpotId` → StoryViewerScreen
9. `chatOpen + selectedSpot` → ChatScreen
10. `searchOpen` → SearchScreen
11. `selectedSpot` → SpotDetailScreen
12. Tabs: `'map'` | `'explore'` | `'stories'` | `'profile'`

**Proximity-based FAB:**
- `watchPosition` (enableHighAccuracy: true) continuously tracks GPS → `userPos`
- `haversineMeters` finds nearest spot; if ≤ 200m → `nearbySpot`
- `handleFAB` (async): if `nearbySpot` → `await checkIn(nearbySpot.id)` → shows cooldown toast or "Checked in" toast; else → opens AddStoryScreen
- **Auto-checkout**: `useEffect` watching `nearbySpot + userPos` calls `checkIn(checkedInId)` when user walks away
- **Cooldown toast**: if `checkIn` returns `{ error: 'cooldown', minutesLeft }`, FAB shows `"Wait X min — checked in recently"`

**`addStoryDefaultId`** — set to `selectedSpot.id` when user taps "+" in SpotDetailScreen, so AddStoryScreen pre-selects the right spot.

**`onStoryViewer`** — ProfileScreen receives `(spotId) => setStoryViewerSpotId(spotId)` so story cards in the Stories tab open the correct spot's viewer.

---

## Bottom Nav (5-element layout)

```
[ Map ] [ Explore ] [ FAB ] [ Stories ] [ Profile ]
```
- FAB = center raised button — **3 states**:
  - **Green checkmark "Check In"** — near a spot, not yet checked in
  - **Purple checkmark "Here ✓"** — near a spot AND already checked in there
  - **Purple plus "Story"** — not near any spot
- Toast banner slides up above BottomNav for 2.5s after FAB check-in

---

## Bottom Sheet (ExploreScreen)

Fully draggable via touch — `handleRef` + non-passive `touchmove` listener. Snaps to open (88%) or closed (210px peek) based on direction + velocity. Short tap toggles.

---

## Stories Feature

- Stored in Firestore `stories` collection; `expiresAt` field = 6 hours from creation
- Firestore TTL policy on `expiresAt` auto-deletes expired docs (configure in Console)
- `storiesBySpot` map in StoriesContext: keyed by `spotId`
- Posting a story requires being within 300m (`STORY_RADIUS_M`)
- After posting, notifies spot founder via `notifications` collection (type: `new_story`)
- ChatScreen shows real stories bar from `storiesBySpot[spot.id]`

---

## Spot Photos — IMPORTANT

**No external image URLs.** SpotCard uses `spot.coverPhotoURL` if set; otherwise shows a gradient + emoji placeholder:
```js
const CATEGORY_EMOJI = { hangout: '☕', car_meet: '🚗', street_cart: '🍔', pop_up: '🎪', open_air: '🌿' };
```
**Do NOT restore picsum.photos** — it crashes WKWebView on iOS (cross-origin network request to external domain).

SpotDetailScreen has a **photo gallery strip** (`spot.photoURLs[]`) with tap-to-fullscreen lightbox. Founders can upload additional photos (uploaded to `spots/{id}/photos/{timestamp}.jpg` in Storage, appended via `arrayUnion` to `spot.photoURLs` in Firestore).

---

## Open/Closed Indicator

`src/utils/openStatus.js` exports:
```js
getOpenStatus(operatingHours)
// Returns { isOpen: bool, label: string } or null if no hours data
// label examples: 'Open Now', 'Closes 10PM', 'Opens 9AM', 'Closed today'
```
Used in SpotCard (small colored label below neighborhood) and SpotDetailScreen hero (pill badge next to spot name).

---

## Rating System

Users can submit 1–5 star ratings from SpotDetailScreen. Stored in `spots/{spotId}/ratings/{userId}` subcollection.

On submit, a **Firestore transaction** atomically:
1. Reads the user's existing rating doc
2. Reads the spot's `ratingSum` + `ratingCount`
3. Adjusts sum (replacing old rating if exists, incrementing count if new)
4. Writes new `spot.rating = ratingSum / ratingCount` (1 decimal place)

User's existing rating is loaded on mount. Changing rating correctly updates the running average.

---

## Check-in Spam Guard

`SpotsContext.checkIn()` — before any optimistic update:
- `CHECKIN_COOLDOWN_MINUTES = 5`
- If user checked in to the same spot within 5 minutes → returns `{ error: 'cooldown', minutesLeft }`
- Cooldown applies only to NEW check-ins (`!isLeaving`) — auto-checkout (leaving) is never blocked
- App.jsx FAB handler shows toast: `"Wait X min — checked in recently"`

---

## Firestore Seed Migration

`SpotsContext` runs `syncSeeds()` on every app start:
- If `spots` collection is **empty** → batch-creates all SPOTS_SEED docs
- If spots **exist** → back-fills missing `description` / `operatingHours` on seed docs only (idempotent, uses writeBatch)

---

## Map Rotation (MapView)

Two-finger twist gesture rotates the map. Implementation:
- **Container size**: `position: absolute; width: 150%; height: 150%; top: -25%; left: -25%` — oversized so corners never reveal background at any rotation angle
- **Snap-back removed**: bearing is preserved when fingers lift (`onEnd` only clears the gesture ref, does not reset rotation)
- **Compass button**: sits in a `pointer-events: none` overlay div; button itself has `pointer-events: auto` — prevents Leaflet's rotated layers from intercepting taps
- **Reset north**: compass button resets bearing to 0 with CSS transition

---

## Firebase Auth — Capacitor / WKWebView Notes

**`src/firebase.js`** — uses `initializeAuth` with `inMemoryPersistence`:
```js
export const auth = initializeAuth(app, { persistence: inMemoryPersistence });
```
**Do NOT switch to `getAuth()`** — it starts IndexedDB immediately, which silently hangs WKWebView on iOS.
Tradeoff: users must re-login each app open (no session persistence).

**`src/context/AuthContext.jsx`** — 3-second fallback timeout on `onAuthStateChanged`.

**`src/context/SpotsContext.jsx`** — `loading` starts as `false`; `SPOTS_SEED` pre-populates immediately.

---

## Firestore Collections (current schema)

**`spots/{spotId}`**
```js
{ id, name, nameAr, category, tags, neighborhood, address, city,
  founderId, founderName, isMobile, crowd, crowdPct,
  checkins, checkinsToday, weeklyCheckins, totalCheckins,
  rating, ratingSum, ratingCount,          // ratingSum/ratingCount added by rating system
  operatingHours,                           // { monday: {open, close, closed}, ... }
  coverPhotoURL, photoURLs: [],             // photoURLs = additional gallery photos
  lat, lng, status, createdAt }
```

**`spots/{spotId}/messages/{messageId}`**
```js
{ text, userId, userName, userAvatar, createdAt }
```

**`spots/{spotId}/ratings/{userId}`**
```js
{ rating, userId, timestamp }
```

**`users/{uid}`**
```js
{ uid, email, displayName, username, profilePhotoURL, bio, city,
  role: 'user', totalCheckins, activeCheckin, savedSpots: [],
  notifSettings: { newSpots, checkIns, stories, systemAlerts },
  createdAt }
```

**`stories/{storyId}`**
```js
{ spotId, userId, userName, userPhotoURL, photoURL, caption,
  createdAt, expiresAt, viewCount, viewedBy: [] }
```

**`checkins/{checkinId}`**
```js
{ userId, username, userPhotoURL, spotId, spotName, ownerId,
  note, photoURL, rating, isAnonymous, location, timestamp }
```

**`reports/{reportId}`**
```js
{ reportedBy, targetType, targetId, reason, reasonNote, status: 'open', createdAt }
```

**`notifications/{notifId}`**
```js
{ toUserId, type, title, body, data: { spotId }, isRead: false, createdAt }
// types: 'checkin_at_your_spot' | 'new_story'
```

---

## EditSpotScreen (founders only)

Editable fields: name, nameAr, description, category, address, tags, cover photo, operating hours (Mon–Sun open/close toggles with time inputs).

**Delete spot**: "Delete This Spot" button → confirmation card → `deleteDoc(doc(db, 'spots', spot.id))` → `onBack()`.

Saved to Firestore via `updateDoc` including `operatingHours` object.

---

## Auth — Sign in with Apple

Required by App Store. Uses `OAuthProvider('apple.com')` with dynamic import. Must be enabled in Firebase Console → Auth → Sign-in providers. Requires Apple Developer Program ($99/year) with Services ID configured.

---

## Safe-Area Pattern

All screens use spacer div (not padding) for iOS notch:
```jsx
<div style={{ height: 'env(safe-area-inset-top, 44px)' }} />   // in header
<div style={{ height: 'env(safe-area-inset-top, 0px)' }} />    // in non-header contexts
```
**Never** use `calc()` in padding for safe area — it doesn't work reliably in WKWebView.

---

## Dev Server — GPS on Mobile

GPS is blocked by Chrome over plain HTTP (except localhost). Current setup is plain HTTP (basicSsl reverted).

```bash
npm run dev   # starts http://0.0.0.0:5173
```

To test GPS from a phone on same Wi-Fi: install `@vitejs/plugin-basic-ssl` (`npm i -D @vitejs/plugin-basic-ssl`) and add it back to `vite.config.js`. Note: `@vitejs/plugin-basic-ssl` was removed from `package.json` in session 8 (it conflicted with Vitest upgrade). Re-install it when needed for GPS testing, but don't keep it in devDependencies permanently.

Mac IP: `ipconfig getifaddr en0` (Wi-Fi) or `en1`.

---

## Pending Deployment Steps (manual — not done yet)

1. **Enable Apple Sign-in** in Firebase Console → Auth → Sign-in providers
2. ~~**Deploy Firestore rules**~~ ✅ Done 2026-05-01 — `firestore.rules` is live on `egyspots-dc9c1`
3. **Deploy Storage rules** — first enable Firebase Storage: go to Firebase Console → Storage → Get Started, then run `firebase deploy --only storage`. The `storage.rules` file and `firebase.json` storage entry are already configured.
4. **Deploy Cloud Functions**: `cd functions && npm install && cd .. && firebase deploy --only functions`
5. **Set Firestore TTL** on `stories.expiresAt` — Firebase Console → Firestore → TTL policies → Collection: `stories`, field: `expiresAt`
6. **Deploy hosting**: `firebase deploy --only hosting`
7. **Add iOS/Android**: `npx cap add ios && npx cap add android && npx cap sync`

**Xcode**: always **Cmd+Shift+K** (clean build) after `npm run build && npx cap sync ios`.

---

## What's NOT Done (requires infrastructure)

1. **Daily/weekly counter reset** — `checkinsToday` / `weeklyCheckins` only ever increment. Needs a scheduled Firebase Cloud Function (cron) to zero them at midnight/week boundary.
2. **Push notifications** — needs `@capacitor-firebase/messaging` native plugin + APNs cert + Cloud Function to fan-out messages. Cannot be done in web code alone.

---

## Test Suite

Run `npm test` **from your own terminal** (not through Claude Code — its bash sandbox blocks inter-process communication that Vitest requires for worker threads).

**Test environment:** Node.js v24.4.1 + Vitest 4.1.5. Vitest 1.x was incompatible with Node v24 (worker IPC broken); upgraded in session 8.

**Config:** `vitest.config.js` uses `vitest/config`, `@vitejs/plugin-react`, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.js']`.

**Setup file:** `src/test/setup.js` imports `@testing-library/jest-dom/vitest` (NOT the bare `@testing-library/jest-dom` — the default entry assumes a global `expect` and hangs).

**AuthScreen submit button selector** (used in 4 tests — do NOT change):
```js
screen.getAllByRole('button').find(
  (btn) => btn.textContent === 'Sign In' && btn.style.borderRadius === '16px'
)
```

---

## Geo / Proximity

`src/utils/geo.js`:
```js
haversineMeters(a, b)       // { lat, lng } objects → meters
CHECKIN_RADIUS_M   = 200    // within 200m to check in
STORY_RADIUS_M     = 300    // within 300m to post a story
MIN_SPOT_DISTANCE_M = 300   // new spots must be ≥300m from any existing spot
```

---

## Change Log

### 2026-05-01 (session 8) — iOS crash fix, Firestore deploy, Vitest upgrade

**iOS — camera permission crash fixed:**
- Added `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` to `ios/App/App/Info.plist`
- Without these keys the app hard-crashed on iOS the moment any camera/gallery picker was triggered
- After adding: iOS shows the standard system permission prompt instead of crashing
- **Must rebuild in Xcode** (Cmd+R) after this change — Info.plist is native, not web

**Firestore rules — deployed to production:**
- `firebase deploy --only firestore:rules` succeeded — all the security rule fixes from session 7 are now live
- The "Missing or insufficient permissions" warning in iOS logs should be gone

**Storage rules — configured but not yet deployed:**
- `firebase.json` now has a `"storage"` entry pointing to `storage.rules`
- Cannot deploy until Firebase Storage is enabled: Firebase Console → Storage → Get Started
- Then run: `firebase deploy --only storage`

**Vitest upgraded 1.6.1 → 4.1.5:**
- Node.js v24.4.1 (running on this machine) breaks Vitest 1.x worker thread IPC
- Vitest 4.1.5 is compatible with Node v24
- `@vitejs/plugin-basic-ssl` removed from `package.json` (was blocking the upgrade due to peer dep conflict requiring Vite 6+; it's no longer used since the HTTPS dev server was reverted)

**Test setup fixed:**
- `src/test/setup.js`: changed from `import '@testing-library/jest-dom'` → `import '@testing-library/jest-dom/vitest'`
- The default entry assumed a global `expect` and hung when the test environment loaded

**`vitest.config.js` — clean state:**
- Uses `defineConfig` from `vitest/config` (not `vite`)
- Includes `@vitejs/plugin-react` plugin (needed for JSX transform in tests)
- `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.js']`
- No `globals: true` (test files explicitly import from 'vitest')

**Note on running tests via Claude Code:**
- Tests cannot be run through Claude Code's bash environment — the sandbox blocks IPC between Vitest's main process and worker threads
- Run `npm test` directly in your Mac terminal; it will work there

---

### 2026-04-30 (sessions 6–7) — Feature completion: all frontend items done

**New utility:**
- `src/utils/openStatus.js` — `getOpenStatus(operatingHours)` computes open/closed status from current day+time. Returns `{ isOpen, label }` or `null`. `DEFAULT_HOURS()` generates a full Mon–Sun open schedule.

**SpotDetailScreen — major additions:**
- **Open/closed badge** in hero next to spot name (green "Open Now" / red "Opens 9AM" / "Closed today")
- **Photo gallery strip** — horizontal scroll of `spot.photoURLs[]`; each photo tappable for fullscreen lightbox. Founders see "+ Add Photo" tile that uploads to Storage and appends via `arrayUnion`.
- **Photo lightbox** — `position: fixed` fullscreen dark overlay; tap outside or ✕ to dismiss.
- **Star rating UI** — 5 tappable stars below Operating Hours; stars highlight on hover; rating saved to `spots/{id}/ratings/{uid}` subcollection via Firestore transaction; running average written back to `spot.rating` / `spot.ratingSum` / `spot.ratingCount` atomically. User's previous rating loaded on mount; changing it correctly adjusts the average.
- Added `useRef` for photo file input; imported `arrayUnion`, `runTransaction`, `setDoc`, `getDoc`, `serverTimestamp` from Firestore; imported storage/Storage utils.

**SpotCard:**
- Removed all `picsum.photos` dependencies (caused WKWebView crashes on iOS)
- Added `CATEGORY_EMOJI` map; cover area shows gradient + emoji when no `coverPhotoURL`
- Added `getOpenStatus` — shows green/red open status label below neighborhood

**EditSpotScreen (new file):**
- Full editing: name, nameAr, description, category, address, tags, cover photo upload
- **Operating hours editor** — Mon–Sun rows with Open/Closed toggle + `<input type="time">` for open/close times; saved to `operatingHours` in Firestore
- **Delete spot** — "Delete This Spot" button → confirmation UI → `deleteDoc` → `onBack()`
- Blob URL cleanup via `useRef` + `useEffect`

**SpotsContext:**
- `syncSeeds()` replaces `seedIfEmpty` — back-fills `description`/`operatingHours` on existing seed docs (idempotent writeBatch)
- `CHECKIN_COOLDOWN_MINUTES = 5` (was 30)
- Spam guard runs **before** optimistic state update; returns `{ error: 'cooldown', minutesLeft }`
- After new check-in: notifies spot founder via `notifications` collection (fire-and-forget)

**App.jsx:**
- `handleFAB` is now `async`; awaits `checkIn()` result; shows cooldown toast
- Added `editSpotOpen` / `editSpotTarget` state + EditSpotScreen overlay
- Added `addStoryDefaultId` state; passed to AddStoryScreen as `defaultSpotId`
- ProfileScreen receives `onStoryViewer={(spotId) => setStoryViewerSpotId(spotId)}`
- SpotDetailScreen receives `onAddStory`, `onEditSpot` (only when `user.uid === spot.founderId`)
- GPS: `enableHighAccuracy: true, maximumAge: 10000, timeout: 15000`

**ProfileScreen:**
- Check-in history cards show timestamp: "28 Apr · 11:42 PM"
- Stories tab cards are now tappable — calls `onStoryViewer(s.spotId)` to open StoryViewerScreen

**AddStoryScreen:**
- After posting: notifies spot founder via `notifications` collection (type: `new_story`, fire-and-forget)

**ChatScreen:**
- Removed mock stories import; now uses real `storiesBySpot[spot.id]` from StoriesContext
- Stories bar shows real seen/unseen ring state
- Empty state: "No messages yet — be the first to say something!"

**StoriesContext:**
- `MOCK_STORIES_LIVE` and `seedDemoStories`: `photoURL: null` (removed picsum.photos URLs)

**MapView:**
- Map container: `position: absolute; width: 150%; height: 150%; top: -25%; left: -25%` — prevents corner clipping at any rotation angle
- Compass button: wrapped in `pointer-events: none` overlay div; button itself has `pointer-events: auto`
- Snap-back removed: bearing preserved when fingers lift

**Safe-area fixes applied to:** StoryViewerScreen, NotificationsScreen, EditProfileScreen, DiscoverScreen, ProfileScreen, AddSpotScreen, EditSpotScreen, ChatScreen.

**DiscoverScreen:**
- Trending section: sorted by composite score (`weeklyCheckins + crowdPct*2 + rating*10`)
- "Featured Vendors" section hidden when `featured.length === 0`

**CheckInModal.jsx — DELETED.** One-tap check-in is handled entirely by FAB (App.jsx) and SpotDetailScreen button.

---

### 2026-04-29 (session 5b) — Map rotation, location, all remaining priority fixes

- **Map starts at user location instantly** — `hasSetInitialRef`: first call uses `map.setView()` (no animation)
- **Map rotation** — two-finger twist gesture; compass needle when rotated; tap to reset north
- **Error boundary** — `ErrorBoundary` in `main.jsx`; uncaught crashes show "Reload App" button
- **Heart / save spot** — `toggleSaveSpot(spotId)` in AuthContext; heart turns red when saved
- **Check-in history refresh** — `checkIn()` prepends new check-in to `checkinHistory` immediately
- **Email verification UI** — "Check your email" message after sign-up
- **Blob URL leak fixed** — AddStoryScreen revokes URLs on cleanup + before new pick

### 2026-04-29 (session 5) — Check-in proximity, real distances, search filters, theme persistence

- **FAB 3-state**: green check-in / purple checked-in / purple story
- **SpotDetailScreen**: real distance from GPS; proximity-enforced check-in button
- **ExploreScreen**: spot list sorted by distance; live distance strings
- **SearchScreen**: rewritten with proper safe-area; nearby/popular filters use real GPS
- **ThemeContext**: dark/light persisted to `localStorage`
- **AddSpotScreen**: 300m min-distance enforcement

### 2026-04-27 (session 4) — Mac migration + iOS loading screen fix

- `initializeAuth` + `inMemoryPersistence` to fix WKWebView hang
- 3-second `onAuthStateChanged` fallback timeout
- `SpotsContext loading` starts as `false`

### 2026-04-25 (session 3) — Bug fixes + UX polish

- Bottom sheet rewritten with React state + CSS transitions
- One-tap check-in FAB (no modal)
- Auto-checkout when user walks away
- Chat moved to `spots/{spotId}/messages` subcollection
- Profile photo upload to Firebase Storage

### 2026-04-25 (sessions 1–2) — Full pivot: vendor/café → youth hangout + stories

- New categories, Stories feature, Sign in with Apple, Cloud Functions, Firestore/Storage rules, proximity FAB, AddSpotScreen, 49/49 tests
