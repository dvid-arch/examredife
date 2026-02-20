/**
 * db.ts - Lightweight IndexedDB wrapper for client-side data caching.
 *
 * Stores large datasets (papers, guides) with a timestamp so we can
 * invalidate the cache after a configurable TTL (time-to-live).
 *
 * This avoids re-fetching the full dataset (which can be MBs) on every
 * page load / navigation, dramatically improving perceived performance.
 */

const DB_NAME = 'examredi-cache';
const DB_VERSION = 1;
const STORE_NAME = 'app-data';

// Cache TTL: 24 hours in milliseconds. Data older than this will be re-fetched.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
    key: string;
    data: T;
    cachedAt: number; // unix timestamp ms
}

// Open (or create) the database and the object store.
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error('[DB] Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
}

/**
 * Retrieve a cached value. Returns null if missing or expired.
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);

            req.onsuccess = () => {
                const entry = req.result as CacheEntry<T> | undefined;
                if (!entry) {
                    resolve(null);
                    return;
                }
                const age = Date.now() - entry.cachedAt;
                if (age > CACHE_TTL_MS) {
                    // Stale — treat as a miss so caller will re-fetch
                    console.log(`[DB] Cache expired for "${key}" (age: ${Math.round(age / 60000)} min)`);
                    resolve(null);
                } else {
                    resolve(entry.data);
                }
            };
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error('[DB] getCache error:', err);
        return null;
    }
}

/**
 * Store a value in the cache with the current timestamp.
 */
export async function setCache<T>(key: string, data: T): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const entry: CacheEntry<T> = { key, data, cachedAt: Date.now() };
            const req = store.put(entry);

            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error('[DB] setCache error:', err);
    }
}

/**
 * Forcefully clear a specific cache key (e.g., on pull-to-refresh).
 */
export async function clearCache(key: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error('[DB] clearCache error:', err);
    }
}

/**
 * Clear all cached data.
 */
export async function clearAllCache(): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error('[DB] clearAllCache error:', err);
    }
}
