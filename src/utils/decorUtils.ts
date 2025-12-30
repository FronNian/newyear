import type { DecorType, DecorItemData, DecorSettings } from '@/types';
import { DECOR_TYPE_CONFIGS, DEFAULT_DECOR_SETTINGS, DECOR_TYPES_BY_CATEGORY } from '@/types';

/** 位置生成配置 */
export interface PositionConfig {
  minRadius: number;
  maxRadius: number;
  minY: number;
  maxY: number;
  exclusionZone: {
    radius: number;
    height: number;
  };
}

/** 默认位置配置 */
export const DEFAULT_POSITION_CONFIG: PositionConfig = {
  minRadius: 2.5,
  maxRadius: 8,
  minY: -3,
  maxY: 5,
  exclusionZone: {
    radius: 2,
    height: 4,
  },
};

/** 闪烁配置 */
export interface ShimmerConfig {
  minIntensity: number;
  maxIntensity: number;
  baseSpeed: number;
  speedVariance: number;
}

/** 默认闪烁配置 */
export const DEFAULT_SHIMMER_CONFIG: ShimmerConfig = {
  minIntensity: 0.1,
  maxIntensity: 1.0,
  baseSpeed: 1.5,
  speedVariance: 2.0,
};

/**
 * 生成装饰物品的有效位置（排除中心区域）
 */
export function generateDecorPosition(config: PositionConfig = DEFAULT_POSITION_CONFIG): [number, number, number] {
  let x: number, y: number, z: number;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    // 随机角度
    const theta = Math.random() * Math.PI * 2;
    // 随机半径（在 minRadius 和 maxRadius 之间）
    const radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
    
    x = Math.cos(theta) * radius;
    z = Math.sin(theta) * radius;
    y = config.minY + Math.random() * (config.maxY - config.minY);
    
    attempts++;
    
    // 检查是否在排除区域内
    const inExclusionZone = 
      Math.sqrt(x * x + z * z) < config.exclusionZone.radius &&
      Math.abs(y) < config.exclusionZone.height / 2;
    
    if (!inExclusionZone || attempts >= maxAttempts) {
      break;
    }
  } while (true);
  
  return [x, y, z];
}

/**
 * 检查位置是否在有效区域内
 */
export function isPositionValid(
  position: [number, number, number],
  config: PositionConfig = DEFAULT_POSITION_CONFIG
): boolean {
  const [x, y, z] = position;
  const horizontalDistance = Math.sqrt(x * x + z * z);
  
  // 检查是否在有效范围内
  if (horizontalDistance < config.minRadius || horizontalDistance > config.maxRadius) {
    return false;
  }
  
  if (y < config.minY || y > config.maxY) {
    return false;
  }
  
  // 检查是否在排除区域内
  const inExclusionZone = 
    horizontalDistance < config.exclusionZone.radius &&
    Math.abs(y) < config.exclusionZone.height / 2;
  
  return !inExclusionZone;
}

/**
 * 计算星星闪烁强度 - 模拟真实星星一闪一闪的效果
 * 使用多个正弦波叠加，产生不规则的闪烁节奏
 */
export function calculateShimmer(
  time: number,
  offset: number,
  intensity: number = 1.0,
  config: ShimmerConfig = DEFAULT_SHIMMER_CONFIG
): number {
  const speed = config.baseSpeed + (offset * config.speedVariance);
  const phase = offset * Math.PI * 2;
  
  // 主闪烁波 - 较慢的基础节奏
  const mainWave = Math.sin(time * speed * 0.8 + phase);
  
  // 快速闪烁波 - 模拟星星的快速闪烁
  const fastWave = Math.sin(time * speed * 2.5 + phase * 1.7);
  
  // 随机脉冲波 - 产生不规则的亮度变化
  const pulseWave = Math.sin(time * speed * 1.3 + phase * 2.3);
  
  // 组合波形：主波占60%，快速波占25%，脉冲波占15%
  const combined = mainWave * 0.6 + fastWave * 0.25 + pulseWave * 0.15;
  
  // 应用非线性变换，使闪烁更加明显（亮的更亮，暗的更暗）
  const normalized = (combined + 1) * 0.5; // 0-1
  const sharpened = Math.pow(normalized, 1.5); // 非线性锐化
  
  // 添加随机闪烁峰值（模拟星星突然变亮的效果）
  const sparkle = Math.pow(Math.max(0, Math.sin(time * speed * 4 + phase * 3)), 8) * 0.3;
  
  const range = config.maxIntensity - config.minIntensity;
  const baseValue = config.minIntensity + sharpened * range;
  
  return Math.min(config.maxIntensity, (baseValue + sparkle)) * intensity;
}

