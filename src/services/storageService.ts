import type { AppSettings, PhotoData } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { validateSettings } from '@/utils/settings';

/** 存储键 */
const STORAGE_KEYS = {
  SETTINGS: 'nye-countdown-settings',
  PHOTOS: 'nye-countdown-photos',
  CUSTOM_SONGS: 'nye-countdown-custom-songs',
} as const;

/** 存储版本（用于数据迁移） */
const STORAGE_VERSION = 1;

/** 带版本的存储数据 */
interface VersionedData<T> {
  version: number;
  data: T;
}

/**
 * 安全地解析 JSON
 */
function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 保存设置到本地存储
 * @param settings 设置对象
 * @returns 是否保存成功
 */
export function saveSettings(settings: AppSettings): boolean {
  try {
    const data: VersionedData<AppSettings> = {
      version: STORAGE_VERSION,
      data: settings,
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * 从本地存储加载设置
 * @returns 设置对象
 */
export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    
    const parsed = safeJsonParse<VersionedData<AppSettings>>(stored, {
      version: 0,
      data: DEFAULT_SETTINGS,
    });
    
    // 验证并修正设置
    return validateSettings(parsed.data);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存照片到本地存储
 * @param photos 照片数组
 * @returns 是否保存成功
 */
export function savePhotos(photos: PhotoData[]): boolean {
  try {
    const data: VersionedData<PhotoData[]> = {
      version: STORAGE_VERSION,
      data: photos,
    };
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save photos:', error);
    return false;
  }
}

/**
 * 从本地存储加载照片
 * @returns 照片数组
 */
export function loadPhotos(): PhotoData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    if (!stored) {
      return [];
    }
    
    const parsed = safeJsonParse<VersionedData<PhotoData[]>>(stored, {
      version: 0,
      data: [],
    });
    
    // 验证照片数据
    return parsed.data.filter(
      (photo) =>
        photo &&
        typeof photo.id === 'string' &&
        typeof photo.url === 'string' &&
        Array.isArray(photo.position) &&
        photo.position.length === 3
    );
  } catch (error) {
    console.error('Failed to load photos:', error);
    return [];
  }
}

/**
 * 清除所有存储数据
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * 检查本地存储是否可用
 * @returns 是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取存储使用量（字节）
 * @returns 使用量
 */
export function getStorageUsage(): number {
  let total = 0;
  try {
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        total += item.length * 2; // UTF-16 编码
      }
    }
  } catch {
    // 忽略错误
  }
  return total;
}
