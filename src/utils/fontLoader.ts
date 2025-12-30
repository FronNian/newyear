/**
 * 共享字体加载工具
 * 直接使用系统字体，无需下载
 */

// 字体加载状态（直接标记为已加载）
let fontLoaded = true;

/**
 * 确保字体已加载（直接返回，使用系统字体）
 */
export async function ensureFontLoaded(): Promise<void> {
  // 直接使用系统字体，无需等待
  return Promise.resolve();
}

/**
 * 检查字体是否已加载
 */
export function isFontLoaded(): boolean {
  return fontLoaded;
}

/**
 * 检查字体是否真正可用
 */
export function isFontReallyLoaded(): boolean {
  return true;
}

/**
 * 获取中文字体族字符串（优先使用系统字体）
 */
export const CHINESE_FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", "SimHei", "Heiti SC", "WenQuanYi Micro Hei", Arial, sans-serif';
