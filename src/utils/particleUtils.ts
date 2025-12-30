import type { ColorTheme, ParticleShape } from '@/types';
import { COLOR_THEME_MAP } from '@/types';
import * as THREE from 'three';

/**
 * 获取形状的边界范围
 * @param shape 形状类型
 * @param scale 缩放比例
 * @returns 边界信息 { minY, maxY, maxRadius }
 */
export function getShapeBounds(shape: ParticleShape, scale: number = 1.0): { minY: number; maxY: number; maxRadius: number } {
  switch (shape) {
    case 'tree':
      // 树：y 从 -2 到 2
      return { minY: -2 * scale, maxY: 2 * scale, maxRadius: 1.5 * scale };
    case 'cake':
      // 蛋糕：y 从 -2 到 2.2（包含蜡烛火焰）
      return { minY: -2 * scale, maxY: 2.2 * scale, maxRadius: 1.5 * scale };
    case 'firework':
      // 烟花：中心椭圆 y 从 -1.8 到 1.8，外围圆环在 y=0 附近
      return { minY: -1.8 * scale, maxY: 1.8 * scale, maxRadius: 2.8 * scale };
    case 'heart':
      // 爱心：y 大约从 -1.04 到 1.04（基于参数方程）
      return { minY: -1.1 * scale, maxY: 1.1 * scale, maxRadius: 1.3 * scale };
    default:
      return { minY: -2 * scale, maxY: 2 * scale, maxRadius: 2 * scale };
  }
}

/**
 * 根据形状生成粒子位置
 * @param count 粒子数量
 * @param shape 形状类型
 * @returns Float32Array 包含 x, y, z 坐标
 */
export function generateParticles(count: number, shape: ParticleShape): Float32Array {
  switch (shape) {
    case 'tree':
      return generateTreeParticles(count);
    case 'cake':
      return generateCakeParticles(count);
    case 'firework':
      return generateFireworkParticles(count);
    case 'heart':
      return generateHeartParticles(count);
    default:
      return generateFireworkParticles(count);
  }
}

/**
 * 生成圣诞树形状的粒子位置
 * @param count 粒子数量
 * @returns Float32Array 包含 x, y, z 坐标
 */
export function generateTreeParticles(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  // 树的高度范围：-2 到 2（总高度4，中心在0）
  const treeHeight = 4;
  const halfHeight = treeHeight / 2;
  
  for (let i = 0; i < count; i++) {
    // 高度：从底部 (-2) 到顶部 (2)
    const y = Math.random() * treeHeight - halfHeight;
    
    // 半径：随高度递减形成圆锥形（顶部尖，底部宽）
    const normalizedY = (y + halfHeight) / treeHeight; // 0 到 1
    const maxRadius = Math.max(0, (1 - normalizedY) * 1.5);
    const radius = maxRadius * Math.random();
    
    // 随机角度
    const angle = Math.random() * Math.PI * 2;
    
    positions[i * 3] = Math.cos(angle) * radius;     // x
    positions[i * 3 + 1] = y;                         // y
    positions[i * 3 + 2] = Math.sin(angle) * radius; // z
  }
  
  return positions;
}

/**
 * 生成生日蛋糕形状的粒子位置
 * 三层蛋糕 + 蜡烛
 * @param count 粒子数量
 * @returns Float32Array 包含 x, y, z 坐标
 */
