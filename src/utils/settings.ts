import type { AppSettings, ColorTheme, FontStyle } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

/** 设置范围限制 */
export const SETTINGS_LIMITS = {
  particleCount: { min: 1000, max: 10000 },
  bloomIntensity: { min: 0, max: 2 },
  volume: { min: 0, max: 1 },
} as const;

/** 有效的颜色主题 */
const VALID_COLOR_THEMES: ColorTheme[] = [
  'classic-green',
  'ice-blue',
  'romantic-pink',
  'golden',
  'rainbow',
];

/** 有效的字体样式 */
const VALID_FONT_STYLES: FontStyle[] = [
  'modern',
  'classic',
  'handwritten',
  'pixel',
];

/**
 * 将数值裁剪到指定范围
 * @param value 输入值
 * @param min 最小值
 * @param max 最大值
 * @returns 裁剪后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 验证并修正设置值
 * @param settings 输入设置
 * @returns 验证后的设置
 */
export function validateSettings(settings: Partial<AppSettings>): AppSettings {
  const validated: AppSettings = { ...DEFAULT_SETTINGS };
  
  // 验证粒子数量
  if (typeof settings.particleCount === 'number') {
    validated.particleCount = Math.round(
      clamp(
        settings.particleCount,
        SETTINGS_LIMITS.particleCount.min,
        SETTINGS_LIMITS.particleCount.max
      )
    );
  }
  
  // 验证颜色主题
  if (settings.colorTheme && VALID_COLOR_THEMES.includes(settings.colorTheme)) {
    validated.colorTheme = settings.colorTheme;
  }
  
  // 验证 Bloom 强度
  if (typeof settings.bloomIntensity === 'number') {
    validated.bloomIntensity = clamp(
      settings.bloomIntensity,
      SETTINGS_LIMITS.bloomIntensity.min,
      SETTINGS_LIMITS.bloomIntensity.max
    );
  }
  
  // 验证布尔值
  if (typeof settings.snowEnabled === 'boolean') {
    validated.snowEnabled = settings.snowEnabled;
  }
  
  if (typeof settings.starFieldEnabled === 'boolean') {
    validated.starFieldEnabled = settings.starFieldEnabled;
  }
  
  // 验证自定义消息
  if (typeof settings.customMessage === 'string') {
    validated.customMessage = settings.customMessage.slice(0, 100); // 限制长度
  }
  
  // 验证字体样式
  if (settings.fontStyle && VALID_FONT_STYLES.includes(settings.fontStyle)) {
    validated.fontStyle = settings.fontStyle;
  }
  
  // 验证音量
  if (typeof settings.volume === 'number') {
    validated.volume = clamp(
      settings.volume,
      SETTINGS_LIMITS.volume.min,
      SETTINGS_LIMITS.volume.max
    );
  }
  
  return validated;
}

/**
 * 检查设置值是否在有效范围内
 * @param key 设置键
 * @param value 设置值
 * @returns 是否有效
 */
export function isValidSettingValue(
  key: keyof AppSettings,
  value: unknown
): boolean {
  switch (key) {
    case 'particleCount':
      return (
        typeof value === 'number' &&
        value >= SETTINGS_LIMITS.particleCount.min &&
        value <= SETTINGS_LIMITS.particleCount.max
      );
    case 'bloomIntensity':
      return (
        typeof value === 'number' &&
        value >= SETTINGS_LIMITS.bloomIntensity.min &&
        value <= SETTINGS_LIMITS.bloomIntensity.max
      );
    case 'volume':
      return (
        typeof value === 'number' &&
        value >= SETTINGS_LIMITS.volume.min &&
        value <= SETTINGS_LIMITS.volume.max
      );
    case 'colorTheme':
      return VALID_COLOR_THEMES.includes(value as ColorTheme);
    case 'fontStyle':
      return VALID_FONT_STYLES.includes(value as FontStyle);
    case 'snowEnabled':
    case 'starFieldEnabled':
      return typeof value === 'boolean';
    case 'customMessage':
      return typeof value === 'string';
    default:
      return false;
  }
}
