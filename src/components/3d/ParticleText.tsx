import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ColorTheme } from '@/types';
import { COLOR_THEME_MAP } from '@/types';
import { ensureFontLoaded, isFontLoaded, CHINESE_FONT_FAMILY } from '@/utils/fontLoader';

interface ParticleTextProps {
  text: string;
  colorTheme: ColorTheme;
  particleCount?: number;
  position?: [number, number, number];
  scale?: number;
  onComplete?: () => void;
  duration?: number;
  fontSize?: number;
}

/**
 * 从 Canvas 获取文字轮廓的粒子位置
 * 使用系统字体渲染，支持中文
 */
function getTextParticlePositions(
  text: string,
  particleCount: number
): Float32Array {
  // 创建离屏 Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    console.error('[ParticleText] 无法获取 Canvas 2D 上下文');
    return createFallbackPositions(particleCount);
  }
  
  // 根据文字长度动态调整 Canvas 尺寸
  const textLength = text.length;
  const canvasWidth = Math.max(512, textLength * 120);
  const canvasHeight = 256;
  const fontSize = 120; // 更大的字体以获得更多像素
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // 设置字体 - 使用共享的中文字体族
  ctx.font = `bold ${fontSize}px ${CHINESE_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 清空并填充黑色背景
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 绘制白色文字
  ctx.fillStyle = 'white';
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
  
  // 获取像素数据
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = imageData.data;
  
  // 收集所有白色像素的位置（使用边缘检测优化）
  const whitePixels: [number, number][] = [];
  
  // 采样步长 - 对于大 Canvas 可以跳过一些像素
  const step = canvasWidth > 512 ? 2 : 1;
  
  for (let y = 0; y < canvasHeight; y += step) {
    for (let x = 0; x < canvasWidth; x += step) {
      const idx = (y * canvasWidth + x) * 4;
      // 检查红色通道（白色文字的 R 值会很高）
      if (pixels[idx] > 100) {
        whitePixels.push([x, y]);
      }
    }
  }
  
  console.log(`[ParticleText] Canvas ${canvasWidth}x${canvasHeight}, 文字 "${text}", 找到 ${whitePixels.length} 个白色像素`);
  
  // 如果没有找到足够的像素，使用 fallback
  if (whitePixels.length < 50) {
    console.warn('[ParticleText] 像素点过少，使用 fallback 形状');
    return createFallbackPositions(particleCount);
  }
  
  // 计算文字的边界框
  let minX = canvasWidth, maxX = 0;
  let minY = canvasHeight, maxY = 0;
  
  for (const [px, py] of whitePixels) {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }
  
  const textWidth = maxX - minX;
  const textHeight = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // 生成粒子位置
  const positions = new Float32Array(particleCount * 3);
  // 缩放到 -2 到 2 的范围，保持宽高比
  const maxDim = Math.max(textWidth, textHeight);
  const scale = 4 / maxDim;
  
  for (let i = 0; i < particleCount; i++) {
    // 从白色像素中随机选择
    const pixelIdx = Math.floor(Math.random() * whitePixels.length);
    const [px, py] = whitePixels[pixelIdx];
    
    // 转换到 3D 坐标（居中，Y 轴翻转）
    positions[i * 3] = (px - centerX) * scale + (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 1] = -(py - centerY) * scale + (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
  
  return positions;
}

/**
 * 创建 fallback 形状（模拟文字的矩形区域）
 */
function createFallbackPositions(particleCount: number): Float32Array {
  const positions = new Float32Array(particleCount * 3);
  
  // 创建一个类似文字的形状：多个垂直条纹
  const numStripes = 5;
  const stripeWidth = 0.4;
  const stripeHeight = 1.5;
  const spacing = 0.6;
  
  for (let i = 0; i < particleCount; i++) {
    // 随机选择一个条纹
    const stripeIdx = Math.floor(Math.random() * numStripes);
    const stripeX = (stripeIdx - (numStripes - 1) / 2) * spacing;
    
    // 在条纹内随机分布
    positions[i * 3] = stripeX + (Math.random() - 0.5) * stripeWidth;
    positions[i * 3 + 1] = (Math.random() - 0.5) * stripeHeight;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
  }
  
  return positions;
}

/**
 * 生成随机散开的初始位置
 */
function generateScatteredPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3 + Math.random() * 5;
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  
  return positions;
}

export default function ParticleText({
  text,
  colorTheme,
  particleCount = 2000,
  position = [0, 2, 0],
  scale = 1,
  onComplete,
  duration = 2,
}: ParticleTextProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [phase, setPhase] = useState<'loading' | 'gather' | 'display' | 'scatter'>('loading');
  const phaseStartTime = useRef(Date.now());
  const [fontReady, setFontReady] = useState(isFontLoaded());
  
  // 加载字体
  useEffect(() => {
    if (!fontReady) {
      ensureFontLoaded().then(() => setFontReady(true));
    }
  }, [fontReady]);
  
  // 使用 useMemo 确保粒子数据只生成一次（字体加载后）
  const particleData = useMemo(() => {
    if (!fontReady) {
      // 返回空数据，等待字体加载
      return null;
    }
    
    console.log(`[ParticleText] 生成粒子数据: "${text}", ${particleCount} 个粒子`);
    
    const targetPositions = getTextParticlePositions(text, particleCount);
    const initialPositions = generateScatteredPositions(particleCount);
    const currentPositions = new Float32Array(initialPositions);
    
    // 生成颜色
    const themeColors = COLOR_THEME_MAP[colorTheme];
    const primary = new THREE.Color(themeColors.primary);
    const secondary = new THREE.Color(themeColors.secondary);
    const accent = new THREE.Color(themeColors.accent);
    
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const rand = Math.random();
      let color: THREE.Color;
      if (rand < 0.5) color = primary;
      else if (rand < 0.8) color = secondary;
      else color = accent;
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { targetPositions, initialPositions, currentPositions, colors };
  }, [text, particleCount, colorTheme, fontReady]);
  
  // 阶段控制
  useEffect(() => {
    if (!fontReady || !particleData) return;
    
    phaseStartTime.current = Date.now();
    setPhase('gather');
    
    const gatherDuration = 500;
    const displayDuration = duration * 1000;
    const scatterDuration = 500;
    
    const timer1 = setTimeout(() => {
      setPhase('display');
      phaseStartTime.current = Date.now();
    }, gatherDuration);
    
    let timer2: ReturnType<typeof setTimeout> | null = null;
    let timer3: ReturnType<typeof setTimeout> | null = null;
    
    // 只有短时间显示才触发 scatter
    if (duration <= 5) {
      timer2 = setTimeout(() => {
        setPhase('scatter');
        phaseStartTime.current = Date.now();
      }, gatherDuration + displayDuration);
      
      timer3 = setTimeout(() => {
        onComplete?.();
      }, gatherDuration + displayDuration + scatterDuration);
    }
    
    return () => {
      clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, [duration, onComplete, text, fontReady, particleData]);
  
  // 动画更新
  useFrame(() => {
    if (!pointsRef.current || !particleData || phase === 'loading') return;
    
    const { targetPositions, initialPositions } = particleData;
    const elapsed = Date.now() - phaseStartTime.current;
    const positionAttr = pointsRef.current.geometry.attributes.position;
    
    if (!positionAttr) return;
    
    const posArray = positionAttr.array as Float32Array;
    
    if (phase === 'gather') {
      const progress = Math.min(1, elapsed / 500);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] = initialPositions[i3] + (targetPositions[i3] - initialPositions[i3]) * eased;
        posArray[i3 + 1] = initialPositions[i3 + 1] + (targetPositions[i3 + 1] - initialPositions[i3 + 1]) * eased;
        posArray[i3 + 2] = initialPositions[i3 + 2] + (targetPositions[i3 + 2] - initialPositions[i3 + 2]) * eased;
      }
    } else if (phase === 'display') {
      const time = elapsed / 1000;
      const jitter = 0.003;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] = targetPositions[i3] + Math.sin(time * 2 + i * 0.01) * jitter;
        posArray[i3 + 1] = targetPositions[i3 + 1] + Math.cos(time * 2 + i * 0.01) * jitter;
        posArray[i3 + 2] = targetPositions[i3 + 2] + Math.sin(time * 3 + i * 0.01) * jitter;
      }
    } else if (phase === 'scatter') {
      const progress = Math.min(1, elapsed / 500);
      const eased = progress * progress;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const angle = Math.atan2(targetPositions[i3 + 2], targetPositions[i3]);
        const dist = 5 * eased;
        
        posArray[i3] = targetPositions[i3] + Math.cos(angle + i * 0.1) * dist;
        posArray[i3 + 1] = targetPositions[i3 + 1] + eased * 3;
        posArray[i3 + 2] = targetPositions[i3 + 2] + Math.sin(angle + i * 0.1) * dist;
      }
    }
    
    positionAttr.needsUpdate = true;
  });
  
  // 自适应粒子大小
  const particleSize = particleCount < 500 
    ? 0.1 * Math.sqrt(500 / particleCount)
    : 0.06;
  
  // 等待字体加载和粒子数据生成
  if (!particleData) {
    return null;
  }
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particleData.currentPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={particleData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={particleSize}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