export function generateCakeParticles(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  // 蛋糕中心偏移，使整体居中
  const yOffset = -1.0;
  
  // 分配粒子：底层40%，中层30%，顶层20%，蜡烛10%
  const layer1Count = Math.floor(count * 0.4);
  const layer2Count = Math.floor(count * 0.3);
  const layer3Count = Math.floor(count * 0.2);
  const candleCount = count - layer1Count - layer2Count - layer3Count;
  
  let idx = 0;
  
  // 底层蛋糕 (最大，y: -1 到 -0.2)
  for (let i = 0; i < layer1Count; i++) {
    const y = Math.random() * 0.8 + yOffset;
    const radius = 1.5 * Math.random();
    const angle = Math.random() * Math.PI * 2;
    
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = Math.sin(angle) * radius;
    idx++;
  }
  
  // 中层蛋糕 (y: -0.2 到 0.5)
  for (let i = 0; i < layer2Count; i++) {
    const y = 0.8 + Math.random() * 0.7 + yOffset;
    const radius = 1.1 * Math.random();
    const angle = Math.random() * Math.PI * 2;
    
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = Math.sin(angle) * radius;
    idx++;
  }
  
  // 顶层蛋糕 (y: 0.5 到 1.0)
  for (let i = 0; i < layer3Count; i++) {
    const y = 1.5 + Math.random() * 0.5 + yOffset;
    const radius = 0.7 * Math.random();
    const angle = Math.random() * Math.PI * 2;
    
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = Math.sin(angle) * radius;
    idx++;
  }
  
  // 蜡烛 (细长的圆柱 + 火焰)
  const candlePositions = [
    [0, 0],           // 中心
    [0.3, 0],         // 右
    [-0.3, 0],        // 左
    [0, 0.3],         // 前
    [0, -0.3],        // 后
  ];
  
  for (let i = 0; i < candleCount; i++) {
    const candleIdx = i % candlePositions.length;
    const [cx, cz] = candlePositions[candleIdx];
    
    // 蜡烛主体 + 火焰
    const y = 2.0 + Math.random() * 1.2 + yOffset;
    const spread = y > 2.8 + yOffset ? 0.15 : 0.05; // 火焰部分更宽
    
    positions[idx * 3] = cx + (Math.random() - 0.5) * spread;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = cz + (Math.random() - 0.5) * spread;
    idx++;
  }
  
  return positions;
}

/**
 * 生成元旦烟花/爆炸形状的粒子位置
 * 中间椭圆尖，周围扁平圆环
 * @param count 粒子数量
 * @returns Float32Array 包含 x, y, z 坐标
 */
export function generateFireworkParticles(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  // 分配：中心椭圆30%，外围圆环70%
  const centerCount = Math.floor(count * 0.3);
  const ringCount = count - centerCount;
  
  let idx = 0;
  
  // 中心椭圆（垂直拉伸，以 y=0 为中心）
  for (let i = 0; i < centerCount; i++) {
    // 使用球坐标，但垂直方向拉伸
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * 1.0; // 更密集的中心
    
    const x = r * Math.sin(phi) * Math.cos(theta) * 0.6;
    const y = r * Math.cos(phi) * 1.8; // 垂直拉伸，中心在 y=0
    const z = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }
  
  // 外围扁平圆环（多层，以 y=0 为中心）
  const ringLayers = 5;
  const particlesPerLayer = Math.floor(ringCount / ringLayers);
  
  for (let layer = 0; layer < ringLayers; layer++) {
    const layerRadius = 1.2 + layer * 0.4;
    const layerY = (Math.random() - 0.5) * 0.3; // 中心在 y=0
    const layerThickness = 0.15;
    
    const startIdx = idx;
    const endIdx = layer === ringLayers - 1 ? count : startIdx + particlesPerLayer;
    
    for (let i = startIdx; i < endIdx && idx < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = layerRadius + (Math.random() - 0.5) * 0.3;
      const yVariation = layerY + (Math.random() - 0.5) * layerThickness;
      
      positions[idx * 3] = Math.cos(angle) * radiusVariation;
      positions[idx * 3 + 1] = yVariation;
      positions[idx * 3 + 2] = Math.sin(angle) * radiusVariation;
      idx++;
    }
  }
  
  return positions;
}

/**
 * 生成爱心形状的粒子位置
 * @param count 粒子数量
 * @returns Float32Array 包含 x, y, z 坐标
 */
export function generateHeartParticles(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    // 心形参数方程
    const t = Math.random() * Math.PI * 2;
    const r = Math.random(); // 用于填充内部
    
    // 2D 心形
    const x2d = 16 * Math.pow(Math.sin(t), 3);
    const y2d = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    // 缩放和添加深度，中心在 y=0
    const scale = 0.08 * r;
    const depth = (Math.random() - 0.5) * 0.5;
    
    positions[i * 3] = x2d * scale;
    positions[i * 3 + 1] = y2d * scale; // 中心在 y=0
    positions[i * 3 + 2] = depth;
  }
  
  return positions;
}

