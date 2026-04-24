# AI Handoff — EgySpots (Read This First, Every Session)

Last updated: 2026-04-24

---

## What This Project Is

**EgySpots** is a mobile-first web app (wrapped in Capacitor for iOS/Android) that lets people in Cairo, Egypt discover and share hangout spots in real time. Think "Yelp meets Snapchat Maps" — a map with a crowd heatmap, spot check-ins, per-spot live chat, and user profiles.

**Target users:** Young Egyptians looking for cafes, car meets, shisha spots, street food, parks, and open-air hangouts across Cairo.

**Current status:** MVP feature-complete. Not yet published to App Store or Play Store. All code works; remaining steps are operational (store accounts, seeding, deployment).

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| Frontend | React 18 + Vite | JSX only (no TypeScript). Vite for dev server and build. |
| Styling | Inline styles | No CSS framework. All styles are inline JS objects using theme tokens from `src/theme.js`. |
| Maps | Mapbox GL JS v3 | Dark/light map styles, heatmap layer, custom dot markers, flyTo animation. |
| Backend | Firebase (project: `egyspots-dc9c1`) | Firestore (DB), Auth (email+Google), Storage (not yet used heavily). |
| Mobile | Capacitor v8 | Wraps the Vite build into a native iOS/Android app. Config: `capacitor.config.js`. |
| State | React Context API | Three contexts: `AuthContext`, `SpotsContext`, `ThemeContext`. No Redux. |
| Tests | Vitest + @testing-library/react | 40/40 passing. Config: `vitest.config.js`. |
| Font | Outfit (Google Fonts) | Loaded in `src/index.css`. Used everywhere via `fontFamily: 'Outfit, sans-serif'`. |

