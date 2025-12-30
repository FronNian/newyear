/**
 * 照片存储服务 - 使用 IndexedDB 存储照片数据
 * 解决 localStorage 配额限制问题
 */

import type { PhotoData } from '@/types';

const DB_NAME = 'nye-photos-db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * 打开/创建 IndexedDB 数据库
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建照片存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  
  return dbPromise;
}

/**
 * 保存所有照片到 IndexedDB
 */
export async function savePhotos(photos: PhotoData[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // 清空现有数据
    store.clear();
    
    // 添加所有照片
    for (const photo of photos) {
      store.put(photo);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save photos to IndexedDB:', error);
  }
}

/**
 * 从 IndexedDB 加载所有照片
 */
export async function loadPhotos(): Promise<PhotoData[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load photos from IndexedDB:', error);
    return [];
  }
}

/**
 * 添加单张照片
 */
export async function addPhoto(photo: PhotoData): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(photo);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to add photo to IndexedDB:', error);
  }
}

/**
 * 删除单张照片
 */
export async function removePhoto(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to remove photo from IndexedDB:', error);
  }
}

/**
 * 清空所有照片
 */
export async function clearPhotos(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to clear photos from IndexedDB:', error);
  }
}

/**
 * 迁移 localStorage 中的照片到 IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<PhotoData[]> {
  try {
    const stored = localStorage.getItem('nye-countdown-storage');
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    const photos = data?.state?.photos || [];
    
    if (photos.length > 0) {
      // 保存到 IndexedDB
      await savePhotos(photos);
      
      // 从 localStorage 中移除照片数据
      if (data?.state) {
        data.state.photos = [];
        localStorage.setItem('nye-countdown-storage', JSON.stringify(data));
      }
      
      console.log(`Migrated ${photos.length} photos from localStorage to IndexedDB`);
    }
    
    return photos;
  } catch (error) {
    console.error('Failed to migrate photos from localStorage:', error);
    return [];
  }
}
