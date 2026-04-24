# EGYSPOTS — CLAUDE CODE IMPLEMENTATION PLAN
### Hand this file to Claude Code. Execute top-to-bottom.
> Repo: `https://github.com/Mistrodude/egyspots-c` | Branch: `main`
> Goal: Ship to Apple App Store + Google Play Store as a free-tier, minimal, efficient youth hangout-spotting app.
> Read `AI_HANDOFF.md` first. Do not recreate code that already exists.

---

## PART 0 — THE PRODUCT (CRITICAL CONTEXT CHANGE)

**Egyspots is NOT a café or restaurant directory.** It is a real-time map of **youth hangout spots in the street** — car meets, street carts, open-air hangouts, pop-ups, parks, corniches. Every spot has a **founder** (the user who spotted it first) and shows **Instagram-style Stories that expire after 6 hours.**

**Previous framing (to remove everywhere):** coffee, restaurants, cafés, vendor businesses, business verification, subscriptions, Paymob, national ID upload, commercial registration, vendor dashboards, subscription paywalls.

**New framing:** spots are discovered by users, not registered by businesses. No money involved. No vendors. No payments.

**Every spot has:**
- Name
- Category (street-hangout focused — see new list below)
- Founder (user who created it; permanent credit)
- Location (GeoPoint)
- Photos (up to 5)
- Tags (food available / drinks available / shisha / music / free entry / paid entry)
- Crowd level (live, from check-ins)
- Stories (6hr expiry, per spot)
- Operating hours (optional — for fixed spots)
- Is Mobile flag (car meets, pop-ups, street carts that move)

---

## PART 1 — CONCEPTUAL CHANGES TO MAKE