**Environment variables** (stored in `.env` — never commit this file):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_MAPBOX_TOKEN
```

---

## Repository

- GitHub: `https://github.com/Mistrodude/egyspots-c`
- Branch: `main`
- Local path: `c:\Users\Excellent Store\OneDrive\Desktop\projects\egyspots claud\`

---

## File Structure

```
egyspots claud/
├── src/
│   ├── App.jsx                    # Root shell — tab routing + auth/chat overlays
│   ├── main.jsx                   # React entry point; wraps app in all providers
│   ├── firebase.js                # Firebase init; exports: auth, db, storage, googleProvider
│   ├── theme.js                   # DARK and LIGHT theme token objects
│   ├── index.css                  # Global resets + Outfit font import + keyframe animations
│   │
│   ├── context/
│   │   ├── AuthContext.jsx        # Firebase Auth state; exposes: user, loading, signIn, signUp, signInGoogle, logOut
│   │   ├── SpotsContext.jsx       # Firestore spots listener; exposes: spots, loading, checkedInId, checkIn
│   │   └── ThemeContext.jsx       # Dark/light toggle; exposes: t (tokens), isDark, toggleTheme
│   │
│   ├── screens/
│   │   ├── ExploreScreen.jsx      # Main tab — full-screen map + bottom sheet with spot list
│   │   ├── SearchScreen.jsx       # Search tab — text input + filters + spot list
│   │   ├── SpotDetailScreen.jsx   # Spot detail — hero, stats, info/chat/reviews tabs, check-in button
│   │   ├── ChatScreen.jsx         # Full-screen chat for a spot — real Firestore messages
│   │   ├── ProfileScreen.jsx      # User profile — avatar, stats, recent check-ins, settings, sign-out
│   │   ├── AuthScreen.jsx         # Sign in / Sign up overlay — email+password+Google, forgot password
│   │   └── tabs/
│   │       ├── ChatTab.jsx        # Embedded chat preview inside SpotDetailScreen (chat tab)
│   │       └── ReviewsTab.jsx     # Reviews list inside SpotDetailScreen (reviews tab)
│   │
│   ├── components/
│   │   ├── MapView.jsx            # Mapbox map — heatmap layer, dot markers, flyTo logic
│   │   ├── SpotCard.jsx           # Spot list card — wrapped in React.memo
│   │   ├── BottomNav.jsx          # 4-tab bottom navigation bar (Explore/Search/Chat/Profile)
│   │   ├── Avatar.jsx             # Circular initials avatar
│   │   ├── CrowdBadge.jsx         # Colored pill: Chill / Lively / Packed
│   │   ├── Icons.jsx              # All SVG icons as React components
│   │   └── Loading.jsx            # Full-screen loading spinner
│   │
│   ├── data/
│   │   ├── spots.js               # SPOTS_SEED array (8 real Cairo spots), CATEGORIES array, filterSpots()
│   │   └── mockData.js            # MOCK_REVIEWS and STORIES arrays (static placeholder data)
│   │
│   └── test/
│       ├── setup.js               # Imports @testing-library/jest-dom matchers
│       ├── spots.test.js          # 9 tests — filterSpots + CATEGORIES + SPOTS_SEED fields
│       ├── theme.test.js          # 7 tests — DARK/LIGHT token completeness
│       ├── SpotCard.test.jsx      # 7 tests — renders name/neighborhood/rating/HERE badge/onPress
│       ├── AuthScreen.test.jsx    # 8 tests — sign in/up flow, errors, forgot password
│       └── SpotsContext.test.jsx  # 9 tests — checkIn toggle, coordinates, IDs, crowd levels
│
├── scripts/
│   └── seedTestAccounts.js        # Node script — creates 5 Firebase test users via Admin SDK
│
├── capacitor.config.js            # Capacitor config (CommonJS — NOT TypeScript)
├── firestore.rules                # Firestore security rules (deploy with firebase CLI)
├── vite.config.js                 # Vite config — LAN host enabled, port 5173
├── vitest.config.js               # Vitest config — jsdom environment
├── package.json                   # Scripts: dev, dev:lan, build, preview, test, test:watch
└── .env                           # Firebase + Mapbox keys (NOT committed to git)
```

---

## How The App Works — Screen by Screen

### App.jsx — The Shell

State-driven routing (no React Router). Variables:
- `tab` — which bottom tab is active: `'explore'`, `'search'`, `'chat'`, `'profile'`
- `selectedSpot` — if set, shows `SpotDetailScreen` instead of the tab
- `chatOpen` — if true (and selectedSpot exists), shows full `ChatScreen`
- `authOpen` — if true, shows `AuthScreen` as a full-screen overlay

Priority order: `authOpen` → `chatOpen` → `selectedSpot` → tab screen.

All non-critical screens are lazy-loaded: `SpotDetailScreen`, `ChatScreen`, `SearchScreen`, `ProfileScreen`, `AuthScreen`. Only `ExploreScreen` is eagerly loaded (it's the landing screen).

### ExploreScreen — Main Map View

- Full-screen `MapView` behind everything
- Floating search bar (top) — tapping it calls `onOpenSearch` to switch to Search tab
- Floating locate button — triggers `navigator.geolocation`, stores result in `userLocation` state, passes to `MapView` as `flyToTarget` prop
- Bottom sheet — slides up to show spot list; has category filter pills
- `filtered` spots computed with `useMemo(() => filterSpots(spots, category), [spots, category])`

### MapView — Mapbox Component

Props: `spots`, `selectedId`, `onSpotPress`, `checkedInId`, `flyToTarget`

Five `useEffect` hooks:
1. **Init** (runs once) — creates Mapbox map, adds heatmap source+layer, adds initial markers
2. **Heatmap update** — watches `spots` prop; calls `source.setData()` to keep heatmap live with Firestore data
3. **Markers update** — watches `spots/selectedId/checkedInId`; re-renders all markers
4. **Fly to selected** — when `selectedId` changes, flies map to that spot at zoom 14
5. **Fly to user** — when `flyToTarget` changes (from GPS), flies to user's location at zoom 15

`mapLoadedRef` (a `useRef`) is set to `true` inside `map.on('load')` and is checked before any source/layer manipulation to avoid "source not yet added" errors.

### SpotDetailScreen

Receives `spot` object as prop. Three sub-tabs: Info, Chat, Reviews.

- **Info tab** (inline `InfoTab` component): crowd meter bar, vibe tags, static "Who's Here" avatars, static hours
- **Chat tab**: `ChatTab` component — shows a preview of recent messages, button to open full chat
- **Reviews tab**: `ReviewsTab` component — shows `MOCK_REVIEWS` (static, not yet wired to Firestore)
- **Check-in button**: calls `checkIn(spot.id)` from SpotsContext. If guest user, calls `onRequireAuth()` which navigates to Auth overlay instead of silently failing.

### ChatScreen

Real Firestore messages. Query: `messages` collection filtered by `spotId`, ordered by `createdAt asc`, limit 100.

Sending: `addDoc` to `messages` collection with `{ spotId, text, userId, userName, userAvatar, createdAt }`.

"Mine" detection: compares `m.userId === user?.uid` (not the stored `mine` field — that field is always `false`).

Guests see the input but it is `disabled` with placeholder "Sign in to chat…".

Stories bar at top uses `STORIES` from `mockData.js` — static, not yet functional.

### AuthScreen

Two modes: Sign In / Sign Up (toggled with tab buttons at top).

Sign In: email + password → `signIn()` from AuthContext → calls `signInWithEmailAndPassword`.
Sign Up: name + email + password → `signUp()` → creates Firebase Auth user, sets `displayName`, creates Firestore `users/{uid}` doc.
Google: `signInGoogle()` → `signInWithPopup`.
Forgot Password: visible only in Sign In mode; calls `sendPasswordResetEmail(auth, email)`.

Error handling: `ERROR_MAP` object maps Firebase error codes to human strings:
- `auth/wrong-password` → "Incorrect password. Try again."
- `auth/invalid-credential` → "Incorrect email or password."
- `auth/user-not-found` → "No account found with that email."
- `auth/email-already-in-use` → "An account with this email already exists."
- `auth/weak-password` → "Password must be at least 6 characters."
- `auth/invalid-email` → "Please enter a valid email address."
- `auth/too-many-requests` → "Too many attempts. Please wait a moment."
- `auth/network-request-failed` → "Network error. Check your connection."

### ProfileScreen

Shows user avatar (initials), display name, handle (`@email-prefix`), and active check-in spot.
Stats row (hardcoded): Check-ins 47, Reviews 12, Following 89, Spots 3. **These are placeholder values — not yet wired to real Firestore data.**
"Recent Check-Ins" section shows first 4 spots from SPOTS_SEED (not the user's actual history — also a placeholder).
Settings items are static labels with no functionality yet.
Dark mode toggle (top right) calls `toggleTheme()` from ThemeContext.

---

## Data Layer

### Firestore Collections

**`spots/{spotId}`**
```js
{
  id, name, category, neighborhood, rating, reviews, crowd, crowdPct,
  distance, open, checkins, vibe: [], color, tags: [], lng, lat, createdAt
}
```
Seeded from `SPOTS_SEED` in `src/data/spots.js` on first app load (SpotsContext checks if collection is empty).

**`users/{uid}`**
```js
{ uid, email, displayName, photoURL, checkins, activeCheckin, createdAt }
```
Created automatically on first sign-in (AuthContext) and on sign-up.

**`messages/{messageId}`**
```js
{ spotId, text, userId, userName, userAvatar, mine: false, createdAt }
```

**`reviews/{reviewId}`** (structure defined in firestore.rules, not yet written from UI)
```js
{ spotId, userId, userName, rating, text, createdAt }
```

### SpotsContext — How Check-In Works

```
checkIn(spotId):
  - If already checked in to spotId → leave (set checkedInId = null)
  - If checked in elsewhere → leave old spot (decrement), join new spot (increment)
  - If not checked in → join spot (increment)
  - Guest users: optimistic UI only (state updates locally, no Firestore write)
  - Signed-in users: writes to Firestore — updates spot checkins count + users/{uid}.activeCheckin
