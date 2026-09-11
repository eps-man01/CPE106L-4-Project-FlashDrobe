import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

const userDoc = (uid: string) => doc(db, 'users', uid);

/**
 * FirestoreService handles user profile persistence only.
 * All other data (wardrobe, categories, outfits, body profiles)
 * stays in localStorage.
 */
export class FirestoreService {
  static async loadUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(userDoc(uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      // Strip uploadedTryOnPhoto — kept in localStorage only
      const { uploadedTryOnPhoto, ...profile } = data;
      return profile as UserProfile;
    } catch (err) {
      console.warn('Failed to load user profile:', err);
      return null;
    }
  }

  static async saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      // Strip uploadedTryOnPhoto — kept in localStorage only
      const { uploadedTryOnPhoto, ...data } = profile;
      await setDoc(userDoc(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save user profile:', err);
    }
  }

  static async initializeUserData(uid: string, profile: UserProfile): Promise<void> {
    try {
      const { uploadedTryOnPhoto, ...data } = profile;
      await setDoc(userDoc(uid), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to initialize user data:', err);
    }
  }
}
