# AI Handoff — EgySpots (Read This First, Every Session)

Last updated: 2026-04-25

---

## What This Project Is

**EgySpots** is a mobile-first web app (Capacitor-wrapped for iOS/Android) for young Cairenes to discover and share real-time hangout spots — car meets, street carts, shisha spots, open-air hangouts, pop-ups.

Think "Snapchat Maps meets street culture." Core loop: open map → see what's live nearby → check in when you're there → post a 6-hour story.

**Firebase project:** `egyspots-dc9c1`
**GitHub:** `https://github.com/Mistrodude/egyspots-c`
**Branch:** `main`
**Local path:** `c:\Users\Excellent Store\OneDrive\Desktop\projects\egyspots claud\`

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite | JSX only (no TypeScript in frontend). |
| Styling | Inline styles only | All styles are inline JS objects using theme tokens from `src/theme.js` via `useTheme()`. Zero CSS classes, zero Tailwind. |
| Maps | Leaflet + CARTO tiles | Free. Dark tiles: `cartocdn.com/dark_all`. Light: OpenStreetMap. No Mapbox. |
| Backend | Firebase (`egyspots-dc9c1`) | Firestore, Auth (email + Google + Apple), Storage. Spark (free) tier. |
| Mobile | Capacitor v8 | Config: `capacitor.config.js` (CommonJS, NOT TypeScript). |
| State | React Context API | 5 contexts: `AuthContext`, `SpotsContext`, `ThemeContext`, `NotificationsContext`, `StoriesContext`. |
| Tests | Vitest + @testing-library/react | 49/49 passing. Config: `vitest.config.js`. |
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
egyspots claud/
├── src/
│   ├── App.jsx                      # Root shell — overlay priority stack + tab routing
│   ├── main.jsx                     # Entry: ThemeProvider > AuthProvider > SpotsProvider > NotificationsProvider > StoriesProvider > App
│   ├── firebase.js                  # Firebase init; exports: auth, db, storage
│   ├── theme.js                     # DARK and LIGHT token objects
│   ├── index.css                    # Global resets + Outfit font + keyframe animations
│   │
│   ├── context/
│   │   ├── AuthContext.jsx          # Auth state + signIn/signUp/signInGoogle/signInApple/logOut/updateUserProfile
│   │   ├── SpotsContext.jsx         # Firestore spots listener + checkIn() + submitReport() + checkinHistory
│   │   ├── ThemeContext.jsx         # Dark/light toggle; exposes t (tokens), isDark, toggleTheme
│   │   ├── NotificationsContext.jsx # Listens to notifications/{id}; exposes unreadCount, markRead, markAllRead
│   │   └── StoriesContext.jsx       # Listens to stories where expiresAt > now; MOCK_STORIES_LIVE as initial state
│   │
│   ├── utils/
│   │   └── geo.js                   # haversineMeters(a,b), CHECKIN_RADIUS_M=200, STORY_RADIUS_M=300
│   │
│   ├── screens/
│   │   ├── ExploreScreen.jsx        # Map tab — Leaflet map + draggable bottom sheet + category pills
│   │   ├── DiscoverScreen.jsx       # Explore tab — trending/active/new spots discovery feed
│   │   ├── StoriesTab.jsx           # Stories tab — horizontal story rings + spot grid
│   │   ├── StoryViewerScreen.jsx    # Full-screen story viewer with progress bars
│   │   ├── AddStoryScreen.jsx       # Post a story — photo picker + spot selector + proximity check
│   │   ├── SpotDetailScreen.jsx     # Spot detail — hero, stories bar, founder, tags, report modal
│   │   ├── ChatScreen.jsx           # Full-screen spot chat (spots/{spotId}/messages subcollection)
│   │   ├── SearchScreen.jsx         # Search overlay
│   │   ├── ProfileScreen.jsx        # User profile — real stats, stories tab, check-in history
│   │   ├── AuthScreen.jsx           # Sign in / Sign up + Google + Apple
│   │   ├── OnboardingScreen.jsx     # 3-slide onboarding (shown once, stored in localStorage)
│   │   ├── CheckInModal.jsx         # Multi-step check-in modal (used from SpotDetailScreen only)
│   │   ├── NotificationsScreen.jsx  # In-app notifications
│   │   ├── EditProfileScreen.jsx    # Edit profile — uploads photo to Firebase Storage
│   │   ├── SettingsScreen.jsx       # Settings — theme, legal, delete account
│   │   └── AddSpotScreen.jsx        # Create a new spot — GPS-locked, pins at user location
│   │
│   ├── components/
│   │   ├── MapView.jsx              # Leaflet map — dark bg, spot markers, story rings, user dot
│   │   ├── SpotCard.jsx             # Spot list card — Picsum photo fallback + category color fallback
│   │   ├── BottomNav.jsx            # 4 tabs + center FAB (green checkmark = near spot, purple plus = story)
│   │   ├── StoryRing.jsx            # Circular avatar with gold/grey story ring
│   │   ├── ReportModal.jsx          # Bottom sheet report modal
│   │   ├── Icons.jsx                # All SVG icons as React components
│   │   ├── Loading.jsx              # Full-screen spinner
│   │   └── Avatar.jsx               # Initials avatar
│   │
│   ├── data/
│   │   └── spots.js                 # SPOTS_SEED (8 spots), CATEGORIES, SPOT_TAGS, SPOT_TAG_LABELS, filterSpots()
│   │
│   └── test/
│       ├── spots.test.js            # 10 tests — new categories/tags/seed schema
│       ├── theme.test.js            # 7 tests — DARK/LIGHT token completeness
│       ├── SpotCard.test.jsx        # 7 tests — renders name/neighborhood/distance/rating/badge
│       ├── AuthScreen.test.jsx      # 10 tests — sign in/up flow + Apple button
│       ├── SpotsContext.test.jsx    # 11 tests — checkIn toggle + SPOTS_SEED integrity + Firestore payload
│       └── StoriesContext.test.jsx  # 4 tests — story expiry filtering logic
│
├── functions/
│   ├── src/index.ts                 # deleteUserData Cloud Function (v2 onCall)
│   ├── package.json                 # firebase-admin ^12, firebase-functions ^5, Node 20
│   └── tsconfig.json
│
├── public/
│   ├── privacy.html                 # Privacy policy (Egypt Law 151, Firestore TTL, GDPR)
│   └── terms.html                   # Terms of service
│
├── capacitor.config.js              # CommonJS — appId: com.egyspots.app
├── firestore.rules                  # Security rules — messages are subcollection under spots/{spotId}/messages
├── storage.rules                    # Storage rules (deploy: firebase deploy --only storage)
├── vite.config.js                   # HTTPS dev server (basicSsl plugin) — host: true, port 5173
├── vitest.config.js                 # jsdom environment
└── package.json                     # Scripts: dev, build, test, preview
```

