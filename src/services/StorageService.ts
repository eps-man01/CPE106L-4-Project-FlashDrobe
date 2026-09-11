import { UserBodyProfile, TryOnGenerationResult } from '../types';

const STORAGE_KEYS = {
  BODY_PROFILE: 'flashdrobe_user_body_profile_v1',
  TRYON_CACHE: 'flashdrobe_tryon_cache_v2',
};

/**
 * StorageService handles client-side localStorage persistence
 * for body photographs, representations, and try-on results.
 */
export class StorageService {
  /**
   * Load the active UserBodyProfile
   */
  public static loadBodyProfile(userId: string = 'user_default'): UserBodyProfile | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.BODY_PROFILE}_${userId}`);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (err) {
      console.warn('Failed to load body profile:', err);
      return null;
    }
  }

  /**
   * Save or update UserBodyProfile
   */
  public static saveBodyProfile(profile: UserBodyProfile): void {
    try {
      const key = `${STORAGE_KEYS.BODY_PROFILE}_${profile.userId}`;
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save body profile to local storage:', err);
    }
  }

  /**
   * Permanently delete user body profile and all associated photographs
   */
  public static deleteBodyProfile(userId: string = 'user_default'): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.BODY_PROFILE}_${userId}`);
      this.clearTryOnCache(userId);
    } catch (err) {
      console.error('Failed to delete body profile:', err);
    }
  }

  /**
   * Retrieve cached try-on result for an outfit + angle combination
   */
  public static getCachedTryOn(
    userId: string,
    cacheKey: string
  ): TryOnGenerationResult | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.TRYON_CACHE}_${userId}`);
      if (!raw) return null;
      const cacheMap = JSON.parse(raw);
      return cacheMap[cacheKey] || null;
    } catch {
      return null;
    }
  }

  /**
   * Store generated try-on result in user cache
   */
  public static cacheTryOn(
    userId: string,
    cacheKey: string,
    result: TryOnGenerationResult
  ): void {
    try {
      const key = `${STORAGE_KEYS.TRYON_CACHE}_${userId}`;
      const raw = localStorage.getItem(key);
      const cacheMap = raw ? JSON.parse(raw) : {};
      cacheMap[cacheKey] = {
        ...result,
        cachedAt: new Date().toISOString(),
      };
      // Keep cache size bounded to last 15 looks
      const keys = Object.keys(cacheMap);
      if (keys.length > 15) {
        delete cacheMap[keys[0]];
      }
      localStorage.setItem(key, JSON.stringify(cacheMap));
    } catch (e) {
      console.warn('TryOn cache save notice:', e);
    }
  }

  /**
   * Clear all generated try-on results
   */
  public static clearTryOnCache(userId: string = 'user_default'): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.TRYON_CACHE}_${userId}`);
    } catch (e) {
      console.warn('Failed to clear try-on cache:', e);
    }
  }
}