```

---

## Theme System

File: `src/theme.js` exports `DARK` and `LIGHT` token objects.

`ThemeContext` wraps the app and provides `t` (the active theme object), `isDark`, and `toggleTheme`.

Key tokens used throughout: `t.bg`, `t.surface`, `t.surface2`, `t.border`, `t.text`, `t.muted`, `t.accent`, `t.accentBg`, `t.accentText`, `t.navBg`, `t.pill`, `t.pillText`, `t.shadow`, `t.shadow2`, `t.crowd.Chill/Lively/Packed`.

Dark accent = `#A78BFA` (purple). Light accent = `#C8A96E` (gold).

---

## Spot Data — The 8 Seed Spots

| ID | Name | Category | Neighborhood |
|---|---|---|---|
| `kazoku` | Kazoku | Cafe | Zamalek |
| `elfishawy` | El Fishawy | Traditional | Khan El Khalili |
| `roadstermeet` | Roadster Meet | Car Meet | Nasr City |
| `nilecorniche` | Nile Corniche | Open Air | Downtown |
| `hydeparkspot` | Hyde Park Spot | Car Meet | New Cairo |
| `zoobastreet` | Zooba Street | Street Food | Garden City |
| `alazharpark` | Al-Azhar Park | Park | Islamic Cairo |
| `cilantroheliopolis` | Cilantro Heliopolis | Cafe | Heliopolis |

Categories: `All`, `Cafes`, `Street Food`, `Shisha`, `Car Meets`, `Parks`, `Open Air`

`filterSpots(spots, category)` maps category names to filter predicates. "Shisha" filters by `vibe.includes('Shisha')`, not by category field.

---

## Test Suite — Critical Notes

Run with: `npm test`

**CRITICAL — AuthScreen test button selector:**
The submit button ("Sign In" / "Sign Up") is selected in tests using:
```js
screen.getAllByRole('button').find(
  (btn) => btn.textContent === 'Sign In' && btn.style.borderRadius === '16px'
)
```
The tab toggle buttons also say "Sign In" / "Sign Up" but have `borderRadius: 12px`.
**Do NOT change submit button `borderRadius` (currently `16`) without updating the 4 affected tests.**

Test files:
- `spots.test.js` — filterSpots logic, CATEGORIES array, SPOTS_SEED required fields
- `theme.test.js` — DARK/LIGHT have all required token keys
- `SpotCard.test.jsx` — renders name, neighborhood, rating, HERE badge, onPress
- `AuthScreen.test.jsx` — 8 tests covering full auth flow
- `SpotsContext.test.jsx` — checkIn toggle, coordinates validity, unique IDs

---

## Dev Server & LAN Access

```bash
npm run dev          # localhost:5173
npm run dev:lan      # binds to 0.0.0.0:5173 (accessible from phone on same Wi-Fi)
npm run build        # production build to dist/
npm run preview      # preview production build locally
npm run preview:lan  # preview on LAN
```

