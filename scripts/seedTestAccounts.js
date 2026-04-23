/**
 * Seed script: creates 5 test accounts in Firebase Auth + Firestore.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console →
 *      Project Settings → Service accounts → Generate new private key
 *   2. Save it as scripts/serviceAccountKey.json
 *   3. npm install -g firebase-tools   (one-time)
 *   4. npm install firebase-admin      (in project root)
 *   5. node scripts/seedTestAccounts.js
 *
 * All test accounts use password: Test1234!
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db   = admin.firestore();

const TEST_PASSWORD = 'Test1234!';

const TEST_USERS = [
  {
    email:       'ahmed@test.egyspots.com',
    displayName: 'Ahmed R.',
    avatar:      'AR',
    checkins:    23,
    activeCheckin: 'kazoku',
    bio:         'Cairo nights enthusiast 🌙',
  },
  {
    email:       'sara@test.egyspots.com',
    displayName: 'Sara M.',
    avatar:      'SM',
    checkins:    14,
    activeCheckin: null,
    bio:         'Coffee addict ☕',
  },
  {
    email:       'karim@test.egyspots.com',
    displayName: 'Karim A.',
    avatar:      'KA',
    checkins:    31,
    activeCheckin: 'elfishawy',
    bio:         'Street food explorer 🍜',
  },
  {
    email:       'nour@test.egyspots.com',
    displayName: 'Nour H.',
    avatar:      'NH',
    checkins:    8,
    activeCheckin: null,
    bio:         'New to Cairo spots!',
  },
  {
    email:       'youssef@test.egyspots.com',
    displayName: 'Youssef T.',
    avatar:      'YT',
    checkins:    47,
    activeCheckin: 'zoobastreet',
    bio:         'Local guide, born & raised 🇪🇬',
  },
];

// Seed messages per user across spots
const SEED_MESSAGES = [
  { userIdx: 0, spotId: 'kazoku',         text: 'This place is absolutely 🔥 tonight, everyone come through!' },
  { userIdx: 0, spotId: 'nilecorniche',   text: 'Nile view at midnight is unreal, highly recommend' },
  { userIdx: 0, spotId: 'alazharpark',    text: 'Perfect weather for a late stroll here 🌿' },
  { userIdx: 1, spotId: 'kazoku',         text: 'Just ordered the iced matcha, 10/10 vibes here' },
  { userIdx: 1, spotId: 'zoobastreet',    text: 'The koshary here is legit the best in Cairo' },
  { userIdx: 1, spotId: 'elfishawy',      text: 'So much history in this place, love the atmosphere' },
  { userIdx: 2, spotId: 'elfishawy',      text: 'The tea here is 🍵✨ come check it out' },
  { userIdx: 2, spotId: 'roadstermeet',   text: 'Some really clean builds here tonight, R34 spotted!' },
  { userIdx: 2, spotId: 'kazoku',         text: 'Great music tonight, DJ is killing it' },
  { userIdx: 3, spotId: 'alazharpark',    text: 'First time here, the views are incredible!' },
  { userIdx: 3, spotId: 'nilecorniche',   text: 'Brought my camera, golden hour was amazing 📸' },
  { userIdx: 4, spotId: 'zoobastreet',    text: 'This is my 3rd visit this week, addicted to the ful here' },
  { userIdx: 4, spotId: 'hydeparkspot',   text: 'Quiet tonight but a few nice cars. Good chill spot' },
  { userIdx: 4, spotId: 'cilantroheliopolis', text: 'Good wifi, solid for studying late night 📚' },
];

// Seed reviews per user
const SEED_REVIEWS = [
  { userIdx: 0, spotId: 'kazoku',       rating: 5, text: 'Best cafe in Zamalek, period. The shisha and music combo is perfect.' },
  { userIdx: 0, spotId: 'nilecorniche', rating: 5, text: 'The Nile view at night is something else. A must-visit for any Cairo local.' },
  { userIdx: 1, spotId: 'zoobastreet',  rating: 5, text: 'Authentic Egyptian street food at its finest. The koshary is incredible.' },
  { userIdx: 1, spotId: 'elfishawy',    rating: 4, text: 'Rich history, great tea. Gets very crowded on weekends though.' },
  { userIdx: 2, spotId: 'roadstermeet', rating: 4, text: 'Love the car meet scene here. Good people, great music.' },
  { userIdx: 2, spotId: 'elfishawy',    rating: 5, text: 'One of the most iconic spots in Cairo. The vibe is timeless.' },
  { userIdx: 3, spotId: 'alazharpark',  rating: 5, text: 'Beautiful park with amazing views of Islamic Cairo. Bring a camera!' },
  { userIdx: 4, spotId: 'zoobastreet',  rating: 5, text: 'I come here almost every week. The best ful and tamiya in the city.' },
  { userIdx: 4, spotId: 'hydeparkspot', rating: 3, text: 'Nice quiet spot when it is not too hot. Car meets are fun on Fridays.' },
];

async function createOrGetUser(userData) {
  try {
    const existing = await auth.getUserByEmail(userData.email);
    console.log(`  ✓ User already exists: ${userData.email} (uid: ${existing.uid})`);
    return existing;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email:       userData.email,
        password:    TEST_PASSWORD,
        displayName: userData.displayName,
      });
      console.log(`  ✓ Created user: ${userData.email} (uid: ${newUser.uid})`);
      return newUser;
    }
    throw e;
  }
}

async function main() {
  console.log('\n🌱 Seeding EgySpots test accounts...\n');

  const createdUsers = [];

  // 1. Create Auth users + Firestore profiles
  console.log('📝 Creating user accounts...');
  for (const userData of TEST_USERS) {
    const firebaseUser = await createOrGetUser(userData);
    createdUsers.push({ ...userData, uid: firebaseUser.uid });

    await db.collection('users').doc(firebaseUser.uid).set({
      uid:           firebaseUser.uid,
      email:         userData.email,
      displayName:   userData.displayName,
      avatar:        userData.avatar,
      photoURL:      null,
      checkins:      userData.checkins,
      activeCheckin: userData.activeCheckin,
      bio:           userData.bio,
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // 2. Seed messages
  console.log('\n💬 Seeding messages...');
  const messageBatch = db.batch();
  for (const msg of SEED_MESSAGES) {
    const user = createdUsers[msg.userIdx];
    const ref  = db.collection('messages').doc();
    messageBatch.set(ref, {
      spotId:     msg.spotId,
      text:       msg.text,
      userId:     user.uid,
      userName:   user.displayName,
      userAvatar: user.avatar,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${user.displayName} → ${msg.spotId}`);
  }
  await messageBatch.commit();

  // 3. Seed reviews
  console.log('\n⭐ Seeding reviews...');
  const reviewBatch = db.batch();
  for (const review of SEED_REVIEWS) {
    const user = createdUsers[review.userIdx];
    const ref  = db.collection('reviews').doc();
    reviewBatch.set(ref, {
      spotId:     review.spotId,
      userId:     user.uid,
      userName:   user.displayName,
      userAvatar: user.avatar,
      rating:     review.rating,
      text:       review.text,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    });
    // Update spot rating (simple average approximation)
    const spotRef = db.collection('spots').doc(review.spotId);
    reviewBatch.update(spotRef, {
      reviews: admin.firestore.FieldValue.increment(1),
    });
    console.log(`  ✓ ${user.displayName} → ${review.spotId} (${review.rating}★)`);
  }
  await reviewBatch.commit();

  console.log('\n✅ Seeding complete!\n');
  console.log('Test accounts (password: Test1234!):');
  for (const u of createdUsers) {
    console.log(`  ${u.email.padEnd(35)} → ${u.displayName} (${u.checkins} check-ins)`);
  }
  console.log('');

  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
