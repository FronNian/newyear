/**
 * 色差效果工具函数
 * 提供偏移计算、验证和辅助功能
 */
import type { OffsetDirection, ChromaticSettings } from '@/types';
import { DEFAULT_CHROMATIC_SETTINGS } from '@/types';

/** 方向偏移结果 */
export interface DirectionalOffset {
  redOffset: { x: number; y: number };
  greenOffset: { x: number; y: number };
  blueOffset: { x: number; y: number };
}

/**
 * 将值限制在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 根据方向和强度计算RGB通道偏移量
 * 
 * @param intensity - 强度值 (0-100)
 * @param direction - 偏移方向
 * @returns RGB三个通道的偏移量
 */
export function calculateDirectionalOffset(
  intensity: number,
  direction: OffsetDirection
): DirectionalOffset {
  // 强度映射到像素偏移 (0-100 -> 0-15px)
  const clampedIntensity = clamp(intensity, 0, 100);
  const magnitude = (clampedIntensity / 100) * 15;
  
  // 绿色通道始终保持在中心
  const greenOffset = { x: 0, y: 0 };
  
  let redOffset: { x: number; y: number };
  let blueOffset: { x: number; y: number };
  
  switch (direction) {
    case 'horizontal':
      // 水平方向：红色向左，蓝色向右
      redOffset = { x: -magnitude, y: 0 };
      blueOffset = { x: magnitude, y: 0 };
      break;
      
    case 'vertical':
      // 垂直方向：红色向上，蓝色向下
      redOffset = { x: 0, y: -magnitude };
      blueOffset = { x: 0, y: magnitude };
      break;
      
    case 'diagonal':
      // 对角线方向：红色向左上，蓝色向右下
      const diag = magnitude / Math.sqrt(2);
      redOffset = { x: -diag, y: -diag };
      blueOffset = { x: diag, y: diag };
      break;
      
    case 'radial':
      // 径向方向：红色向内缩，蓝色向外扩
      // 使用较小的偏移量，因为径向效果会在视觉上更明显
      const radialMag = magnitude * 0.5;
      redOffset = { x: -radialMag, y: -radialMag };
      blueOffset = { x: radialMag, y: radialMag };
      break;
      
    default:
      // 默认使用水平方向
      redOffset = { x: -magnitude, y: 0 };
      blueOffset = { x: magnitude, y: 0 };
  }
  
  return { redOffset, greenOffset, blueOffset };
}

/**
 * 计算音频响应的强度修正值
 * 
 * @param bassEnergy - 低频能量 (0-255)
 * @param sensitivity - 灵敏度 (0-100)
 * @returns 强度修正值 (0-1)
 */
export function calculateAudioIntensityModifier(
  bassEnergy: number,
  sensitivity: number
): number {
  const clampedBass = clamp(bassEnergy, 0, 255);
  const clampedSensitivity = clamp(sensitivity, 0, 100);
  
  return (clampedBass / 255) * (clampedSensitivity / 100);
}

/**
 * 验证颜色值是否有效
 */
export function isValidColor(color: unknown): color is string {
  if (typeof color !== 'string') return false;
  // 支持 hex 颜色格式
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

/**
 * 验证偏移方向是否有效
 */
export function isValidDirection(direction: unknown): direction is OffsetDirection {
  return ['horizontal', 'vertical', 'radial', 'diagonal'].includes(direction as string);
}

/**
 * 验证并合并色差设置
 * 确保所有字段都有有效值
 */
export function validateChromaticSettings(
  input: Partial<ChromaticSettings>
): ChromaticSettings {
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_CHROMATIC_SETTINGS.enabled,
    intensity: clamp(input.intensity ?? DEFAULT_CHROMATIC_SETTINGS.intensity, 0, 100),
    direction: isValidDirection(input.direction) ? input.direction : DEFAULT_CHROMATIC_SETTINGS.direction,
    target: input.target ?? DEFAULT_CHROMATIC_SETTINGS.target,
    colors: {
      red: isValidColor(input.colors?.red) ? input.colors.red : DEFAULT_CHROMATIC_SETTINGS.colors.red,
      green: isValidColor(input.colors?.green) ? input.colors.green : DEFAULT_CHROMATIC_SETTINGS.colors.green,
      blue: isValidColor(input.colors?.blue) ? input.colors.blue : DEFAULT_CHROMATIC_SETTINGS.colors.blue,
    },
    audioSync: {
      enabled: typeof input.audioSync?.enabled === 'boolean' 
        ? input.audioSync.enabled 
        : DEFAULT_CHROMATIC_SETTINGS.audioSync.enabled,
      sensitivity: clamp(
        input.audioSync?.sensitivity ?? DEFAULT_CHROMATIC_SETTINGS.audioSync.sensitivity, 
        0, 
        100
      ),
    },
  };
}

/**
 * 根据设备性能级别获取推荐的效果质量
 */
export function getRecommendedQuality(performanceLevel: 'low' | 'medium' | 'high'): {
  enabled: boolean;
  maxIntensity: number;
} {
  switch (performanceLevel) {
    case 'low':
      return { enabled: false, maxIntensity: 0 };
    case 'medium':
      return { enabled: true, maxIntensity: 50 };
    case 'high':
    default:
      return { enabled: true, maxIntensity: 100 };
  }
}
