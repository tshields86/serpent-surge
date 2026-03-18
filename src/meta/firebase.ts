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

  const [{ initializeApp }, { getFirestore }, { getAuth }] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore'),
    import('firebase/auth'),
  ]);

  const app = initializeApp({ apiKey, authDomain, projectId });
  cached = { db: getFirestore(app), auth: getAuth(app) };
  return cached;
}
