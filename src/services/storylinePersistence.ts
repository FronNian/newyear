import type { StorylineConfig } from '@/types';
import { STORYLINE_STORAGE_KEY } from '@/types';
import { validateStorylineConfig } from './storylineService';

// ============================================
// 本地存储操作
// ============================================

/** 保存故事线到本地存储 */
export function saveStorylineToStorage(config: StorylineConfig): boolean {
  try {
    const validated = validateStorylineConfig(config);
    const json = JSON.stringify(validated);
    localStorage.setItem(STORYLINE_STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error('[StorylinePersistence] Failed to save:', error);
    return false;
  }
}

/** 从本地存储加载故事线 */
export function loadStorylineFromStorage(): StorylineConfig | null {
  try {
    const json = localStorage.getItem(STORYLINE_STORAGE_KEY);
    if (!json) return null;
    
    const parsed = JSON.parse(json);
    return validateStorylineConfig(parsed);
  } catch (error) {
    console.error('[StorylinePersistence] Failed to load:', error);
    return null;
  }
}

/** 检查本地存储中是否有故事线 */
export function hasStoredStoryline(): boolean {
  return localStorage.getItem(STORYLINE_STORAGE_KEY) !== null;
}

/** 清除本地存储中的故事线 */
export function clearStoredStoryline(): void {
  localStorage.removeItem(STORYLINE_STORAGE_KEY);
}

// ============================================
// JSON 导入/导出
// ============================================

/** 导出故事线为 JSON 字符串 */
export function exportStorylineToJson(config: StorylineConfig): string {
  const validated = validateStorylineConfig(config);
  return JSON.stringify(validated, null, 2);
}

/** 从 JSON 字符串导入故事线 */
export function importStorylineFromJson(json: string): StorylineConfig | null {
  try {
    const parsed = JSON.parse(json);
    
    // 验证基本结构
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }
    
    // 验证并返回
    return validateStorylineConfig(parsed);
  } catch (error) {
    console.error('[StorylinePersistence] Failed to import:', error);
    return null;
  }
}

/** 下载故事线为 JSON 文件 */
export function downloadStorylineAsJson(config: StorylineConfig, filename?: string): void {
  const json = exportStorylineToJson(config);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `storyline-${config.year}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 从文件导入故事线 */
export function importStorylineFromFile(file: File): Promise<StorylineConfig | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const config = importStorylineFromJson(json);
      resolve(config);
    };
    
    reader.onerror = () => {
      console.error('[StorylinePersistence] Failed to read file');
      resolve(null);
    };
    
    reader.readAsText(file);
  });
}

// ============================================
// 备份和恢复
// ============================================

const BACKUP_KEY = 'nye-storyline-backup';
const MAX_BACKUPS = 5;

interface StorylineBackup {
  config: StorylineConfig;
  timestamp: number;
  reason: string;
}

/** 创建备份 */
export function createBackup(config: StorylineConfig, reason: string = 'manual'): void {
  try {
    const backupsJson = localStorage.getItem(BACKUP_KEY);
    const backups: StorylineBackup[] = backupsJson ? JSON.parse(backupsJson) : [];
    
    // 添加新备份
    backups.unshift({
      config: validateStorylineConfig(config),
      timestamp: Date.now(),
      reason,
    });
    
    // 保留最近的备份
    const trimmedBackups = backups.slice(0, MAX_BACKUPS);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(trimmedBackups));
  } catch (error) {
    console.error('[StorylinePersistence] Failed to create backup:', error);
  }
}

/** 获取所有备份 */
export function getBackups(): StorylineBackup[] {
  try {
    const backupsJson = localStorage.getItem(BACKUP_KEY);
    return backupsJson ? JSON.parse(backupsJson) : [];
  } catch (error) {
    console.error('[StorylinePersistence] Failed to get backups:', error);
    return [];
  }
}

/** 从备份恢复 */
export function restoreFromBackup(index: number): StorylineConfig | null {
  const backups = getBackups();
  if (index < 0 || index >= backups.length) return null;
  
  return validateStorylineConfig(backups[index].config);
}

/** 清除所有备份 */
export function clearBackups(): void {
  localStorage.removeItem(BACKUP_KEY);
}