/**
 * 生成粒子颜色
 * @param count 粒子数量
 * @param theme 颜色主题
 * @returns Float32Array 包含 r, g, b 值
 */
export function generateTreeColors(
  count: number,
  theme: ColorTheme
): Float32Array {
  const colors = new Float32Array(count * 3);
  const themeColors = COLOR_THEME_MAP[theme];
  
  const primary = new THREE.Color(themeColors.primary);
  const secondary = new THREE.Color(themeColors.secondary);
  const accent = new THREE.Color(themeColors.accent);
  
  for (let i = 0; i < count; i++) {
    // 随机选择一个颜色，主色调概率更高
    const rand = Math.random();
    let color: THREE.Color;
    
    if (rand < 0.6) {
      color = primary;
    } else if (rand < 0.85) {
      color = secondary;
    } else {
      color = accent;
    }
    
    // 添加一些随机变化
    const variation = 0.1;
    colors[i * 3] = Math.min(1, Math.max(0, color.r + (Math.random() - 0.5) * variation));
    colors[i * 3 + 1] = Math.min(1, Math.max(0, color.g + (Math.random() - 0.5) * variation));
    colors[i * 3 + 2] = Math.min(1, Math.max(0, color.b + (Math.random() - 0.5) * variation));
  }
  
  return colors;
}

/**
 * 生成粒子大小
 * @param count 粒子数量
 * @param baseSize 基础大小
 * @returns Float32Array 包含大小值
 */
export function generateTreeSizes(
  count: number,
  baseSize: number = 0.05
): Float32Array {
  const sizes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // 随机大小变化
    sizes[i] = baseSize * (0.5 + Math.random() * 1.0);
  }
  
  return sizes;
}

/**
 * 更新粒子呼吸动画
 * @param sizes 原始大小数组
 * @param time 当前时间
 * @param intensity 动画强度
 * @returns 更新后的大小数组
 */
export function updateBreathingAnimation(
  sizes: Float32Array,
  time: number,
  intensity: number = 0.3
): Float32Array {
  const result = new Float32Array(sizes.length);
  
  for (let i = 0; i < sizes.length; i++) {
    // 每个粒子有不同的相位
    const phase = (i / sizes.length) * Math.PI * 2;
    const breathe = Math.sin(time * 2 + phase) * intensity + 1;
    result[i] = sizes[i] * breathe;
  }
  
  return result;
}

/**
 * 根据音频数据更新粒子颜色
 * @param baseColors 基础颜色数组
 * @param audioData 音频频谱数据
 * @param intensity 影响强度
 * @returns 更新后的颜色数组
 */
export function updateColorsWithAudio(
  baseColors: Float32Array,
  audioData: Uint8Array,
  intensity: number = 0.5
): Float32Array {
  const result = new Float32Array(baseColors.length);
  const particleCount = baseColors.length / 3;
  
  for (let i = 0; i < particleCount; i++) {
    // 根据粒子位置选择对应的频率
    const freqIndex = Math.floor((i / particleCount) * audioData.length);
    const audioValue = (audioData[freqIndex] || 0) / 255;
    
    // 增加亮度
    const boost = 1 + audioValue * intensity;
    
    result[i * 3] = Math.min(1, baseColors[i * 3] * boost);
    result[i * 3 + 1] = Math.min(1, baseColors[i * 3 + 1] * boost);
    result[i * 3 + 2] = Math.min(1, baseColors[i * 3 + 2] * boost);
  }
  
  return result;
}

/**
 * 验证粒子位置是否在圣诞树形状内
 * @param x X 坐标
 * @param y Y 坐标
 * @param z Z 坐标
 * @returns 是否在树形状内
 */
export function isInsideTreeShape(x: number, y: number, z: number): boolean {
  // 高度范围检查
  if (y < -0.5 || y > 3.5) {
    return false;
  }
  
  // 计算该高度的最大半径
  const maxRadius = (3.5 - y) * 0.4;
  
  // 计算实际水平距离
  const horizontalDistance = Math.sqrt(x * x + z * z);
  
  return horizontalDistance <= maxRadius;
}
