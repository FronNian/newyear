import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSettings } from '@/stores/appStore';
import CountdownParticleText from './CountdownParticleText';

interface YearDisplayProps {
  visible: boolean;
  onAnimationComplete?: () => void;
}

// 粒子火花效果
function Sparkles({ count = 50, radius = 2.5 }: { count?: number; radius?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, velocities, colors, lifetimes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const life = new Float32Array(count);
    
    const goldColors = [
      new THREE.Color('#FFD700'),
      new THREE.Color('#FFA500'),
      new THREE.Color('#FFEC8B'),
      new THREE.Color('#FFFFFF'),
    ];
    
    for (let i = 0; i < count; i++) {
      // 随机位置在球面上
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.4);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      // 随机速度（向外扩散）
      vel[i * 3] = (Math.random() - 0.5) * 0.5;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      // 随机颜色
      const color = goldColors[Math.floor(Math.random() * goldColors.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      
      // 随机生命周期
      life[i] = Math.random();
    }
    
    return { positions: pos, velocities: vel, colors: col, lifetimes: life };
  }, [count, radius]);
  
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // 更新生命周期
      lifetimes[i] -= delta * 0.5;
      
      if (lifetimes[i] <= 0) {
        // 重置粒子
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * (0.8 + Math.random() * 0.4);
        
        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posArray[i * 3 + 2] = r * Math.cos(phi);
        
        lifetimes[i] = 1;
      } else {
        // 更新位置
        posArray[i * 3] += velocities[i * 3] * delta;
        posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;
      }
    }
    
    posAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function YearDisplay({ visible, onAnimationComplete }: YearDisplayProps) {
  const settings = useSettings();
  const groupRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  const animationStartTime = useRef<number | null>(null);
  const pulsePhase = useRef(0);
  
  const yearText = String(settings.targetYear);
  
  // 调试日志
  useEffect(() => {
    console.log('[YearDisplay] visible:', visible, 'opacity:', opacity);
  }, [visible, opacity]);
  
  // 控制显示/隐藏动画
  useEffect(() => {
    if (visible) {
      console.log('[YearDisplay] Starting fade in animation');
      animationStartTime.current = Date.now();
      setShowSparkles(true);
      setOpacity(0.1); // 立即设置一个初始值
      
      // 淡入动画
      const fadeIn = setInterval(() => {
        setOpacity(prev => {
          const newVal = Math.min(1, prev + 0.08);
          if (newVal >= 1) {
            clearInterval(fadeIn);
            return 1;
          }
          return newVal;
        });
      }, 30);
      
      return () => clearInterval(fadeIn);
    } else {
      // 淡出动画
      const fadeOut = setInterval(() => {
        setOpacity(prev => {
          if (prev <= 0) {
            clearInterval(fadeOut);
            setShowSparkles(false);
            return 0;
          }
          return prev - 0.05;
        });
      }, 30);
      
      return () => clearInterval(fadeOut);
    }
  }, [visible]);
  
  // 脉冲动画和完成回调
  useFrame((_, delta) => {
    if (!groupRef.current || !visible) return;
    
    // 脉冲动画：scale 在 0.95-1.05 之间振荡
    pulsePhase.current += delta * 3;
    const pulseScale = 1 + Math.sin(pulsePhase.current) * 0.05;
    groupRef.current.scale.setScalar(pulseScale);
    
    // 检查动画是否完成（显示 3 秒后）
    if (animationStartTime.current) {
      const elapsed = Date.now() - animationStartTime.current;
      if (elapsed > 3000 && onAnimationComplete) {
        onAnimationComplete();
        animationStartTime.current = null;
      }
    }
  });
  
  if (opacity <= 0 && !visible) return null;
  
  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      {/* 年份粒子文字 */}
      <group scale={[opacity, opacity, opacity]}>
        <CountdownParticleText
          text={yearText}
          colorTheme={settings.colorTheme}
          particleCount={settings.countdownParticleCount || 15000}
          particleSize={settings.countdownParticleSize || 1.5}
          position={[0, 0, 0]}
          scale={2.5}
        />
      </group>
      
      {/* 粒子火花 */}
      {showSparkles && <Sparkles count={80} radius={2.5} />}
    </group>
  );
}
