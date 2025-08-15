import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Local Storage Operations
  setLocalItem(key: string, value: any): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
      } catch (error) {
        console.error('Error setting local storage item:', error);
      }
    }
  }

  getLocalItem<T>(key: string): T | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const item = localStorage.getItem(key);
        if (item === null) return null;
        
        try {
          return JSON.parse(item) as T;
        } catch {
          return item as T;
        }
      } catch (error) {
        console.error('Error getting local storage item:', error);
        return null;
      }
    }
    return null;
  }

  removeLocalItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing local storage item:', error);
      }
    }
  }

  clearLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing local storage:', error);
      }
    }
  }

  hasLocalItem(key: string): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem(key) !== null;
      } catch (error) {
        console.error('Error checking local storage item:', error);
        return false;
      }
    }
    return false;
  }

  getLocalStorageSize(): number {
    if (isPlatformBrowser(this.platformId)) {
      try {
        let size = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            size += localStorage[key].length + key.length;
          }
        }
        return size;
      } catch (error) {
        console.error('Error calculating local storage size:', error);
        return 0;
      }
    }
    return 0;
  }

  // Session Storage Operations
  setSessionItem(key: string, value: any): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        sessionStorage.setItem(key, serializedValue);
      } catch (error) {
        console.error('Error setting session storage item:', error);
      }
    }
  }

  getSessionItem<T>(key: string): T | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const item = sessionStorage.getItem(key);
        if (item === null) return null;
        
        try {
          return JSON.parse(item) as T;
        } catch {
          return item as T;
        }
      } catch (error) {
        console.error('Error getting session storage item:', error);
        return null;
      }
    }
    return null;
  }

  removeSessionItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing session storage item:', error);
      }
    }
  }

  clearSessionStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing session storage:', error);
      }
    }
  }

  hasSessionItem(key: string): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return sessionStorage.getItem(key) !== null;
      } catch (error) {
        console.error('Error checking session storage item:', error);
        return false;
      }
    }
    return false;
  }

  // Cookie Operations
  setCookie(name: string, value: string, days?: number, path: string = '/'): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        let expires = '';
        if (days) {
          const date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=' + path;
      } catch (error) {
        console.error('Error setting cookie:', error);
      }
    }
  }

  getCookie(name: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
      } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
      }
    }
    return null;
  }

  removeCookie(name: string, path: string = '/'): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.setCookie(name, '', -1, path);
      } catch (error) {
        console.error('Error removing cookie:', error);
      }
    }
  }

  hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  // IndexedDB Operations (Basic)
  async setIndexedDBItem(dbName: string, storeName: string, key: string, value: any): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const db = await this.openIndexedDB(dbName, storeName);
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.put(value, key);
        db.close();
      } catch (error) {
        console.error('Error setting IndexedDB item:', error);
      }
    }
  }

  async getIndexedDBItem<T>(dbName: string, storeName: string, key: string): Promise<T | null> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const db = await this.openIndexedDB(dbName, storeName);
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Error getting IndexedDB item:', error);
        return null;
      }
    }
    return null;
  }

  async removeIndexedDBItem(dbName: string, storeName: string, key: string): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const db = await this.openIndexedDB(dbName, storeName);
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.delete(key);
        db.close();
      } catch (error) {
        console.error('Error removing IndexedDB item:', error);
      }
    }
  }

  private async openIndexedDB(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  }

  // Cache Operations
  async setCacheItem(cacheName: string, key: string, value: any): Promise<void> {
    if (isPlatformBrowser(this.platformId) && 'caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        const response = new Response(JSON.stringify(value));
        await cache.put(key, response);
      } catch (error) {
        console.error('Error setting cache item:', error);
      }
    }
  }

  async getCacheItem<T>(cacheName: string, key: string): Promise<T | null> {
    if (isPlatformBrowser(this.platformId) && 'caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        const response = await cache.match(key);
        if (response) {
          const data = await response.json();
          return data as T;
        }
        return null;
      } catch (error) {
        console.error('Error getting cache item:', error);
        return null;
      }
    }
    return null;
  }

  async removeCacheItem(cacheName: string, key: string): Promise<void> {
    if (isPlatformBrowser(this.platformId) && 'caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        await cache.delete(key);
      } catch (error) {
        console.error('Error removing cache item:', error);
      }
    }
  }

  async clearCache(cacheName: string): Promise<void> {
    if (isPlatformBrowser(this.platformId) && 'caches' in window) {
      try {
        await caches.delete(cacheName);
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  }

  // Utility Methods
  isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storage = window[type];
        const test = '__storage_test__';
        storage.setItem(test, test);
        storage.removeItem(test);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  getStorageQuota(): Promise<StorageEstimate | null> {
    if (isPlatformBrowser(this.platformId) && 'storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return Promise.resolve(null);
  }

  // Data Migration
  migrateData(fromKey: string, toKey: string, storageType: 'local' | 'session' = 'local'): boolean {
    try {
      const getMethod = storageType === 'local' ? this.getLocalItem.bind(this) : this.getSessionItem.bind(this);
      const setMethod = storageType === 'local' ? this.setLocalItem.bind(this) : this.setSessionItem.bind(this);
      const removeMethod = storageType === 'local' ? this.removeLocalItem.bind(this) : this.removeSessionItem.bind(this);

      const data = getMethod(fromKey);
      if (data !== null) {
        setMethod(toKey, data);
        removeMethod(fromKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }

  // Backup and Restore
  backupStorage(storageType: 'local' | 'session' = 'local'): any {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        const backup: any = {};
        
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) {
            backup[key] = storage.getItem(key);
          }
        }
        
        return backup;
      } catch (error) {
        console.error('Error backing up storage:', error);
        return {};
      }
    }
    return {};
  }

  restoreStorage(backup: any, storageType: 'local' | 'session' = 'local'): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        
        // Clear existing storage
        storage.clear();
        
        // Restore from backup
        Object.keys(backup).forEach(key => {
          storage.setItem(key, backup[key]);
        });
      } catch (error) {
        console.error('Error restoring storage:', error);
      }
    }
  }

  // Storage Events
  onStorageChange(callback: (event: StorageEvent) => void): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', callback);
    }
  }

  offStorageChange(callback: (event: StorageEvent) => void): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('storage', callback);
    }
  }
}

interface StorageEstimate {
  quota?: number;
  usage?: number;
  usageDetails?: {
    caches?: number;
    indexedDB?: number;
    serviceWorkerRegistrations?: number;
  };
}
