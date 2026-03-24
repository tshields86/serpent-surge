import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

export const firebaseConfigured = !!(apiKey && authDomain && projectId);

let cached: { db: Firestore; auth: Auth } | null = null;

export async function getFirebase(): Promise<{ db: Firestore; auth: Auth } | null> {
  if (!firebaseConfigured) return null;
  if (cached) return cached;

  const [{ initializeApp }, { getFirestore }, { initializeAuth, indexedDBLocalPersistence }] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore'),
    import('firebase/auth'),
  ]);

  const app = initializeApp({ apiKey, authDomain, projectId });
  // Use initializeAuth with indexedDB persistence to avoid issues with
  // Capacitor's capacitor:// scheme where getAuth() hangs on signInAnonymously
  const auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
  });
  cached = { db: getFirestore(app), auth };
  return cached;
}
