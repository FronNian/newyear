import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBlessingMessages, useBlessingColors } from '@/stores/appStore';
import { CHINESE_FONT_FAMILY } from '@/utils/fontLoader';

interface BlessingAnimationProps {
  visible: boolean;
  position?: [number, number, number];
}

// 字符位置缓存
const charPositionCache = new Map<string, Float32Array>();

/**
 * 获取单个字符的粒子位置（带缓存）
 */
function getCharParticlePositions(char: string, particlesPerChar: number): Float32Array {
  const cacheKey = `blessing_${char}_${particlesPerChar}`;
  if (charPositionCache.has(cacheKey)) {
    return charPositionCache.get(cacheKey)!;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    const positions = new Float32Array(particlesPerChar * 3);
    return positions;
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
  
  const positions = new Float32Array(particlesPerChar * 3);
  
  if (whitePixels.length < 10) {
    // 空格或特殊字符 - 返回全零位置（不显示）
    charPositionCache.set(cacheKey, positions);
    return positions;
  }
  
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
  const scaleVal = 1.4 / maxDim;
  
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


/**
 * 单个字符的粒子组件
 */
function BlessingCharParticles({
  char,
  colorStart,
  colorEnd,
  particlesPerChar,
  xOffset,
  charIndex,
  totalChars,
}: {
  char: string;
  colorStart: string;
  colorEnd: string;
  particlesPerChar: number;
  xOffset: number;
  charIndex: number;
  totalChars: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const lastCharRef = useRef<string>('');
  const transitionProgress = useRef(1);
  
  // 初始化粒子数据 - 使用渐变颜色
  const { colors, sizes, initialPositions } = useMemo(() => {
    // 根据字符位置计算渐变比例
    const gradientT = totalChars > 1 ? charIndex / (totalChars - 1) : 0.5;
    
    const startColor = new THREE.Color(colorStart);
    const endColor = new THREE.Color(colorEnd);
    const baseColor = startColor.clone().lerp(endColor, gradientT);
    
    const colorsArray = new Float32Array(particlesPerChar * 3);
    const sizesArray = new Float32Array(particlesPerChar);
    const initPos = new Float32Array(particlesPerChar * 3);
    
    for (let i = 0; i < particlesPerChar; i++) {
      // 在基础颜色上添加一些随机变化
      const variation = 0.1;
      const r = Math.max(0, Math.min(1, baseColor.r + (Math.random() - 0.5) * variation));
      const g = Math.max(0, Math.min(1, baseColor.g + (Math.random() - 0.5) * variation));
      const b = Math.max(0, Math.min(1, baseColor.b + (Math.random() - 0.5) * variation));
      
      colorsArray[i * 3] = r;
      colorsArray[i * 3 + 1] = g;
      colorsArray[i * 3 + 2] = b;
      
      sizesArray[i] = 0.1 + Math.random() * 0.05;
      
      initPos[i * 3] = 0;
      initPos[i * 3 + 1] = 0;
      initPos[i * 3 + 2] = 0;
    }
    
    return { colors: colorsArray, sizes: sizesArray, initialPositions: initPos };
  }, [particlesPerChar, colorStart, colorEnd, charIndex, totalChars]);
  
  // 当字符变化时，计算新的目标位置
  useEffect(() => {
    if (char === lastCharRef.current) return;
    
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
    
    const charPositions = getCharParticlePositions(char, particlesPerChar);
    targetPositionsRef.current = charPositions;
    
    transitionProgress.current = 0;
    lastCharRef.current = char;
  }, [char, particlesPerChar]);
  
  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;
    if (!targetPositionsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    if (!positionAttr) return;
    
    const posArray = positionAttr.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta * 3);
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
              gl_PointSize = size * breathe * 500.0 / -mvPosition.z;
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


// 固定的最大字符数，避免 buffer 大小变化
const MAX_CHARS = 20;
const PARTICLES_PER_CHAR = 400;

export default function BlessingAnimation({ visible, position = [0, 0, 0] }: BlessingAnimationProps) {
  const messages = useBlessingMessages();
  const blessingColors = useBlessingColors();
  const [msgIndex, setMsgIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  
  // 获取视口信息
  const { viewport } = useThree();
  
  // 当前消息
  useEffect(() => {
    if (visible && messages.length > 0) {
      setCurrentMessage(messages[msgIndex] || '新年快乐！');
    }
  }, [visible, msgIndex, messages]);
  
  // 消息轮换
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [visible, messages.length]);
  
  // 将文字拆分为字符数组（限制最大长度）
  const chars = useMemo(() => {
    const charArray = currentMessage.split('').slice(0, MAX_CHARS);
    // 填充到固定长度
    while (charArray.length < MAX_CHARS) {
      charArray.push(' ');
    }
    return charArray;
  }, [currentMessage]);
  
  // 计算字符宽度
  const getCharWidth = (char: string) => {
    if (char === ' ') return 0.8;
    if (/[！？。，、]/.test(char)) return 0.6;
    return 1.8; // 中文字符
  };
  
  // 根据屏幕宽度和字符数量计算缩放比例
  const dynamicScale = useMemo(() => {
    // 计算实际字符的总宽度
    const actualChars = currentMessage.split('').slice(0, MAX_CHARS);
    let totalWidth = 0;
    for (const char of actualChars) {
      totalWidth += getCharWidth(char);
    }
    
    // 使用视口宽度计算可用空间，留 20% 边距
    const availableWidth = viewport.width * 0.8;
    
    // 如果文字太宽，缩小；如果太窄，保持原样或稍微放大
    const scale = Math.min(1.0, availableWidth / Math.max(totalWidth, 1));
    
    return scale;
  }, [currentMessage, viewport.width]);
  
  // 计算每个字符的 X 偏移
  const charOffsets = useMemo(() => {
    const offsets: number[] = [];
    let totalWidth = 0;
    
    // 计算实际字符的总宽度（不包括填充的空格）
    const actualChars = currentMessage.split('').slice(0, MAX_CHARS);
    for (const char of actualChars) {
      totalWidth += getCharWidth(char);
    }
    
    let currentX = -totalWidth / 2;
    for (let i = 0; i < MAX_CHARS; i++) {
      const char = chars[i];
      const width = getCharWidth(char);
      if (i < actualChars.length) {
        offsets.push(currentX + width / 2);
        currentX += width;
      } else {
        // 填充的空格移到视野外
        offsets.push(-1000);
      }
    }
    
    return offsets;
  }, [chars, currentMessage]);
  
  // 淡入淡出
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const targetOpacity = visible ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * delta * 3;
    
    // 浮动效果
    if (visible) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });
  
  if (!visible && opacityRef.current < 0.01) return null;
  
  // 计算实际显示的字符数（不包括填充的空格）
  const actualCharCount = useMemo(() => {
    return currentMessage.split('').slice(0, MAX_CHARS).length;
  }, [currentMessage]);
  
  return (
    <group ref={groupRef} position={position} scale={[dynamicScale, dynamicScale, dynamicScale]}>
      {chars.map((char, index) => (
        <BlessingCharParticles
          key={index}
          char={char}
          colorStart={blessingColors.start}
          colorEnd={blessingColors.end}
          particlesPerChar={PARTICLES_PER_CHAR}
          xOffset={charOffsets[index]}
          charIndex={index}
          totalChars={actualCharCount}
        />
      ))}
    </group>
  );
}