---

## How App.jsx Works

State-driven routing. Overlay priority order (top = highest):
1. `authOpen` → AuthScreen
2. `notifOpen` → NotificationsScreen
3. `settingsOpen` → SettingsScreen
4. `editProfileOpen` → EditProfileScreen
5. `addSpotOpen` → AddSpotScreen
6. `addStoryOpen` → AddStoryScreen
7. `storyViewerSpotId` → StoryViewerScreen
8. `checkInSpot` → CheckInModal (only used from SpotDetailScreen)
9. `chatOpen + selectedSpot` → ChatScreen
10. `searchOpen` → SearchScreen
11. `selectedSpot` → SpotDetailScreen
12. Tabs: `'map'` | `'explore'` | `'stories'` | `'profile'`

**Proximity-based FAB (one-tap check-in):**
- `watchPosition` continuously tracks user GPS → `userPos` state
- `haversineMeters` computes distance to all spots every time `userPos` or `spots` changes
- If nearest spot ≤ 200m → `nearbySpot` state is set
- `handleFAB`: if `nearbySpot` → calls `checkIn(nearbySpot.id)` directly (no modal); else → opens AddStoryScreen
- `checkIn` toggles: if already checked in to the same spot, it checks out instead
- **Auto-checkout**: a `useEffect` watching `nearbySpot` + `userPos` calls `checkIn(checkedInId)` when the user walks away from their checked-in spot
- `nearbySpot` passed to both BottomNav instances — FAB turns green with checkmark + "Check In" label

**`checkIn` and `checkedInId`** are destructured from `useSpots()` in App.jsx — do not remove them.

---

## Bottom Nav (5-element layout)

