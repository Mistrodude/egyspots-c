import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

export const deleteUserData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login required.');

  // Delete Firestore documents
  await db.doc(`users/${uid}`).delete().catch(() => {});

  const storySnap = await db.collection('stories').where('userId', '==', uid).get();
  await Promise.all(storySnap.docs.map((d) => d.ref.delete()));

  const checkinSnap = await db.collection('checkins').where('userId', '==', uid).get();
  await Promise.all(checkinSnap.docs.map((d) => d.ref.delete()));

  // Delete Storage files
  const bucket = storage.bucket();
  await bucket.deleteFiles({ prefix: `users/${uid}/` }).catch(() => {});

  return { success: true };
});
