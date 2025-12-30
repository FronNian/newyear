import * as THREE from 'three';
import type {
  FireworkBurstShape,
  FireworkColorTheme,
  FireworkTriggerPhase,
  FireworkTriggerState,
} from '@/types';
import {
  FIREWORK_COLOR_THEMES,
  FIREWORK_TRIGGER_CONFIG,
} from '@/types';

/**
 * 从颜色主题中随机获取一个颜色
 */
export function getRandomColor(theme: FireworkColorTheme): THREE.Color {
  const colors = FIREWORK_COLOR_THEMES[theme];
  const colorHex = colors[Math.floor(Math.random() * colors.length)];
  return new THREE.Color(colorHex);
}

/**
 * 获取心形烟花的颜色
 */
export function getHeartColor(): THREE.Color {
  const heartColors = ['#FF1493', '#FF69B4', '#FF0000', '#DC143C', '#FF6B6B'];
  return new THREE.Color(heartColors[Math.floor(Math.random() * heartColors.length)]);
}

/**
 * 生成随机发射位置
 */
export function generateLaunchPosition(): THREE.Vector3 {
  const x = (Math.random() - 0.5) * 20;
  const y = -5;
  const z = (Math.random() - 0.5) * 10;
  return new THREE.Vector3(x, y, z);
}

/**
 * 生成随机目标高度
 */
export function generateTargetHeight(): number {
  return 3 + Math.random() * 8;
}

/**
 * 生成随机爆炸形状
 */
export function generateRandomShape(heartEnabled: boolean): FireworkBurstShape {
  const shapes: FireworkBurstShape[] = heartEnabled
    ? ['sphere', 'ring', 'heart', 'star']
    : ['sphere', 'ring', 'star'];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

/**
 * 获取当前触发阶段
 */
export function getTriggerPhase(
  secondsRemaining: number,
  isFinished: boolean,
  celebrationStartTime: number | null
): FireworkTriggerPhase {
  const { warmupStart, accelerateStart, celebrationDuration } = FIREWORK_TRIGGER_CONFIG;
  
  if (isFinished) {
    if (celebrationStartTime !== null) {
      const elapsed = Date.now() - celebrationStartTime;
      if (elapsed < celebrationDuration) {
        return 'celebration';
      }
    }
    return 'idle';
  }
  
  if (secondsRemaining <= 0) return 'burst';
  if (secondsRemaining <= accelerateStart) return 'accelerate';
  if (secondsRemaining <= warmupStart) return 'warmup';
  
  return 'idle';
}

/**
 * 获取当前阶段的发射间隔
 */
export function getLaunchInterval(phase: FireworkTriggerPhase): number {
  const { warmupInterval, accelerateInterval, celebrationInterval } = FIREWORK_TRIGGER_CONFIG;
  
  switch (phase) {
    case 'warmup': return warmupInterval;
    case 'accelerate': return accelerateInterval;
    case 'celebration': return celebrationInterval;
    default: return Infinity;
  }
}

/**
 * 检查是否应该发射烟花
 */
export function shouldLaunchFirework(
  state: FireworkTriggerState,
  currentTime: number
): boolean {
  const interval = getLaunchInterval(state.phase);
  if (interval === Infinity) return false;
  return currentTime - state.lastLaunchTime >= interval;
}

/**
 * 生成大爆发的烟花形状列表
 */
export function generateBurstShapes(heartEnabled: boolean): FireworkBurstShape[] {
  const { burstCount } = FIREWORK_TRIGGER_CONFIG;
  const shapes: FireworkBurstShape[] = [];
  
  if (heartEnabled) shapes.push('heart');
  
  const availableShapes: FireworkBurstShape[] = ['sphere', 'ring', 'star'];
  const remainingCount = burstCount - shapes.length;
  
  for (let i = 0; i < remainingCount; i++) {
    shapes.push(availableShapes[Math.floor(Math.random() * availableShapes.length)]);
  }
  
  return shapes.sort(() => Math.random() - 0.5);
}

/**
 * 计算粒子亮度
 */
export function getParticleBrightness(life: number): number {
  return Math.max(0, Math.pow(life, 0.5));
}