```
[ Map ] [ Explore ] [ FAB ] [ Stories ] [ Profile ]
```
- FAB = center raised button. **Green + checkmark = near a spot (one-tap check-in/out). Purple + plus = not near (post story).**
- Stories tab has unviewedCount badge (red dot)
- Profile tab has unreadCount badge from NotificationsContext

---

## Bottom Sheet (ExploreScreen)

The spot list bottom sheet is **fully draggable via touch**:
- `handleRef` registered with a non-passive `touchmove` listener (prevents page scroll during drag)
- `onTouchStart` on the handle records start Y + timestamp
- `onTouchEnd` snaps to open (88% height) or closed (210px peek) based on direction + velocity
- Short tap (< 8px movement) toggles open/close
- `onClick` on the handle also toggles (for desktop/mouse)
- Sheet height is React state (`sheetOpen ? '88%' : 210`) with CSS transition — no direct DOM manipulation
- List `overflowY: 'auto'` always; sheet height clips the content

---

## Stories Feature

- Stored in Firestore `stories` collection with `expiresAt` field (6 hours from creation)
- Firestore TTL policy on `expiresAt` auto-deletes expired docs (must be configured in Console)
- StoriesContext: `MOCK_STORIES_LIVE` (4 demo stories) is the **initial React state** so Stories tab is never empty
- `onSnapshot` falls back to `MOCK_STORIES_LIVE` if Firestore returns 0 docs
- Story ring appears on map markers when `storiesBySpot[spot.id]?.length > 0`
- Posting a story requires being within 300m of the selected spot (`STORY_RADIUS_M`)

---

## Spot Photos

`SpotCard` uses `spot.coverPhotoURL` if set, otherwise falls back to:
```js
`https://picsum.photos/seed/${spot.id}/200/150`
```
This gives each spot a consistent placeholder image based on its ID. Real photos are stored in Firebase Storage and saved to `spots/{id}.coverPhotoURL` in Firestore.

Spot color: uses `spot.color` if set; otherwise derived from category via `CATEGORY_COLORS` map in SpotCard:
```js
{ hangout: '#A78BFA', car_meet: '#F59E0B', street_cart: '#10B981', pop_up: '#EC4899', open_air: '#3B82F6' }
```

---

## Firestore Collections (current schema)

**`spots/{spotId}`** — seeded from SPOTS_SEED on first load
```js
{ id, name, nameAr, category, tags, neighborhood, address, city,
  founderId, founderName, isMobile, crowd, crowdPct,
  checkins, checkinsToday, weeklyCheckins, totalCheckins,
  rating, operatingHours, lat, lng, status, createdAt }
