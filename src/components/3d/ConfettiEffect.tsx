import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConfettiEffectProps {
  active: boolean;
  intensity?: number;  // 0-1
  colors?: string[];
  count?: number;
}

const DEFAULT_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFD700', '#FF69B4',
  '#FFA500', '#9370DB', '#00CED1', '#FF6347',
];

// 使用固定的粒子数量，避免 buffer 大小变化
const FIXED_COUNT = 200;

export default function ConfettiEffect({
  active,
  intensity = 1,
  colors = DEFAULT_COLORS,
}: ConfettiEffectProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // 使用固定数量，通过 intensity 控制可见粒子数
  const visibleCount = Math.floor(FIXED_COUNT * intensity);
  
  // 生成彩纸数据 - 使用固定大小
  const { positions, velocities, colorArray } = useMemo(() => {
    const pos = new Float32Array(FIXED_COUNT * 3);
    const vel = new Float32Array(FIXED_COUNT * 3);
    const col = new Float32Array(FIXED_COUNT * 3);
    
    const colorObjects = colors.map(c => new THREE.Color(c));
    
    for (let i = 0; i < FIXED_COUNT; i++) {
      // 初始位置：从上方随机位置开始
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = 5 + Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // 速度：主要向下，带有水平漂移
      vel[i * 3] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 1] = -1 - Math.random() * 2;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      
      // 随机颜色
      const color = colorObjects[Math.floor(Math.random() * colorObjects.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    
    return {
      positions: pos,
      velocities: vel,
      colorArray: col,
    };
  }, [colors]);
  
  // 当前位置（用于动画）- 使用固定大小
  const currentPositions = useRef(new Float32Array(FIXED_COUNT * 3));
  
  // 初始化当前位置
  useEffect(() => {
    currentPositions.current.set(positions);
  }, [positions]);
  
  // 重置位置
  const resetParticle = (index: number) => {
    currentPositions.current[index * 3] = (Math.random() - 0.5) * 10;
    currentPositions.current[index * 3 + 1] = 5 + Math.random() * 3;
    currentPositions.current[index * 3 + 2] = (Math.random() - 0.5) * 10;
  };
  
  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    
    // 只更新可见的粒子
    for (let i = 0; i < visibleCount; i++) {
      // 更新位置
      currentPositions.current[i * 3] += velocities[i * 3] * delta;
      currentPositions.current[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      currentPositions.current[i * 3 + 2] += velocities[i * 3 + 2] * delta;
      
      // 添加摆动效果
      const time = Date.now() * 0.001;
      currentPositions.current[i * 3] += Math.sin(time + i) * 0.01;
      currentPositions.current[i * 3 + 2] += Math.cos(time + i * 0.7) * 0.01;
      
      // 如果落到地面以下，重置
      if (currentPositions.current[i * 3 + 1] < -3) {
        resetParticle(i);
      }
      
      // 更新缓冲区
      posArray[i * 3] = currentPositions.current[i * 3];
      posArray[i * 3 + 1] = currentPositions.current[i * 3 + 1];
      posArray[i * 3 + 2] = currentPositions.current[i * 3 + 2];
    }
    
    // 将不可见的粒子移到视野外
    for (let i = visibleCount; i < FIXED_COUNT; i++) {
      posArray[i * 3 + 1] = -100; // 移到视野外
    }
    
    posAttr.needsUpdate = true;
  });
  
  if (!active) return null;
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={FIXED_COUNT}
          array={currentPositions.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={FIXED_COUNT}
          array={colorArray}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