/**
 * 生成唯一的闪烁偏移值
 */
export function generateShimmerOffset(existingOffsets: number[]): number {
  let offset: number;
  let attempts = 0;
  const maxAttempts = 100;
  const minDifference = 0.05;
  
  do {
    offset = Math.random();
    attempts++;
    
    // 检查是否与现有偏移值太接近
    const tooClose = existingOffsets.some(
      existing => Math.abs(existing - offset) < minDifference
    );
    
    if (!tooClose || attempts >= maxAttempts) {
      break;
    }
  } while (true);
  
  return offset;
}

/**
 * 验证并修正装饰设置
 */
export function validateDecorSettings(settings: Partial<DecorSettings>): DecorSettings {
  return {
    enabled: settings.enabled ?? DEFAULT_DECOR_SETTINGS.enabled,
    totalCount: Math.min(100, Math.max(10, settings.totalCount ?? DEFAULT_DECOR_SETTINGS.totalCount)),
    shimmerIntensity: Math.min(2.0, Math.max(0.5, settings.shimmerIntensity ?? DEFAULT_DECOR_SETTINGS.shimmerIntensity)),
    enabledCategories: settings.enabledCategories?.length 
      ? settings.enabledCategories 
      : DEFAULT_DECOR_SETTINGS.enabledCategories,
    enabledTypes: settings.enabledTypes?.length 
      ? settings.enabledTypes 
      : DEFAULT_DECOR_SETTINGS.enabledTypes,
    customColors: { 
      ...DEFAULT_DECOR_SETTINGS.customColors, 
      ...settings.customColors 
    },
  };
}

/**
 * 根据设置获取启用的装饰类型
 */
export function getEnabledTypes(settings: DecorSettings): DecorType[] {
  const enabledFromCategories = settings.enabledCategories.flatMap(
    category => DECOR_TYPES_BY_CATEGORY[category] || []
  );
  
  // 取交集：既在启用类别中，又在启用类型中
  return settings.enabledTypes.filter(type => enabledFromCategories.includes(type));
}

/**
 * 获取装饰物品的颜色
 */
export function getDecorColor(type: DecorType, customColors: Partial<Record<DecorType, string>>): string {
  return customColors[type] || DECOR_TYPE_CONFIGS[type]?.defaultColor || '#FFFFFF';
}

/**
 * 批量生成装饰物品数据
 */
export function generateDecorItems(
  settings: DecorSettings,
  performanceLevel: 'low' | 'medium' | 'high' = 'high'
): DecorItemData[] {
  const validSettings = validateDecorSettings(settings);
  
  if (!validSettings.enabled) {
    return [];
  }
  
  const enabledTypes = getEnabledTypes(validSettings);
  
  if (enabledTypes.length === 0) {
    return [];
  }
  
  // 根据性能级别调整数量
  let count = validSettings.totalCount;
  if (performanceLevel === 'low') {
    count = Math.floor(count * 0.5);
  } else if (performanceLevel === 'medium') {
    count = Math.floor(count * 0.75);
  }
  
  // 确保不超过最大限制
  count = Math.min(count, 100);
  
  const items: DecorItemData[] = [];
  const shimmerOffsets: number[] = [];
  
  for (let i = 0; i < count; i++) {
    // 随机选择一个启用的类型
    const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
    
    // 生成位置
    const position = generateDecorPosition();
    
    // 生成唯一的闪烁偏移
    const shimmerOffset = generateShimmerOffset(shimmerOffsets);
    shimmerOffsets.push(shimmerOffset);
    
    // 随机旋转
    const rotation: [number, number, number] = [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ];
    
    // 随机缩放变化 (0.8 - 1.2)
    const scale = 0.8 + Math.random() * 0.4;
    
    items.push({
      id: `decor-${i}-${Date.now()}`,
      type,
      position,
      rotation,
      scale,
      color: getDecorColor(type, validSettings.customColors),
      shimmerOffset,
    });
  }
  
  return items;
}

/**
 * 计算实际渲染数量（考虑性能级别）
 */
export function getActualRenderCount(
  requestedCount: number,
  performanceLevel: 'low' | 'medium' | 'high'
): number {
  let count = requestedCount;
  
  if (performanceLevel === 'low') {
    count = Math.floor(count * 0.5);
  } else if (performanceLevel === 'medium') {
    count = Math.floor(count * 0.75);
  }
  
  return Math.min(count, 100);
}