**Phone testing:** Run `npm run dev:lan`, then open `http://192.168.1.6:5173` on the phone (user's LAN IP is `192.168.1.6`).

**Windows Firewall:** If phone can't connect, Windows Firewall may be blocking port 5173. Fix: Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port → TCP 5173 → Allow.

---

## Capacitor (Mobile Wrapper)

Config file: `capacitor.config.js` (CommonJS — was previously .ts which broke `npx cap add`)

```js
module.exports = {
  appId: 'com.egyspots.app',
  appName: 'EgySpots',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment for live reload during dev:
    // url: 'http://192.168.1.6:5173',
    // cleartext: true,
  },
};
```

**Status:** Native platforms NOT yet added. To add:
```bash
npx cap add ios
npx cap add android
npx cap sync
```

After adding iOS, add to `ios/App/App/Info.plist`:
- `NSLocationWhenInUseUsageDescription`
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`

---

## Firestore Security Rules

File: `firestore.rules` (not yet deployed).

Summary:
- `spots`: public read; auth users can update `checkins` field only; admin token required for full write
- `users/{uid}`: owner-only read/write
- `messages`: public read; auth users create own messages (text < 500 chars); owner-only delete
- `reviews`: public read; auth users create own (rating 1–5, text < 1000 chars); owner-only delete

Deploy: `firebase deploy --only firestore:rules`

---

## Test Accounts (5 fake users for dev/testing)

Script: `node scripts/seedTestAccounts.js` (requires `scripts/serviceAccountKey.json` from Firebase Console → Project Settings → Service Accounts → Generate new private key — **never commit this file**)

| Email | Password | Name | Check-ins |
|---|---|---|---|
| ahmed@test.egyspots.com | Test1234! | Ahmed R. | 23 |
| sara@test.egyspots.com | Test1234! | Sara M. | 14 |
| karim@test.egyspots.com | Test1234! | Karim A. | 31 |
| nour@test.egyspots.com | Test1234! | Nour H. | 8 |
| youssef@test.egyspots.com | Test1234! | Youssef T. | 47 |

---

## Services Plan — Sign-Up Status

Canonical source path: `C:\Users\Excellent Store\Downloads\Egyspots_Services_Table.md`

From `Egyspots_Services_Table.md`:

| Service | Status | Notes |
|---|---|---|
| Firebase | ✅ Done | Project: egyspots-dc9c1 |
| GitHub | ✅ Done | github.com/Mistrodude/egyspots-c |
| Mapbox | ✅ Done | Already integrated (skipped OSM recommendation) |
| Google Play Console | ❌ Not done | $25 one-time, 48h activation |
| Apple Developer Program | ❌ Not done | $99/year, 24–48h activation |
| Sentry (error monitoring) | ❌ Not done | Day 1 priority |
| Google Analytics 4 | ❌ Not done | Day 1 priority, free via Firebase |
| Domain (egyspots.com) | ❌ Not done | ~$12/year on Namecheap |
| Paymob (Egypt payments) | ❌ Not done | Phase 2 |
| Mixpanel | ❌ Not done | When real users arrive |
| Cloudinary | ❌ Not done | Phase 2; Firebase Resize Images extension is free alternative |

---

## Known Gaps / Incomplete Features

- **Profile stats are hardcoded** — Check-ins: 47, Reviews: 12, Following: 89, Spots: 3 are placeholder values in `ProfileScreen.jsx`. Need to read from `users/{uid}` Firestore doc.
- **Recent check-ins are fake** — ProfileScreen shows first 4 SPOTS_SEED items, not the user's real history.
- **Reviews tab uses mock data** — `ReviewsTab` renders `MOCK_REVIEWS` from `mockData.js`. Needs Firestore `reviews` collection wired in.
- **Stories are static** — The stories bar in ChatScreen uses `STORIES` from `mockData.js`. Not functional.
- **Heart/Favorite button is visual only** — SpotDetailScreen has a heart button that does nothing.
- **No deep-link / URL routing** — Navigation is state-only. Back button on Android may not work correctly.
- **Check-in writes are not transaction-safe** — For high-traffic production use, `checkins` increment should use Firestore transactions.
- **Compass button does nothing** — ExploreScreen has a compass SVG button with no handler.
- **Settings items are visual only** — ProfileScreen settings list (Notifications, Privacy, etc.) does nothing on tap.
- **No push notifications** — Firebase Cloud Messaging not yet integrated.
- **No image upload** — Firebase Storage is initialized but not used.
- **Seed accounts not yet run** — Awaiting serviceAccountKey.json.
- **Firestore rules not yet deployed** — Awaiting `firebase deploy --only firestore:rules`.

---

## Performance Decisions Already Made

- `SpotCard` wrapped in `React.memo` — prevents re-renders when unrelated state changes
- `SpotsContext` value wrapped in `useMemo` — stable object reference across renders
- `filterSpots` result in ExploreScreen wrapped in `useMemo`
- All non-critical screens lazy-loaded via `React.lazy + Suspense`
- `react-router-dom` removed from dependencies (was unused)

---

## Working Agreement For AI Sessions

Before making any changes:
1. Read this file completely
2. Check git status for any uncommitted changes: `git status`
3. After finishing work, append a short entry at the bottom of this file

```md
### YYYY-MM-DD — <short title>
- Summary:
- Files changed:
- Follow-ups:
```

---

## Change Log

### 2026-04-24 — Production Readiness Pass (Phases 1–9)

- Capacitor config: deleted `capacitor.config.ts`, created `capacitor.config.js` (CommonJS)
- Geolocation fix: `handleLocate` now stores GPS coords in `userLocation` state; `MapView` accepts `flyToTarget` prop and calls `map.flyTo()` via `useEffect`
- Heatmap fix: added `mapLoadedRef` + reactive `useEffect` in `MapView` to call `source.setData()` when `spots` prop changes
- AuthScreen rewrite: `ERROR_MAP` for human-readable errors, forgot password link, loading spinner, client-side validation, autocomplete attributes, Enter key submit
- Performance: `React.memo` on SpotCard, `useMemo` on SpotsContext value + filterSpots, lazy-loaded screens
- Removed `react-router-dom` dependency (unused)
- Test suite: 40/40 passing — `spots.test.js`, `theme.test.js`, `SpotCard.test.jsx`, `AuthScreen.test.jsx`, `SpotsContext.test.jsx`
- `firestore.rules` created (not yet deployed)
- `scripts/seedTestAccounts.js` created (not yet run)
- `AI_HANDOFF.md` created and maintained

### 2026-04-24 — Vite LAN Access + AI Handoff Setup

- `vite.config.js`: `server.host: true`, `strictPort: true` (port 5173); same for preview (port 4173)
- `package.json`: added `dev:lan` and `preview:lan` scripts
- `AI_HANDOFF.md` created as shared context doc for Claude + Cursor sessions
- UX improvements: Explore search bar opens Search tab; guest check-in routes to auth flow

### 2026-04-24 — Services Plan Path Confirmed

- Confirmed canonical services plan location:
  - `C:\Users\Excellent Store\Downloads\Egyspots_Services_Table.md`
- Future sessions should read this file (plus `AI_HANDOFF.md`) before planning infra/store work.

### 2026-04-24 — Cursor Continuation (Missing 15 Items Implemented)
- Summary:
  - Implemented all previously missing screen modules wired by `App.jsx`: `DiscoverScreen`, `VendorsScreen`, `VendorProfileScreen`, `CheckInModal`, `EditProfileScreen`, `SettingsScreen`, `NotificationsScreen`, `VendorDashboardScreen`, `AddSpotScreen`.
  - Rewrote `SpotDetailScreen` and `ProfileScreen` to match the new architecture and context APIs.
  - Added `NotificationsProvider` in `main.jsx` and updated tests/rules per handoff requirements.
  - Verified with `npm run test` (36/36 passing) and `npm run build` (success).
- Files changed:
  - `src/screens/DiscoverScreen.jsx`
  - `src/screens/VendorsScreen.jsx`
  - `src/screens/VendorProfileScreen.jsx`
  - `src/screens/CheckInModal.jsx`
  - `src/screens/SpotDetailScreen.jsx`
  - `src/screens/ProfileScreen.jsx`
  - `src/screens/EditProfileScreen.jsx`
  - `src/screens/SettingsScreen.jsx`
  - `src/screens/NotificationsScreen.jsx`
  - `src/screens/VendorDashboardScreen.jsx`
  - `src/screens/AddSpotScreen.jsx`
  - `src/main.jsx`
  - `src/test/spots.test.js`
  - `src/test/AuthScreen.test.jsx`
  - `firestore.rules`
- Follow-ups:
  - Replace placeholder flows in new screens with full production-grade UX and stricter Firestore transaction logic.
  - Add/adjust tests for all new screens and expanded context behavior (currently only existing suite covered).

### 2026-04-24 — Free Map + UX/Creation Fixes
- Summary:
  - Replaced Mapbox usage with free Leaflet + CARTO dark tiles in `MapView` (no Mapbox token dependency in map rendering).
  - Added persistent user location marker + pulse circle on locate, and kept spot markers anchored to true coordinates.
  - Fixed center Check-In FAB sizing in bottom nav so it is no longer cropped.
  - Enabled customer spot creation in Firestore rules for `pending_review` suggestions.
  - Ensured founder identity is present in seed spots (`founderId`, `founderName`) and retained founder fields in new spot creation.
- Files changed:
  - `src/components/MapView.jsx`
  - `src/index.css`
  - `src/components/BottomNav.jsx`
  - `firestore.rules`
  - `src/data/spots.js`
  - `vite.config.js`
  - `package.json`
- Follow-ups:
  - If needed, add migration script to backfill founder fields for already-seeded Firestore `spots` docs that were created before this change.

---

### 2026-04-24 — Full Spec Implementation (PARTIAL — Cursor must continue)

**Full spec source:** `C:\Users\Excellent Store\Downloads\Egyspots_Full_Spec.md` — read this before continuing.

#### ✅ COMPLETED (do NOT redo these)

| File | What changed |
|---|---|
| `src/theme.js` | Added `success`, `successBg`, `error`, `errorBg`, `warning`, `warningBg`, `gold`, `goldBg` tokens to both DARK and LIGHT |
| `src/components/Icons.jsx` | Full rewrite — added ~40 new icons: MapIcon, BellIcon, StoreIcon, StarFilledIcon, ShareIcon, FlagIcon, ShieldCheckIcon, PlusIcon, EditIcon, ChevronRight/Down/Up, XIcon, CheckIcon, LogOutIcon, TrashIcon, UploadIcon, CameraIcon, ImageIcon, BuildingIcon, BriefcaseIcon, BroadcastIcon, BarChartIcon, TrendingIcon, PhoneIcon, MailIcon, GlobeIcon, InstagramIcon, ClockIcon, CalendarIcon, LocateIcon, MapPinIcon, NavigationIcon, SettingsIcon, JuiceIcon, DessertIcon, OtherIcon, UsersIcon, BadgeIcon, etc. `SpotIcon` updated to handle new category values. `CATEGORY_ICONS` updated for new categories. |
| `src/data/spots.js` | Full rewrite — all 8 SPOTS_SEED updated to new schema (added nameAr, category now uses spec values: 'coffee'/'food'/'other', totalCheckins, checkinsToday, weeklyCheckins, isMobile, isFeatured, isVerifiedSpot, operatingHours, address, city, etc.). `CATEGORIES` changed to `['All','Coffee','Food','Juice','Dessert','Other']`. Added `MAP_FILTER_CATEGORIES`. `filterSpots()` updated for new category values. |
| `src/context/AuthContext.jsx` | Full rewrite — new `signUp(email, password, userData)` takes full profile object; reads Firestore profile on auth state change; hard-blocks banned users; exports: `userProfile`, `checkUsernameAvailable()`, `updateUserProfile()`, `refreshProfile()`, `upgradeToVendor()`, `followVendor()`, `isFollowingVendor()` |
| `src/context/NotificationsContext.jsx` | **NEW FILE** — listens to `notifications/{id}` for current user; exposes `notifications`, `unreadCount`, `markAllRead()`, `markRead()` |
| `src/context/SpotsContext.jsx` | Updated `checkIn()` to write full `checkins/{id}` document per new schema (note, photoURL, rating, isAnonymous, location). Added `submitReport()`. Exposes `checkinHistory` (last 20 check-ins for signed-in user). |
| `src/components/BottomNav.jsx` | Full rewrite — 5-tab layout: Map \| Explore \| [Check In FAB center] \| Vendors \| Profile. FAB is raised above bar with gold glow. Notification badge on Profile tab. Accepts `onCheckInPress` prop. |
| `src/App.jsx` | Full rewrite — new routing with overlay priority stack: onboarding → auth → notifications → settings → editProfile → vendorDash → addSpot → vendorProfile → checkInModal → chat → search → spotDetail → main tabs. Tabs: 'map' \| 'explore' \| 'vendors' \| 'profile'. Guest interaction counter (2 interactions → auth prompt). |
| `src/screens/OnboardingScreen.jsx` | **NEW FILE** — 3-slide onboarding (Discover / Check in / Follow vendors). Stored in `localStorage.onboardingDone`. Skip button, dots, Next/Get Started buttons. |
| `src/screens/AuthScreen.jsx` | Full rewrite — Sign In mode unchanged (email + password + forgot password). Sign Up mode: full form with name, username (uniqueness check on blur), email, password (min 8 + uppercase + number), confirm password, phone (+20 prefix), date of birth (age gate: blocks if <13), gender select, city select, language toggle (AR/EN), terms checkbox. |

---

#### ❌ NOT DONE YET — Cursor must implement these

**IMPORTANT: All styles must use inline JS objects + tokens from `src/theme.js` via `useTheme()`. No CSS classes. No Tailwind. Font: `Outfit, sans-serif`. Same visual language as existing screens.**

---

##### 1. `src/screens/DiscoverScreen.jsx` — NEW FILE
The **Explore tab** (discovery feed, NOT the map).

Sections (vertical scroll):
- **Trending This Week** — horizontal scroll `SpotCard` row, sorted by `weeklyCheckins` desc
- **Most Active Today** — horizontal scroll row, sorted by `checkinsToday` desc
- **Featured Vendors** — horizontal scroll vendor cards (spots where `isFeatured === true`), label "Sponsored"
- **New Spots Nearby** — grid of spots added in last 7 days (filter by `createdAt`)
- **Browse by Category** — grid of 5 category buttons (Coffee/Food/Juice/Dessert/Other) that filter spots
- **Spots You Haven't Visited** — uses `checkinHistory` from `useSpots()` to exclude visited spots

Props: `onSpotPress(spot)`, `onOpenSearch()`

---

##### 2. `src/screens/VendorsScreen.jsx` — NEW FILE
The **Vendors tab**.

- Search bar at top
- Category tabs: All | Coffee | Food | Dessert | Other
- "Verified only" toggle
- Vendor cards: logo placeholder (colored circle with initials), business name, type badge, follower count, verified badge
- "Following" section at top (vendors user follows, from `userProfile.followingVendors`)
- Data: query `vendors` Firestore collection (`verificationStatus === 'approved'`)
- Follow/Unfollow via `followVendor(vendorId)` from AuthContext

Props: `onVendorPress(vendorId)`, `onRequireAuth()`

---

##### 3. `src/screens/VendorProfileScreen.jsx` — NEW FILE
Public vendor profile page.

- Header: cover placeholder, logo circle, business name, type badge, verified badge
- Stats row: Followers | Spots | Total Check-ins
- Follow button (toggle) + Share button
- Today's Location section (if `spot.todayLocation` exists)
- About: businessDescription
- Contact: phone, email, Instagram icons (tap to open)
- Spots grid: spots owned by this vendor (`ownerId === vendorId`)
- Data: reads `vendors/{vendorId}` + `users/{vendorId}` + queries `spots` where `ownerId === vendorId`

Props: `vendorId`, `onBack()`, `onSpotPress(spot)`

---

##### 4. `src/screens/CheckInModal.jsx` — NEW FILE
5-step check-in modal. Shown as full-screen overlay.

**Step 1 — Confirm Location:**
- Show user's GPS distance to spot
- Green if <200m, orange warning if 200m–500m, red block if >500m
- "Confirm" + "Cancel" buttons
- Must call `navigator.geolocation.getCurrentPosition()` on mount

**Step 2 — Rate & Review (optional):**
- 5 tappable stars (filled on select)
- Text input for note (max 200 chars, char counter)
- "Skip" link

**Step 3 — Add Photo (optional):**
- Camera button + Gallery button (use `<input type="file" accept="image/*" capture="environment">`)
- Photo preview with Remove button
- "Skip" link

**Step 4 — Privacy:**
- Toggle: "Check in anonymously" (hides name in public feed)

**Step 5 — Submit:**
- "Post Check-in" button → calls `checkIn(spot.id, { note, rating, isAnonymous, location })`
- Success state: green checkmark animation, "Checked in at [Spot Name]!" message, auto-close after 2s

**Error states:**
- Location denied: show instructions card, block progression
- >500m from spot: show warning, allow override with "Check in anyway" button
- Rate limit: show friendly message

Props: `spot`, `onClose()`, `onSuccess()`

---

##### 5. `src/screens/SpotDetailScreen.jsx` — FULL REWRITE
Replace the current SpotDetailScreen with the full spec version.

**Header:**
- Cover photo area (use `spot.coverPhotoURL` if exists, else colored gradient pattern — keep existing)
- Spot name + `spot.nameAr` below in smaller text
- Verified badge (if `spot.isVerifiedSpot`) + Featured badge (if `spot.isFeatured`)
- Back button + Heart button (right)

**Quick Stats Bar:**
- Check-ins today (`spot.checkinsToday`) | This week (`spot.weeklyCheckins`) | Rating | Distance

**Action Buttons Row** (horizontal, below stats):
- Check In Here (gold CTA) → opens CheckInModal (calls `onCheckIn()`)
- Follow ♡ toggle (visual only for now, calls `onRequireAuth` if guest)
- Share → `navigator.share()` if available, else copy link
- Report 🚩 → opens a simple report modal (reason select + submit via `submitReport()`)

**Info Section:**
- Category badge + subcategory
- Description (show Arabic if `userProfile?.language === 'ar'` and `spot.descriptionAr` exists, else English)
- Tags chips
- Address with "Open in Maps" button → `window.open('https://maps.google.com/?q=LAT,LNG')`
- Operating Hours: today highlighted (use day-of-week), expandable full week

**Vendor Section** (if `spot.ownerId`):
- Logo + name + "View Vendor" button → calls `onVendorPress(spot.ownerId)`
- Verified badge

**Check-In Feed:**
- Query `checkins` collection where `spotId === spot.id`, orderBy `timestamp desc`, limit 10
- Show each: avatar (initials), username, note, rating stars, timestamp ago
- "Show All" button (loads 10 more)

**Sticky bottom CTA:**
- "Check In Here" button — always visible, calls `onCheckIn()`
- Keep existing `isCheckedIn` state to show "✓ Checked In · Leave" if already checked in

Props: `spot`, `onBack()`, `onOpenChat()`, `onCheckIn()`, `onVendorPress(vendorId)`, `onRequireAuth()`

---

##### 6. `src/screens/ProfileScreen.jsx` — FULL REWRITE
Replace placeholder stats with real Firestore data.

**Header:**
- Profile photo (circular, shows `userProfile.profilePhotoURL` if set, else initials avatar)
- displayName, @username (if set), city, bio
- Edit Profile button → calls `onEditProfile()`
- Settings gear → calls `onSettings()`
- Notification bell (with `unreadCount` badge) → calls `onNotifications()`
- Dark mode toggle

**Stats Row** (real data from `userProfile`):
- `userProfile.totalCheckins` | Founded spots count (query spots where `founderId === user.uid`) | Following vendors count (`userProfile.followingVendors.length`)

**Vendor Dashboard button** (only if `userProfile.role === 'vendor'` or `'admin'`):
- Shows "Vendor Dashboard" button → calls `onVendorDash()`

**Tabs:**
- **Check-in History**: `checkinHistory` from `useSpots()` — show spot name, date, note, rating. "No check-ins yet" empty state.
- **Founded Spots**: query `spots` where `founderId === user.uid` — show SpotCard. Empty state.
- **Saved**: placeholder "Coming soon" card

**If not signed in:** same sign-in prompt card as before.

Props: `onNavigateToAuth`, `onEditProfile`, `onSettings`, `onVendorDash`, `onNotifications`, `onSpotPress`, `onAddSpot`

---

##### 7. `src/screens/EditProfileScreen.jsx` — NEW FILE
Edit own profile.

Fields (pre-filled from `userProfile`):
- Profile photo (circle, tap to pick — use `<input type="file" accept="image/*">`, show preview)
- Display Name
- Username (uniqueness check on blur, same logic as AuthScreen)
- Bio (textarea, 150 char counter)
- City (dropdown)
- Phone number
- Language toggle (AR / EN)
- Notification toggles for each `notifSettings` key

Buttons:
- Save Changes → calls `updateUserProfile(data)` then `onBack()`
- Cancel → calls `onBack()`

Props: `onBack()`

---

##### 8. `src/screens/SettingsScreen.jsx` — NEW FILE
Full settings page.

Sections:
- **Account**: Change Password link (show info "Use Forgot Password from sign-in screen"), Linked accounts (show Google badge if `user.providerData` includes Google)
- **Privacy**: Anonymous check-ins default toggle (save to `userProfile.defaultAnonymous`), Profile visibility info
- **Notifications**: Mirror `notifSettings` toggles (same as EditProfile)
- **Language**: AR / EN toggle → calls `updateUserProfile({ language })`
- **Theme**: Dark / Light toggle (calls `toggleTheme()`)
- **Legal**: Terms of Service, Privacy Policy (show simple modal with placeholder text)
- **Support**: "Contact via WhatsApp" button (opens `https://wa.me/...` — leave number as placeholder), "Report a Bug" (opens email)
- **Danger Zone**: Delete Account — requires typing "DELETE" in input, then calls Firebase `deleteUser()` + Firestore doc delete

**Sign Out** button at bottom → calls `logOut()` with confirmation dialog

Props: `onBack()`, `onRequireAuth()`

---

##### 9. `src/screens/NotificationsScreen.jsx` — NEW FILE
In-app notifications list.

- Header: "Notifications" title, "Mark all read" button (calls `markAllRead()`)
- List of notifications from `useNotifications()`
- Each item: icon based on `notif.type`, title, body, timestamp ago, unread dot
- Tap → calls `markRead(notif.id)` + navigate to relevant page based on `notif.data`
- Empty state: "No notifications yet" illustration
- Notification types to handle: `vendor_location_update`, `spot_approved`, `spot_rejected`, `account_verified`, `account_rejected`, `checkin_at_your_spot`

Props: `onBack()`, `onSpotPress(spot)`

---

##### 10. `src/screens/VendorDashboardScreen.jsx` — NEW FILE
Vendor analytics and management. Route-guarded: only `role === 'vendor'` or `'admin'`.

Sections:
- **Overview Cards** (2x2 grid): Check-ins Today / This Week / This Month / All Time — read from `vendors/{uid}.totalCheckins` and query `checkins` with date filters
- **My Spots** grid: spots where `ownerId === user.uid`, each with Edit/View/Broadcast buttons
- **Verification Status banner**: if `verificationStatus === 'pending'` show "Verification pending" yellow banner; if `rejected` show red banner with reason
- **Subscription Card**: current plan badge, expiry date, "Upgrade" button → for now show a "Coming soon" modal
- **Broadcast Location button**: for each mobile spot, show "Broadcast Today's Location" button → opens a simple sheet with map pin text input + message input + "Broadcast Now" → updates `spots/{id}.todayLocation` and `todayLocationUpdatedAt`
- **Add New Spot** button → calls `onAddSpot()`
- **Recent Check-ins Feed**: query `checkins` where `ownerId === user.uid`, last 10

Props: `onBack()`, `onAddSpot()`

---

##### 11. `src/screens/AddSpotScreen.jsx` — NEW FILE
Add spot — two modes based on user role.

**Customer mode** (role === 'customer'):
- Title: "Suggest a Spot"
- Fields: Spot Name, Spot Name Arabic (optional), Category (select), Description (textarea), Address text, "Is this mobile?" toggle, Photo upload (up to 3, preview)
- Submit → creates Firestore `spots/{id}` with `status: 'pending_review'`, `founderId: user.uid`, `founderName: userProfile.displayName`
- Success: "Thanks! Your suggestion is under review."

**Vendor mode** (role === 'vendor' with `verificationStatus === 'approved'`):
- All customer fields plus: Spot Name Arabic *, Subcategory, Description Arabic, Tags multi-select chips (halal/outdoor/wifi/takeaway), Cover Photo *, Operating Hours (day toggles + time pickers), "Is this spot mobile?" toggle
- Submit → creates spot with `status: 'active'` immediately (no review needed for verified vendors)
- Check subscription limit: if `subscriptionPlan === 'free'` and `totalSpots >= 1`, show paywall modal "Upgrade to add more spots"

**Unverified vendor**: show "Complete verification to publish spots" gate.

Props: `onBack()`, `onRequireAuth()`

---

##### 12. `src/main.jsx` — ADD NotificationsProvider
Wrap app in `NotificationsProvider` (must be inside `AuthProvider` since it uses `useAuth`):

```jsx
<ThemeProvider>
  <AuthProvider>
    <SpotsProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </SpotsProvider>
  </AuthProvider>
</ThemeProvider>
```

---

##### 13. `src/test/spots.test.js` — UPDATE
The CATEGORIES changed from `['All','Cafes','Street Food',...]` to `['All','Coffee','Food','Juice','Dessert','Other']`.
The spot category values changed from `'Cafe'` to `'coffee'`, `'Street Food'` to `'food'`, etc.

Update the test:
- `filterSpots(SPOTS_SEED, 'Coffee')` → spots where `category === 'coffee'`
- `filterSpots(SPOTS_SEED, 'Food')` → spots where `category === 'food'`
- `CATEGORIES.toContain('Coffee')` and `CATEGORIES.toContain('Food')`
- Remove tests for old categories: 'Cafes', 'Street Food', 'Shisha', 'Car Meets', 'Parks', 'Open Air'
- Keep: all spots have `id`, `name`, `lat`, `lng`, `crowdPct`, `crowd`

---

##### 14. `src/test/AuthScreen.test.jsx` — UPDATE
The signUp function signature changed. Update the mock:
```js
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInGoogle: mockSignInGoogle,
    checkUsernameAvailable: vi.fn().mockResolvedValue(true),
  }),
}));
```
The test `'switches to sign-up mode and shows name field'` — keep `getByPlaceholderText('Your name')`, it still exists.
The submit button selector `btn.style.borderRadius === '16px'` still works — don't change it.

---

##### 15. `firestore.rules` — UPDATE
Add rules for new collections: `checkins`, `reports`, `disputes`, `notifications`, `vendors`, `featuredSlots`.

Key rules:
- `checkins`: public read; authenticated users can create (own userId only); owner can delete
- `notifications`: only `toUserId` can read/update their own
- `vendors`: public read; owner can update non-sensitive fields; admin can write all
- `reports`: authenticated users can create; admin can read/update
- `spots`: public read; verified vendors can create/update own spots; admin full write

---

#### ⚠️ IMPORTANT NOTES FOR CURSOR

1. **All styles are inline JS objects** using theme tokens (`t.bg`, `t.surface`, etc.) from `useTheme()`. Zero CSS files, zero Tailwind classes.

2. **Font everywhere**: `fontFamily: 'Outfit, sans-serif'`

3. **The existing `ExploreScreen.jsx`** (the map screen) is unchanged and becomes the "Map" tab. Do NOT rename or modify it unless fixing a bug.

4. **`SearchScreen.jsx`** already exists — don't recreate it. It's accessed via `searchOpen` overlay in App.jsx.

5. **`ChatScreen.jsx`** already exists — don't recreate it. It's accessed via `chatOpen` overlay.

6. **AuthScreen submit button must keep `borderRadius: 16`** on the primary submit button (not the tab toggles which are `borderRadius: 12`). This is required by `AuthScreen.test.jsx`.

7. **Test `getByPlaceholderText('Your name')`** must still work in sign-up mode of AuthScreen — it does, don't break it.

8. **Run `npm test` after all changes** to verify all tests pass. Expected: 40/40. The spots.test.js and AuthScreen.test.jsx will need updating (see items 13 and 14 above).

9. **`src/screens/tabs/ChatTab.jsx` and `src/screens/tabs/ReviewsTab.jsx`** still exist — SpotDetailScreen can keep referencing them or inline them in the new version.

- Summary: 11 files changed/created, 14 files still needed
- Files changed: theme.js, Icons.jsx, data/spots.js, AuthContext.jsx, NotificationsContext.jsx, SpotsContext.jsx, BottomNav.jsx, App.jsx, OnboardingScreen.jsx, AuthScreen.jsx
- Files still needed: DiscoverScreen, VendorsScreen, VendorProfileScreen, CheckInModal, SpotDetailScreen (rewrite), ProfileScreen (rewrite), EditProfileScreen, SettingsScreen, NotificationsScreen, VendorDashboardScreen, AddSpotScreen, main.jsx (1-line change), spots.test.js (update), AuthScreen.test.jsx (update), firestore.rules (update)