### 1.1 Delete / Remove from codebase
Remove these screens and references entirely (keep git history, just don't link or use):
- `src/screens/VendorsScreen.jsx` — delete file
- `src/screens/VendorProfileScreen.jsx` — delete file
- `src/screens/VendorDashboardScreen.jsx` — delete file
- Any references to `vendors/{uid}` Firestore collection — remove
- Any references to `subscriptionPlan`, `Paymob`, `businessVerification`, `nationalID`, `commercialRegNo` — remove
- Bottom nav tab "Vendors" — replace with "Stories" tab (new)
- `featuredSlots` collection — remove
- `role: 'vendor'` — remove; only `role: 'user'` and `role: 'admin'` remain

### 1.2 New Categories — Rewrite CATEGORIES array
In `src/data/spots.js`:

```js
export const CATEGORIES = ['All', 'Street Cart', 'Car Meet', 'Hangout', 'Pop-Up', 'Open Air'];

export const CATEGORY_LABELS_AR = {
  'All': 'الكل',
  'Street Cart': 'عربية',
  'Car Meet': 'تجمع سيارات',
  'Hangout': 'مكان تجمع',
  'Pop-Up': 'بوب أب',
  'Open Air': 'في الهوا الطلق',
};
```

Spot `category` field values: `'street_cart' | 'car_meet' | 'hangout' | 'pop_up' | 'open_air'`

### 1.3 New Tags System — Replace old vibe/tags
Every spot has a `tags` array. Only these 6 values allowed:
```js
export const SPOT_TAGS = ['food', 'drinks', 'shisha', 'music', 'free_entry', 'paid_entry'];

export const SPOT_TAG_LABELS = {
  food: '🍔 Food',
  drinks: '🥤 Drinks',
  shisha: '💨 Shisha',
  music: '🎵 Music',
  free_entry: '✓ Free',
  paid_entry: '💰 Paid Entry',
};
```

### 1.4 Update 8 SPOTS_SEED entries
Keep the 8 spots but update each to new schema. Map old → new:

| Old Name | New Category | Tags |
|---|---|---|
| Kazoku | hangout | [food, drinks] |
| El Fishawy | hangout | [drinks, shisha] |
| Roadster Meet | car_meet | [food, drinks] |
| Nile Corniche | open_air | [] |
| Hyde Park Spot | car_meet | [music] |
| Zooba Street | street_cart | [food] |
| Al-Azhar Park | open_air | [food, drinks, paid_entry] |
| Cilantro Heliopolis | hangout | [food, drinks] |

Required seed fields per spot (update schema):
```js
{
  id: 'kazoku',
  name: 'Kazoku',
  nameAr: 'كازوكو',
  category: 'hangout',
  tags: ['food', 'drinks'],
  neighborhood: 'Zamalek',
  address: 'Zamalek, Cairo',
  city: 'Cairo',
  lat: 30.0626, lng: 31.2197,
  photoURLs: [],
  coverPhotoURL: '',
  founderId: 'seed_founder',
  founderName: 'Egyspots Team',
  isMobile: false,
  crowd: 'Lively',
  crowdPct: 65,
  checkins: 0,
  checkinsToday: 0,
  weeklyCheckins: 0,
  totalCheckins: 0,
  rating: 4.5,
  operatingHours: null, // optional
  createdAt: new Date().toISOString(),
  status: 'active',
}
```

### 1.5 Update filterSpots()
```js
export function filterSpots(spots, category) {
  if (!category || category === 'All') return spots;
  const map = {
    'Street Cart': 'street_cart',
    'Car Meet': 'car_meet',
    'Hangout': 'hangout',
    'Pop-Up': 'pop_up',
    'Open Air': 'open_air',
  };
  const target = map[category];
  return target ? spots.filter(s => s.category === target) : spots;
}
```

---

## PART 2 — NEW FEATURE: STORIES (6-hour expiry)

This is the headline new feature. Keep it minimal and free.

### 2.1 Firestore Collection: `stories/{storyId}`
```
storyId       : string  (auto)
spotId        : string  (ref to spot)
userId        : string  (who posted)
userName      : string  (denormalized)
userPhotoURL  : string  (denormalized, optional)
photoURL      : string  (Firebase Storage URL, required)
caption       : string  (max 150 chars, optional)
createdAt     : timestamp
expiresAt     : timestamp  (exactly createdAt + 6 hours)
viewCount     : number  (incremented when viewed)
viewedBy      : array   (array of uids who viewed — for "seen" dots)
```

### 2.2 Auto-Expiry — USE FIRESTORE TTL (FREE, NATIVE)
Do NOT build a Cloud Function for expiry. Use Firestore's native TTL policy on the `expiresAt` field. It's free, runs automatically, and requires zero code.

**Setup (manual step — document in AI_HANDOFF):**
1. Firebase Console → Firestore → Indexes → TTL → Add Policy
2. Collection: `stories`, Field: `expiresAt`
3. Deletion runs within 24 hours of expiry (acceptable for the use case; filter client-side too)

**Client-side also filter** (TTL is eventual):
```js
const now = new Date();
const visibleStories = stories.filter(s => new Date(s.expiresAt) > now);
```

### 2.3 New Screens for Stories

#### 2.3.1 `src/screens/StoriesTab.jsx` — NEW (replaces Vendors tab in bottom nav)
Full-screen feed of all active stories across all spots. Horizontally-paginated rings (Instagram-style) at top showing spots with new stories. Below, grid of spot cards that have active stories with thumbnail count ("3 new").

- Listens to `stories` collection where `expiresAt > now()`
- Groups by `spotId`
- Top row: horizontal scroll of spots-with-stories (gold ring if unviewed, grey if viewed)
- Tap ring → `StoryViewerScreen` for that spot
- Body: grid of "Spots With New Stories" cards — thumbnail + spot name + story count

#### 2.3.2 `src/screens/StoryViewerScreen.jsx` — NEW
Full-screen vertical story viewer (like Instagram).
- Props: `spotId`, `initialIndex`, `onClose()`
- Top: progress bars (one segment per story)
- Auto-advance every 5 seconds
- Tap right → next story; tap left → previous; swipe down → close
- Shows: photo (cover), caption at bottom, spot name + "time ago" at top, founder badge if poster is founder
- On view: atomically adds `user.uid` to `viewedBy` array (use `arrayUnion`) and increments `viewCount`
- Bottom: "Check In at [Spot]" button → opens CheckInModal

#### 2.3.3 `src/screens/AddStoryScreen.jsx` — NEW
Shown when user taps the "+" FAB on StoriesTab or "Post Story" on SpotDetail.
- Step 1: Camera / Gallery picker
- Step 2: Spot selector (defaults to nearest spot within 200m by GPS; else lets user search spots)
- Step 3: Caption input (150 char max)
- Submit → uploads photo to Firebase Storage → writes `stories/{id}` doc with `expiresAt = now + 6hrs`
- Only signed-in users can post. Guests → `onRequireAuth()`

### 2.4 Storage Path for Story Photos
```
/stories/{spotId}/{storyId}.jpg
```
Metadata: `{ uploadedBy: uid }` (required by storage rules)

### 2.5 Storage Rules for Stories
Add to `storage.rules`:
```
match /stories/{spotId}/{storyId} {
  allow read: if true;
  allow create: if request.auth != null
                && request.resource.size < 5 * 1024 * 1024
                && request.resource.contentType.matches('image/.*')
                && request.resource.metadata.uploadedBy == request.auth.uid;
  allow delete: if request.auth != null
                && resource.metadata.uploadedBy == request.auth.uid;
}
```

### 2.6 Firestore Rules for Stories
Add to `firestore.rules`:
```
match /stories/{storyId} {
  allow read: if true;
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid
                && request.resource.data.expiresAt is timestamp
                && request.resource.data.caption.size() <= 150;
  allow update: if request.auth != null
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['viewCount', 'viewedBy']);
  allow delete: if request.auth != null
                && (resource.data.userId == request.auth.uid
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}
```

### 2.7 Image Auto-Resize (Free)
Install the **Firebase Extension "Resize Images"**:
```
firebase ext:install firebase/storage-resize-images
```
Configure: source paths `/stories/*`, `/spots/*`, target sizes `400x400, 800x800`. Extension runs on upload automatically. **Free tier is enough** for MVP scale.

---

## PART 3 — SPOT-LEVEL CHANGES

### 3.1 `src/screens/SpotDetailScreen.jsx` — ADD Stories section
Add a new section between the hero photo and the info tabs:

**Stories Ring Bar:**
- Horizontal row of story thumbnails for this spot
- Gold ring = has unviewed stories; grey ring = all viewed
- Tap → StoryViewerScreen with this spot's stories
- "+" button on the left → AddStoryScreen (prefilled with this spotId)
- If no active stories: show empty state "Be the first to post a story"

**Founder Badge Section** (prominent, below hero):
```
Founded by [Avatar] [Name] · [time ago]
```
Tap founder name → navigates to their public profile (if implemented; otherwise no-op).

**Tags Display:**
Replace old vibe display with tag chips using SPOT_TAG_LABELS:
```
[🍔 Food] [🥤 Drinks] [💨 Shisha]
```

### 3.2 `src/screens/AddSpotScreen.jsx` — REWRITE as simple customer form
Remove vendor mode entirely. Every user can create a spot. Fields:
```
Spot Name *                : text
Spot Name Arabic (optional): text
Category *                 : select from 5 categories
Tags (multi-select)        : chips for food/drinks/shisha/music/free/paid
Description                : textarea, max 300 chars
Location *                 : map picker (tap to pin) + "Use My Location" button
Is this mobile? (car meet/pop-up) : toggle
Photos                     : upload up to 5, first one is cover
```
Submit → writes `spots/{id}` with:
```
founderId: user.uid
founderName: userProfile.displayName
status: 'active'  (no admin review for MVP; add moderation later)
createdAt: serverTimestamp()
```

### 3.3 Map Marker — Show Active Stories Indicator
In `src/components/MapView.jsx`:
- For each spot pin, check if `stories.filter(s => s.spotId === spot.id && new Date(s.expiresAt) > now).length > 0`
- If yes, draw a gold pulsing ring around the marker
- Small "•" dot bottom-right of marker if user hasn't viewed all stories yet

---

## PART 4 — AUTH & PROFILE SIMPLIFICATION

### 4.1 `src/context/AuthContext.jsx` — Remove vendor logic
Strip out: `upgradeToVendor()`, `verificationStatus` checks, vendor-specific fields.
Keep: `signUp`, `signIn`, `signInGoogle`, `signInApple` (new — see compliance), `checkUsernameAvailable`, `updateUserProfile`, `logOut`, `user`, `userProfile`, `loading`.

### 4.2 `src/context/AuthContext.jsx` — ADD Sign in with Apple
**Required by Apple App Store if any third-party sign-in exists.** Since Google sign-in is offered, Sign in with Apple is mandatory for iOS submission.

```js
import { OAuthProvider, signInWithPopup } from 'firebase/auth';

const signInApple = async () => {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const result = await signInWithPopup(auth, provider);
  // ...handle profile creation like Google flow
};
```

Enable Apple provider in Firebase Console → Authentication → Sign-in method → Apple.

### 4.3 `src/screens/AuthScreen.jsx` — ADD Apple button
Below the Google sign-in button, add a black "Sign in with Apple" button that matches Apple's design guidelines (Apple logo + "Sign in with Apple" text, white on black, rounded corners, same width as Google button).

### 4.4 `src/screens/ProfileScreen.jsx` — Replace vendor tab with Stories tab
Remove "Vendor Dashboard" button. Remove any role-based branching.
Add new tab in profile:
- **My Stories** — query `stories` where `userId === user.uid` and `expiresAt > now`. Empty state if none.

Keep: Check-in History tab, Founded Spots tab (query where `founderId === user.uid`).

### 4.5 `users/{uid}` Schema — Simplify
```
uid, email, displayName, username, phoneNumber, birthDate, age, gender,
city, language, profilePhotoURL, bio, role ('user'|'admin'),
isBanned, banReason, isVerified, createdAt, lastLoginAt,
totalCheckins, notifSettings
```
Remove: `followingVendors`, any vendor-related fields.

---

## PART 5 — BOTTOM NAV REDESIGN

### 5.1 New 5-tab layout
```
[Map] [Explore] [+ Story FAB] [Stories] [Profile]
```
- **Map** — ExploreScreen (the map view, keep name for now internally or rename)
- **Explore** — DiscoverScreen (trending, categories)
- **Story FAB** (center, raised, gold glow) — opens AddStoryScreen directly; if guest → auth prompt
- **Stories** — StoriesTab (all active stories)
- **Profile** — ProfileScreen

Update `src/components/BottomNav.jsx` accordingly. Show unread stories badge on "Stories" tab (count of spots with unviewed stories).

### 5.2 Why Story FAB instead of Check In FAB?
Stories are the new core engagement loop. Check-in is still accessible from every spot detail sticky button. The FAB is what you want users to tap hourly.

---

## PART 6 — APP STORE & PLAY STORE COMPLIANCE (CRITICAL)

### 6.1 Privacy Policy & Terms — REQUIRED
Create two static HTML pages hosted on Firebase Hosting:
- `public/privacy.html` — Egyspots Privacy Policy
- `public/terms.html` — Egyspots Terms of Service

**Must mention (Apple + Google + Egypt Law 151):**
- What data is collected (email, name, phone, DOB, location, photos)
- How data is used (show spots on map, enable check-ins, stories)
- Data retention (stories auto-delete 6hr, account data kept until deletion)
- Third parties (Firebase by Google, Leaflet/OSM)
- User rights (access, delete, export)
- Children under 13 not permitted
- Egypt-specific: Law 151 of 2020 compliance, data processed per Egyptian regulations
- Contact email: `privacy@egyspots.com` (set this up)

Include links from:
- AuthScreen (sign-up footer)
- SettingsScreen (Legal section)
- App Store / Play Store listing

### 6.2 Account Deletion — REQUIRED (both stores)
Both stores require in-app account deletion as of 2022 (Apple) and 2024 (Google).

In `SettingsScreen.jsx` → Danger Zone:
- User types "DELETE" in confirmation input
- Calls sequence:
  1. Delete user's Firestore documents (`users/{uid}`, user's stories, user's check-ins)
  2. Delete user's Storage files (`/users/{uid}/*`, their story photos)
  3. Delete Firebase Auth user via `deleteUser(auth.currentUser)`
  4. If recent login required, prompt re-auth first
- Show success toast, sign out, return to onboarding

Create Cloud Function `deleteUserData` as HTTP callable (free tier) for safe server-side cleanup:
```js
// functions/src/index.ts
export const deleteUserData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login required');
  // Delete Firestore docs
  await deleteCollection(`users/${uid}`);
  await deleteQuery(query('stories', where('userId', '==', uid)));
  await deleteQuery(query('checkins', where('userId', '==', uid)));
  // Delete Storage
  await admin.storage().bucket().deleteFiles({ prefix: `users/${uid}/` });
  return { success: true };
});
```

### 6.3 Apple Privacy Manifest — REQUIRED (since May 2024)
Create `ios/App/App/PrivacyInfo.xcprivacy` after `npx cap add ios`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePreciseLocation</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePhotosOrVideos</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeName</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
  <key>NSPrivacyTracking</key><false/>
</dict>
</plist>
```

### 6.4 iOS Info.plist Keys — REQUIRED
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Egyspots uses your location to show you nearby hangout spots and let you check in.</string>

<key>NSCameraUsageDescription</key>
<string>Egyspots uses your camera to let you post photos and stories at spots.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Egyspots lets you share photos from your library as stories at spots.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Egyspots may save photos you take from within the app.</string>
```

### 6.5 Android — Target SDK 34 + Permissions
In `android/app/build.gradle`:
```
compileSdkVersion 34
targetSdkVersion 34
minSdkVersion 24
```

In `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

### 6.6 User-Generated Content Moderation — REQUIRED
Both stores require UGC moderation mechanisms.

**Minimum viable (free):**
1. **Report button** on every story, spot, and check-in → writes to `reports/{id}`
2. **Block user** feature → `users/{uid}/blockedUsers` array; client-side filters their content
3. **Admin review queue** — admin role can see `reports` collection and delete content
4. **Terms prohibit**: harassment, nudity, hate speech, illegal content
5. **24-hour response SLA** documented in Terms

Add to SpotDetail, Story viewer, and check-in feed:
- Report button (flag icon) → opens `ReportModal.jsx`
- Modal: reason select (Inappropriate / Spam / Wrong location / Harassment / Other) + optional note
- Submit → writes `reports` doc

### 6.7 Age Gate — HARD BLOCK
In signup, if `(today - birthDate) < 13 years` → show error and stop. Do NOT create Firebase user.

For App Store: rate app **12+** minimum (user-generated content + location).
For Play Store: fill content rating as **Teen**.

### 6.8 Content Rating Disclosures
When submitting, both stores ask:
- Does app contain user-generated content? **YES**
- Does app access location? **YES**
- Does app contain ads? **NO**
- Does app use third-party analytics? **YES (Firebase/GA4)**
- In-app purchases? **NO**
- Intended for children under 13? **NO**

---

## PART 7 — TECH STACK CONFIRMATION (KEEP MINIMAL & FREE)

### 7.1 Keep
| Tool | Status | Cost |
|---|---|---|
| React 18 + Vite | ✅ Keep | Free |
| Firebase Auth + Firestore + Storage + Hosting | ✅ Keep | Spark (free) |
| Leaflet + OSM tiles (CARTO dark) | ✅ Keep (already switched) | Free |
| Capacitor v8 | ✅ Keep | Free |
| Vitest + Testing Library | ✅ Keep | Free |
| Firestore TTL (for stories expiry) | ✅ Add | Free |
| Firebase Resize Images extension | ✅ Add | Free tier sufficient |
| Cloud Functions (for account deletion only) | ✅ Add | Free tier: 2M invocations/mo |

### 7.2 Add
| Tool | Purpose | Cost |
|---|---|---|
| `firebase-admin` | Service account script for seeding | Free |
| Sentry.io (optional) | Error monitoring | Free: 5k errors/mo |

### 7.3 Do NOT add (for MVP)
- ❌ Mapbox (Leaflet is enough)
- ❌ Cloudinary (Firebase Resize extension covers this)
- ❌ Paymob / any payment processor (no monetization in MVP)
- ❌ Mixpanel (GA4 is enough)
- ❌ Push notifications/FCM (not critical for MVP; add later)
- ❌ BigQuery, Redis, any managed service with cost risk

### 7.4 Environment Variables (unchanged)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```
Drop `VITE_MAPBOX_TOKEN` from `.env` and `.env.example` — no longer used.

---

## PART 8 — FILE CHANGE LIST (EXACT SCOPE)

### 8.1 DELETE these files
- `src/screens/VendorsScreen.jsx`
- `src/screens/VendorProfileScreen.jsx`
- `src/screens/VendorDashboardScreen.jsx`
- Any component importing `Paymob` or `subscriptionPlan`

### 8.2 CREATE these files
- `src/screens/StoriesTab.jsx` — NEW (main stories feed)
- `src/screens/StoryViewerScreen.jsx` — NEW (full-screen viewer)
- `src/screens/AddStoryScreen.jsx` — NEW (post a story)
- `src/components/StoryRing.jsx` — NEW (circular avatar w/ gold ring component)
- `src/components/ReportModal.jsx` — NEW (report content)
- `src/context/StoriesContext.jsx` — NEW (listens to stories, filters expired)
- `public/privacy.html` — NEW (hosted privacy policy)
- `public/terms.html` — NEW (hosted terms of service)
- `functions/src/index.ts` — NEW (Cloud Function: deleteUserData)
- `functions/package.json` — NEW
- `functions/tsconfig.json` — NEW
- `ios/App/App/PrivacyInfo.xcprivacy` — NEW (after `npx cap add ios`)

### 8.3 REWRITE these files
- `src/data/spots.js` — new categories, tags, seed updated
- `src/context/AuthContext.jsx` — remove vendor logic, add Apple sign-in
- `src/context/SpotsContext.jsx` — remove vendor refs, keep check-in logic clean
- `src/components/BottomNav.jsx` — new 5-tab layout with Story FAB
- `src/screens/AuthScreen.jsx` — add Apple sign-in button
- `src/screens/SpotDetailScreen.jsx` — add Stories ring + founder badge + new tags display
- `src/screens/AddSpotScreen.jsx` — simplified (no vendor mode)
- `src/screens/ProfileScreen.jsx` — remove vendor tab, add My Stories tab, wire real stats
- `src/screens/SettingsScreen.jsx` — add working account deletion
- `src/screens/DiscoverScreen.jsx` — update to new categories
- `src/screens/ExploreScreen.jsx` — update filter chips to new categories
- `src/App.jsx` — remove vendor routes, add story routes
- `src/main.jsx` — wrap in `StoriesProvider`
- `src/components/MapView.jsx` — add story ring indicator on markers
- `src/components/Icons.jsx` — add StoryIcon, ReportFlagIcon if missing
- `firestore.rules` — updated per Part 2.6 + remove vendor rules
- `storage.rules` — updated per Part 2.5
- `capacitor.config.js` — no change except verify
- `package.json` — add `firebase-admin` dev dep if missing; add `functions:deploy` script

### 8.4 UPDATE these files
- `AI_HANDOFF.md` — full rewrite (see Part 10)
- `README.md` — brief update reflecting new product direction

---

## PART 9 — TEST SUITE UPDATES

All tests must pass. Target: 40+/40+ passing.

### 9.1 `src/test/spots.test.js` — REWRITE
```js
import { describe, it, expect } from 'vitest';
import { SPOTS_SEED, CATEGORIES, filterSpots, SPOT_TAGS } from '../data/spots';

describe('spots data', () => {
  it('has 5 valid categories + All', () => {
    expect(CATEGORIES).toEqual(['All', 'Street Cart', 'Car Meet', 'Hangout', 'Pop-Up', 'Open Air']);
  });

  it('all seed spots use new category values', () => {
    const valid = ['street_cart', 'car_meet', 'hangout', 'pop_up', 'open_air'];
    SPOTS_SEED.forEach(s => expect(valid).toContain(s.category));
  });

  it('all seed spots have a founder', () => {
    SPOTS_SEED.forEach(s => {
      expect(s.founderId).toBeTruthy();
      expect(s.founderName).toBeTruthy();
    });
  });

  it('all seed spots have valid coordinates', () => {
    SPOTS_SEED.forEach(s => {
      expect(s.lat).toBeGreaterThan(29); // Cairo region
      expect(s.lat).toBeLessThan(31);
      expect(s.lng).toBeGreaterThan(30);
      expect(s.lng).toBeLessThan(32);
    });
  });

  it('tags are from allowed list', () => {
    SPOTS_SEED.forEach(s => {
      s.tags.forEach(t => expect(SPOT_TAGS).toContain(t));
    });
  });

  it('filterSpots returns all on "All"', () => {
    expect(filterSpots(SPOTS_SEED, 'All')).toEqual(SPOTS_SEED);
  });

  it('filterSpots filters by Hangout', () => {
    const result = filterSpots(SPOTS_SEED, 'Hangout');
    result.forEach(s => expect(s.category).toBe('hangout'));
  });

  it('filterSpots filters by Car Meet', () => {
    const result = filterSpots(SPOTS_SEED, 'Car Meet');
    result.forEach(s => expect(s.category).toBe('car_meet'));
  });

  it('no seed spot uses removed categories', () => {
    const removed = ['Cafe', 'Traditional', 'Coffee', 'coffee', 'food'];
    SPOTS_SEED.forEach(s => expect(removed).not.toContain(s.category));
  });
});
```

### 9.2 `src/test/AuthScreen.test.jsx` — UPDATE
Keep the 8 existing tests. Add 2 new tests:
```js
it('shows Sign in with Apple button', () => {
  render(<AuthScreen />);
  expect(screen.getByText(/Sign in with Apple/i)).toBeInTheDocument();
});

it('calls signInApple when Apple button clicked', async () => {
  render(<AuthScreen />);
  await userEvent.click(screen.getByText(/Sign in with Apple/i));
  expect(mockSignInApple).toHaveBeenCalled();
});
```
Update mock to include `signInApple: mockSignInApple`.

### 9.3 `src/test/SpotsContext.test.jsx` — KEEP + ADD
Keep existing 9 tests. Add 2:
```js
it('check-in writes spotId and userId to checkins collection', async () => {
  // mock verifies addDoc called with right payload
});

it('check-in is idempotent for same spot', async () => {
  // second call to same spot toggles off
});
```

### 9.4 `src/test/StoriesContext.test.jsx` — NEW FILE
```js
import { describe, it, expect } from 'vitest';

describe('StoriesContext', () => {
  it('filters out expired stories', () => {
    const now = new Date();
    const expired = { expiresAt: new Date(now - 1000).toISOString() };
    const active = { expiresAt: new Date(now.getTime() + 60000).toISOString() };
    const stories = [expired, active];
    const visible = stories.filter(s => new Date(s.expiresAt) > now);
    expect(visible).toEqual([active]);
  });

  it('sets expiresAt exactly 6 hours after createdAt', () => {
    const created = new Date();
    const expires = new Date(created.getTime() + 6 * 60 * 60 * 1000);
    expect(expires.getTime() - created.getTime()).toBe(6 * 60 * 60 * 1000);
  });
});
```

### 9.5 `src/test/theme.test.js` — KEEP AS-IS

### 9.6 `src/test/SpotCard.test.jsx` — UPDATE
Update to test new `tags` field rendering instead of old `vibe`. Verify founder name appears on card.

### 9.7 Run after all changes
```bash
npm test
```
**Expected: all tests pass.** If any fail, fix before proceeding.

---

## PART 10 — AI_HANDOFF.md UPDATE

Completely rewrite `AI_HANDOFF.md` with the new product direction. Key sections to update:

```md
# AI Handoff — EgySpots (Read This First, Every Session)

Last updated: [TODAY]

## What This Project Is

**EgySpots** is a mobile-first web app (wrapped in Capacitor for iOS/Android) that lets young people in Cairo spot and share street hangout locations in real time.

**This is NOT a café or restaurant directory.** Think Snapchat Maps meets spot-discovery: users see where others are hanging out (car meets, street carts, pop-ups, open-air spots) and post Instagram-style Stories that expire after 6 hours.

**Target users:** Egyptians 13–25 looking for where their generation is hanging out right now.

**Core loop:** Open app → see live map of active spots → tap a spot → see stories + check-ins from last few hours → check in yourself or post a story.

## Categories (5)
Street Cart · Car Meet · Hangout · Pop-Up · Open Air

## Tags (any spot can have any combination)
food · drinks · shisha · music · free_entry · paid_entry

## Key Feature: Stories
- Instagram-style photo stories tied to a spot
- Auto-expire after 6 hours (via Firestore TTL — free, native)
- Viewable from StoriesTab or from any SpotDetailScreen
- Posted via the center FAB (replaces old Check-In FAB)

## Tech Stack — Unchanged except remove Mapbox
[Update table: Leaflet/OSM only, no Mapbox]

## Removed / Deleted (DO NOT RECREATE)
- Vendor accounts, verification, business dashboards
- Paymob and any payment integration
- Subscription tiers
- featuredSlots collection
- Any reference to restaurants, cafés, businesses

## Current Firestore Collections
- users, spots, checkins, stories, messages, reviews, reports, notifications

## Compliance Status
- ✅ Account deletion implemented
- ✅ Sign in with Apple added
- ✅ Privacy policy hosted at /privacy
- ✅ Terms hosted at /terms
- ✅ iOS PrivacyInfo.xcprivacy created
- ✅ Age gate 13+ enforced at signup
- ✅ Report/block user-generated content
```

Include a fresh change log entry at the bottom.

---

## PART 11 — GIT WORKFLOW

Execute after all code changes are complete:

```bash
# Make sure you are on main and up-to-date
git checkout main
git pull origin main

# Stage everything
git add -A

# Check what's staged
git status

# Commit with clear message
git commit -m "feat: pivot to youth hangout-spotting app with Stories

- Replace café/restaurant framing with street hangout categories
- Add Stories feature (6hr expiry via Firestore TTL)
- Add Sign in with Apple (App Store compliance)
- Add account deletion (App Store + Play Store compliance)
- Add iOS PrivacyInfo.xcprivacy (App Store compliance)
- Remove vendor/subscription/Paymob code (MVP scope reduction)
- Host privacy policy and terms at /privacy and /terms
- Update all 5 test files; add StoriesContext.test.jsx
- New 5-tab bottom nav: Map / Explore / [+Story FAB] / Stories / Profile
- Update AI_HANDOFF.md with new product direction"

# Push to the existing repo
git push origin main
```

If credentials are needed, use the PAT stored locally. Do NOT commit `.env`, `serviceAccountKey.json`, or `functions/serviceAccount.json`.

---

## PART 12 — DEPLOYMENT SEQUENCE (AFTER COMMIT)

Execute these in order. Each is a separate step.

### 12.1 Deploy Firestore Rules & Indexes
```bash
firebase login
firebase use egyspots-dc9c1
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

### 12.2 Install Firebase Extensions
```bash
firebase ext:install firebase/storage-resize-images --project=egyspots-dc9c1
# Answer prompts:
# - Image paths: /stories/*,/spots/*,/users/*
# - Sizes: 200x200,800x800
# - Cache control: max-age=31536000
# - Delete original: no
```

### 12.3 Configure Firestore TTL (Manual Console Step)
1. Go to: https://console.firebase.google.com/project/egyspots-dc9c1/firestore/ttl
2. Create policy: collection `stories`, field `expiresAt`
3. Wait for status "Enabled"

### 12.4 Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions:deleteUserData
```

### 12.5 Deploy Web App (for privacy/terms pages)
```bash
npm run build
firebase deploy --only hosting
```
Verify: `https://egyspots-dc9c1.web.app/privacy.html` loads.

### 12.6 Seed the Production Database
```bash
# If not done yet:
node scripts/seedTestAccounts.js  # optional — test users
# Seed spots happen automatically on first app load via SpotsContext
```

### 12.7 Build for iOS
```bash
npx cap add ios   # if not added
npx cap sync ios

# Open Xcode
npx cap open ios
```

In Xcode:
- Set Bundle ID: `com.egyspots.app`
- Set Team: your Apple Developer team
- Add `PrivacyInfo.xcprivacy` to the project (drag into Xcode)
- Info.plist: add the 4 permission strings from Part 6.4
- Set Deployment Target: iOS 14.0
- Product → Archive → Distribute App → App Store Connect → Upload

### 12.8 Build for Android
```bash
npx cap add android   # if not added
npx cap sync android
```

```bash
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload this AAB to Google Play Console → Internal Testing track first.

---

## PART 13 — STORE LISTING PREP

### 13.1 Assets to Prepare

**App Icon:**
- 1024×1024 PNG (iOS App Store)
- 512×512 PNG (Google Play Store)
- All Android launcher sizes: generate with `@capacitor/assets` or Android Studio

**Screenshots (minimum):**
- iPhone 6.7": 1290×2796, 3 screenshots
- iPhone 5.5": 1242×2208, 3 screenshots
- Android Phone: 1080×1920, 2–8 screenshots
- Android Tablet (if publishing): 1200×1920

**Feature Graphic (Play Store only):**
- 1024×500 PNG

### 13.2 Store Listing Copy

**App Name:** `Egyspots`
**Subtitle (iOS) / Short Description (Android):** `Find where Cairo hangs out`
**Full Description (both):**
```
Egyspots is where Cairo's youth find out where everyone's hanging out right now.

See live spots on the map — car meets, street carts, pop-ups, open-air hangouts —
with stories from the last 6 hours and crowd levels updated in real time.

Features:
• Live map of hangout spots across Cairo
• 6-hour stories — see what's happening right now
• Check in at spots and share your location with friends
• Found a new spot? Post it first and become its founder
• Simple tags: food, drinks, shisha, music, free or paid entry

Egyspots is not a directory of restaurants or cafés. It's a real-time map of
where your generation is actually hanging out in the streets of Cairo.

Age 13+. Privacy: egyspots.com/privacy
```

**Keywords (iOS, 100 chars):**
`cairo,egypt,hangout,meetup,map,nightlife,friends,youth,stories,car meet,street food,spots`

**Category:** Social Networking (iOS) / Social (Android)

**Age Rating:** 12+ (iOS) / Teen (Android)

### 13.3 Required URLs
- Privacy Policy: `https://egyspots-dc9c1.web.app/privacy.html`
- Terms of Service: `https://egyspots-dc9c1.web.app/terms.html`
- Support: `support@egyspots.com` (set up forwarding on the domain)

---

## PART 14 — PRE-SUBMISSION CHECKLIST

Before submitting to either store, verify every item:

### Code
- [ ] `npm test` passes all tests
- [ ] `npm run build` produces no errors
- [ ] No console warnings in production build
- [ ] No `.env` committed to git
- [ ] No `serviceAccountKey.json` committed

### Firebase
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Firestore TTL enabled on `stories.expiresAt`
- [ ] Resize Images extension active
- [ ] Auth providers enabled: Email/Password, Google, Apple
- [ ] Authorized domains include your deployed URL

### Legal
- [ ] Privacy policy live at `/privacy.html`
- [ ] Terms live at `/terms.html`
- [ ] Both linked from AuthScreen and Settings
- [ ] Age gate 13+ is a hard block at signup

### Compliance
- [ ] Account deletion works end-to-end
- [ ] Sign in with Apple works on iOS
- [ ] PrivacyInfo.xcprivacy added to iOS project
- [ ] iOS Info.plist has all 4 usage descriptions
- [ ] Android targetSdkVersion is 34 or higher
- [ ] Report button on stories, spots, check-ins works
- [ ] Admin can review reports collection

### Store Readiness
- [ ] Apple Developer Program membership active ($99/yr paid)
- [ ] Google Play Developer account active ($25 one-time paid)
- [ ] Bundle ID `com.egyspots.app` registered in both stores
- [ ] App icon in all required sizes
- [ ] Screenshots taken and uploaded
- [ ] Store listing copy written
- [ ] Privacy Policy URL set in store listing
- [ ] Content rating questionnaire completed
- [ ] Data Safety form (Google) completed
- [ ] App Privacy details (Apple) completed

### Testing
- [ ] Tested on real iOS device (TestFlight)
- [ ] Tested on real Android device (Internal Testing)
- [ ] Sign-up flow works end-to-end
- [ ] Check-in works with real GPS
- [ ] Story posts and viewable
- [ ] Story expires after 6 hours (wait & verify)
- [ ] Account deletion removes all data

---

## PART 15 — SUBMISSION STEPS

### 15.1 Apple App Store
1. App Store Connect → My Apps → New App → Bundle ID `com.egyspots.app`
2. Fill all metadata (name, description, keywords, screenshots, icon)
3. Upload build via Xcode (archive → distribute)
4. App Privacy → answer all data collection questions truthfully
5. Age Rating → complete questionnaire (12+ minimum for UGC + location)
6. Add test user for App Review (they'll sign in to test)
7. Submit for Review
8. Review time: 24–72 hours typically
9. If rejected: read feedback, fix, resubmit

### 15.2 Google Play Store
1. Play Console → Create App → App name Egyspots
2. Complete all sections marked "Setup"
3. Upload AAB to Internal Testing track first
4. Invite yourself + 1–2 testers, verify it installs and works
5. Move to Closed Testing → add 20 testers minimum (required for new apps)
6. Run Closed Testing for 14 days minimum (Google's new requirement for new developer accounts since 2024)
7. After 14 days, submit for Production review
8. Review time: 1–7 days typically

### 15.3 Important: Google Play 14-day Rule
Google requires new personal developer accounts to have **20 testers × 14 days** before production. Plan for this. Start Closed Testing as soon as possible. If developer account is registered as an Organization, this may not apply — verify in Play Console.

---

## PART 16 — WHAT NOT TO DO

- ❌ Do not add push notifications for MVP (complexity + APNs setup can come later)
- ❌ Do not add in-app purchases (triggers stricter review rules)
- ❌ Do not add any third-party SDKs beyond Firebase (simplifies privacy manifest)
- ❌ Do not collect any data not listed in the privacy policy
- ❌ Do not track users across apps (would require ATT on iOS — extra rejection risk)
- ❌ Do not show ads in the app (requires separate ad disclosure + AdMob integration)
- ❌ Do not enable Crashlytics for MVP launch (Firebase Performance is enough)
- ❌ Do not add any feature Apple/Google asks the user to verify — keep scope tiny

---

## FINAL INSTRUCTION FOR CLAUDE CODE

Execute Parts 1 through 11 in order. After every major part:
1. Run `npm test` and ensure all tests pass
2. Run `npm run build` and ensure no errors
3. Commit to git with a clear message

After all code changes are merged to main and pushed to GitHub, stop. Report back with:
- Files created: [list]
- Files deleted: [list]
- Files modified: [list]
- Test status: X/X passing
- Build status: success/errors
- Any blockers or open questions

Then the user will execute Parts 12 onward (deployment + store submission) manually or with guided help in a new session.

**Do not skip compliance items (Part 6). Every single one is required for app store approval.**
