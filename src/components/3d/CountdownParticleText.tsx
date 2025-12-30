import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ColorTheme } from '@/types';
import { COLOR_THEME_MAP } from '@/types';
import { ensureFontLoaded, CHINESE_FONT_FAMILY } from '@/utils/fontLoader';

interface CountdownParticleTextProps {
  text: string;
  colorTheme: ColorTheme;
  particleCount?: number;
  position?: [number, number, number];
  scale?: number;
}

// 缓存已计算的字符粒子位置
const charPositionCache = new Map<string, Float32Array>();

/**
 * 获取单个字符的粒子位置（带缓存）
 */
function getCharParticlePositions(char: string, particlesPerChar: number): Float32Array {
  const cacheKey = `${char}_${particlesPerChar}`;
  if (charPositionCache.has(cacheKey)) {
    return charPositionCache.get(cacheKey)!;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    return createFallbackCharPositions(particlesPerChar);
  }
  
  const canvasSize = 128;
  const fontSize = 100;
  
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  
  ctx.font = `bold ${fontSize}px ${CHINESE_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  ctx.fillStyle = 'white';
  ctx.fillText(char, canvasSize / 2, canvasSize / 2);
  
  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const pixels = imageData.data;
  
  const whitePixels: [number, number][] = [];
  
  for (let y = 0; y < canvasSize; y += 2) {
    for (let x = 0; x < canvasSize; x += 2) {
      const idx = (y * canvasSize + x) * 4;
      if (pixels[idx] > 100) {
        whitePixels.push([x, y]);
      }
    }
  }
  
  if (whitePixels.length < 10) {
    // 空格或特殊字符
    const positions = new Float32Array(particlesPerChar * 3);
    for (let i = 0; i < particlesPerChar; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    charPositionCache.set(cacheKey, positions);
    return positions;
  }
  
  // 计算边界
  let minX = canvasSize, maxX = 0;
  let minY = canvasSize, maxY = 0;
  
  for (const [px, py] of whitePixels) {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY);
  const scaleVal = 1.5 / maxDim; // 增大字符尺寸
  
  const positions = new Float32Array(particlesPerChar * 3);
  
  for (let i = 0; i < particlesPerChar; i++) {
    const pixelIdx = Math.floor(Math.random() * whitePixels.length);
    const [px, py] = whitePixels[pixelIdx];
    
    positions[i * 3] = (px - centerX) * scaleVal + (Math.random() - 0.5) * 0.02;
    positions[i * 3 + 1] = -(py - centerY) * scaleVal + (Math.random() - 0.5) * 0.02;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  
  charPositionCache.set(cacheKey, positions);
  return positions;
}

function createFallbackCharPositions(particlesPerChar: number): Float32Array {
  const positions = new Float32Array(particlesPerChar * 3);
  for (let i = 0; i < particlesPerChar; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }
  return positions;
}


/**
 * 单个字符的粒子组件
 */
function CharParticles({
  char,
  colorTheme,
  particlesPerChar,
  xOffset,
}: {
  char: string;
  colorTheme: ColorTheme;
  particlesPerChar: number;
  xOffset: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const lastCharRef = useRef<string>('');
  const transitionProgress = useRef(1);
  
  // 初始化粒子数据
  const { colors, sizes, initialPositions } = useMemo(() => {
    const themeColors = COLOR_THEME_MAP[colorTheme];
    const primary = new THREE.Color(themeColors.primary);
    const secondary = new THREE.Color(themeColors.secondary);
    const accent = new THREE.Color(themeColors.accent);
    
    const colorsArray = new Float32Array(particlesPerChar * 3);
    const sizesArray = new Float32Array(particlesPerChar);
    const initPos = new Float32Array(particlesPerChar * 3);
    
    for (let i = 0; i < particlesPerChar; i++) {
      const rand = Math.random();
      let color: THREE.Color;
      if (rand < 0.5) color = primary;
      else if (rand < 0.8) color = secondary;
      else color = accent;
      
      colorsArray[i * 3] = color.r;
      colorsArray[i * 3 + 1] = color.g;
      colorsArray[i * 3 + 2] = color.b;
      
      sizesArray[i] = 0.08 + Math.random() * 0.04;
      
      initPos[i * 3] = 0;
      initPos[i * 3 + 1] = 0;
      initPos[i * 3 + 2] = 0;
    }
    
    return { colors: colorsArray, sizes: sizesArray, initialPositions: initPos };
  }, [particlesPerChar, colorTheme]);
  
  // 当字符变化时，计算新的目标位置
  useEffect(() => {
    if (char === lastCharRef.current) return;
    
    // 保存当前位置
    if (pointsRef.current && currentPositionsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const posArray = posAttr.array as Float32Array;
        for (let i = 0; i < posArray.length; i++) {
          currentPositionsRef.current[i] = posArray[i];
        }
      }
    } else {
      currentPositionsRef.current = new Float32Array(particlesPerChar * 3);
    }
    
    // 获取新字符的目标位置
    const charPositions = getCharParticlePositions(char, particlesPerChar);
    targetPositionsRef.current = charPositions;
    
    transitionProgress.current = 0;
    lastCharRef.current = char;
  }, [char, particlesPerChar]);
  
  // 动画更新
  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;
    if (!targetPositionsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    if (!positionAttr) return;
    
    const posArray = positionAttr.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // 更新过渡进度
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta * 4);
    }
    
    const progress = transitionProgress.current;
    const eased = 1 - Math.pow(1 - progress, 3);
    
    const currentPos = currentPositionsRef.current;
    const targetPos = targetPositionsRef.current;
    
    for (let i = 0; i < particlesPerChar; i++) {
      const i3 = i * 3;
      
      if (currentPos && progress < 1) {
        posArray[i3] = currentPos[i3] + (targetPos[i3] - currentPos[i3]) * eased;
        posArray[i3 + 1] = currentPos[i3 + 1] + (targetPos[i3 + 1] - currentPos[i3 + 1]) * eased;
        posArray[i3 + 2] = currentPos[i3 + 2] + (targetPos[i3 + 2] - currentPos[i3 + 2]) * eased;
      } else {
        const jitter = 0.002;
        posArray[i3] = targetPos[i3] + Math.sin(time * 2 + i * 0.01) * jitter;
        posArray[i3 + 1] = targetPos[i3 + 1] + Math.cos(time * 2 + i * 0.01) * jitter;
        posArray[i3 + 2] = targetPos[i3 + 2] + Math.sin(time * 3 + i * 0.01) * jitter;
      }
    }
    
    positionAttr.needsUpdate = true;
    materialRef.current.uniforms.uTime.value = time;
  });
  
  return (
    <group position={[xOffset, 0, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPerChar}
            array={initialPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particlesPerChar}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particlesPerChar}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={`
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float uTime;
            
            void main() {
              vColor = color;
              float breathe = sin(uTime * 1.5 + position.y * 2.0) * 0.1 + 1.0;
              
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * breathe * 400.0 / -mvPosition.z;
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            
            void main() {
              float dist = distance(gl_PointCoord, vec2(0.5));
              if (dist > 0.5) discard;
              
              float strength = 1.0 - (dist * 2.0);
              strength = pow(strength, 1.5);
              
              gl_FragColor = vec4(vColor, strength * 0.9);
            }
          `}
          uniforms={{
            uTime: { value: 0 },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}


// 最大支持的字符数量（支持完整倒计时格式如 "1天23:59:59"）
const MAX_CHARS = 12;

/**
 * 倒计时粒子文字组件
 * 使用固定数量的字符槽位，避免组件重新创建导致的 buffer 问题
 */
export default function CountdownParticleText({
  text,
  colorTheme,
  particleCount = 5000,
  position = [0, 0, 0],
  scale = 1,
}: CountdownParticleTextProps) {
  const [fontReady, setFontReady] = useState(false);
  
  // 加载字体
  useEffect(() => {
    ensureFontLoaded().then(() => setFontReady(true));
  }, []);
  
  // 将文字拆分为字符数组，填充到固定长度
  const chars = useMemo(() => {
    const textChars = text.split('').slice(0, MAX_CHARS);
    // 创建固定长度的数组，未使用的槽位用空字符串
    const result: string[] = new Array(MAX_CHARS).fill('');
    // 居中放置字符
    const startIndex = Math.floor((MAX_CHARS - textChars.length) / 2);
    for (let i = 0; i < textChars.length; i++) {
      result[startIndex + i] = textChars[i];
    }
    return result;
  }, [text]);
  
  // 固定每个字符的粒子数量（粒子总数除以槽位数）
  const particlesPerChar = useMemo(() => {
    return Math.floor(particleCount / MAX_CHARS);
  }, [particleCount]);
  
  // 计算字符宽度（根据字符类型）
  const getCharWidth = (char: string) => {
    if (char === '' || char === ' ') return 0;
    if (char === ':') return 0.5;
    if (/[天年还有距]/.test(char)) return 1.6; // 中文字符更宽
    return 1.2; // 数字
  };
  
  // 计算每个字符的 X 偏移（只计算非空字符）
  const charOffsets = useMemo(() => {
    const offsets: number[] = new Array(MAX_CHARS).fill(-1000);
    
    // 找出实际使用的字符范围
    let firstNonEmpty = -1;
    let lastNonEmpty = -1;
    for (let i = 0; i < MAX_CHARS; i++) {
      if (chars[i] !== '') {
        if (firstNonEmpty === -1) firstNonEmpty = i;
        lastNonEmpty = i;
      }
    }
    
    if (firstNonEmpty === -1) return offsets;
    
    // 计算总宽度
    let totalWidth = 0;
    for (let i = firstNonEmpty; i <= lastNonEmpty; i++) {
      totalWidth += getCharWidth(chars[i]) || 1.2;
    }
    
    // 计算每个字符的偏移（居中）
    let currentX = -totalWidth / 2;
    for (let i = firstNonEmpty; i <= lastNonEmpty; i++) {
      const width = getCharWidth(chars[i]) || 1.2;
      offsets[i] = currentX + width / 2;
      currentX += width;
    }
    
    return offsets;
  }, [chars]);
  
  if (!fontReady) return null;
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {chars.map((char, index) => (
        <CharParticles
          key={index}
          char={char || ' '}
          colorTheme={colorTheme}
          particlesPerChar={particlesPerChar}
          xOffset={charOffsets[index]}
        />
      ))}
    </group>
  );
}
