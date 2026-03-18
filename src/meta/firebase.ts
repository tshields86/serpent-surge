import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (apiKey && authDomain && projectId) {
  app = initializeApp({ apiKey, authDomain, projectId });
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn('Firebase not configured — leaderboard and analytics disabled');
}

export { db, auth };