```

**`spots/{spotId}/messages/{messageId}`** — subcollection (NOT a top-level collection)
```js
{ text, userId, userName, userAvatar, createdAt }
```

**`users/{uid}`**
```js
{ uid, email, displayName, username, profilePhotoURL, bio, city,
  role: 'user', totalCheckins, activeCheckin,
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
{ toUserId, type, title, body, data, read: false, createdAt }
```

---

## Auth — Sign in with Apple

Required by App Store when any third-party OAuth is present. Uses `OAuthProvider('apple.com')` with dynamic import to avoid static import issues.

Apple must be enabled in: Firebase Console → Auth → Sign-in providers → Apple.
Also requires Apple Developer Program account ($99/year) with Services ID configured.

---

## Test Suite — Critical Notes

Run: `npm test` — should output **49/49 passing**.

**AuthScreen submit button selector** (used in 4 tests — do NOT change):
```js
screen.getAllByRole('button').find(
  (btn) => btn.textContent === 'Sign In' && btn.style.borderRadius === '16px'
)
```
The tab toggle buttons also say "Sign In"/"Sign Up" but have `borderRadius: 12px`. Never change submit button's `borderRadius` without updating tests.

---

## Geo / Proximity

File: `src/utils/geo.js`
```js
haversineMeters(a, b)   // { lat, lng } objects → distance in meters
CHECKIN_RADIUS_M = 200  // must be within 200m to trigger check-in FAB
STORY_RADIUS_M   = 300  // must be within 300m to post a story
```

---

## Dev Server — HTTPS Required for GPS on Mobile

GPS (`navigator.geolocation`) is **blocked by Chrome on Android over plain HTTP** (except localhost).
The dev server now runs HTTPS via `@vitejs/plugin-basic-ssl`.

```bash
npm run dev   # starts https://0.0.0.0:5173
```

On another device (same Wi-Fi):
1. Find your laptop IP: run `ipconfig`, look for Wi-Fi IPv4 address (e.g. `192.168.1.42`)
2. Open `https://192.168.1.42:5173` on the phone
3. Accept the browser's "not secure" warning for the self-signed cert
4. GPS will now work

Windows Firewall must allow port 5173 inbound:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

---

## Pending Deployment Steps (manual — not done yet)

1. **Enable Apple Sign-in** in Firebase Console → Auth → Sign-in providers
2. **Deploy Firestore rules**: `firebase deploy --only firestore:rules`
3. **Deploy Storage rules**: `firebase deploy --only storage`
4. **Deploy Cloud Functions**: `cd functions && npm install && cd .. && firebase deploy --only functions`
5. **Set Firestore TTL** on `stories.expiresAt` — Firebase Console → Firestore → TTL policies → Add policy → Collection: `stories`, field: `expiresAt`
6. **Deploy hosting** (privacy + terms pages): `firebase deploy --only hosting`
7. **Add iOS/Android**: `npx cap add ios && npx cap add android && npx cap sync`

---

## Change Log

### 2026-04-25 (session 3) — Bug fixes + UX polish

**Fixed:**
- **Stories tab crash**: `handleStoryFAB` (undefined) replaced with inline arrow function in `case 'stories'`
- **Bottom sheet**: Replaced DOM-manipulation approach with clean React-state + CSS transition implementation. `handleRef` for non-passive touchmove, snap-on-release with velocity detection, `onClick` for desktop
- **Spot photos**: SpotCard now shows Picsum placeholder (`picsum.photos/seed/{id}/200/150`) when `coverPhotoURL` is empty; category-based color fallback when `spot.color` is unset
- **One-tap check-in**: FAB now calls `checkIn(nearbySpot.id)` directly — no modal steps
- **Auto-checkout**: `useEffect` in App.jsx watches `nearbySpot + userPos` and auto-calls `checkIn(checkedInId)` when user walks away from their checked-in spot
- **GPS on mobile**: Added `@vitejs/plugin-basic-ssl` — dev server now runs HTTPS so Chrome on Android grants geolocation permission
- **Chat path**: Messages moved to `spots/{spotId}/messages` subcollection (was flat `messages` collection)
- **Firestore rules**: Messages rule nested inside `match /spots/{spotId}` as proper subcollection
- **Profile photo upload**: EditProfileScreen uploads `blob:` URLs to Firebase Storage `users/{uid}/profile.jpg`
- **StoriesContext**: `MOCK_STORIES_LIVE` as initial state; fallback when Firestore returns empty

### 2026-04-25 (session 2) — Maat launch prep

- ExploreScreen draggable bottom sheet (DOM manipulation approach — later replaced in session 3)
- AddSpotScreen GPS locking + status banner + user coordinates for new spots
- App.jsx: userPos passed to AddSpotScreen; continuous GPS watchPosition
- CheckInModal GPS error message: "Habibi, we need your GPS..."

### 2026-04-25 (session 1) — Full App Pivot: Vendor/café → Youth Hangout + Stories

**Removed:** All vendor/subscription/Paymob code. VendorsScreen, VendorProfileScreen, VendorDashboardScreen deleted.

**Added:**
- New categories: Street Cart / Car Meet / Hangout / Pop-Up / Open Air
- Stories feature: StoriesContext, StoriesTab, StoryViewerScreen, AddStoryScreen, StoryRing, ReportModal
- Sign in with Apple (App Store compliance)
- Cloud Function for account deletion (`functions/src/index.ts`)
- Firestore + Storage security rules rewritten
- `public/privacy.html` + `public/terms.html` (Egypt Law 151)
- Proximity-based FAB: GPS watchPosition → FAB turns green "Check In" when ≤200m from a spot
- "Add Spot" button on map screen (ExploreScreen)
- Dark map background during tile loading (`backgroundColor: t.bg` on Leaflet container)
- `src/utils/geo.js` — shared haversine + radius constants
- Story posting blocked if user is >300m from selected spot
- 49/49 tests passing
