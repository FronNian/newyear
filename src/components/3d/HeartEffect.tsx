import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HeartEffectProps {
  active?: boolean;
  onComplete?: () => void;
}

// 生成心形曲线上的点
function heartShape(t: number, scale: number = 1): THREE.Vector3 {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return new THREE.Vector3(x * scale * 0.05, y * scale * 0.05 + 2, 0);
}

export default function HeartEffect({ active = false, onComplete }: HeartEffectProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const completedRef = useRef(false);
  
  // 生成心形粒子
  const { positions, colors, count } = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const point = heartShape(t, 1);
      
      // 添加一些随机偏移
      positions[i * 3] = point.x + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.1;
      
      // 粉红色渐变
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.6 + Math.random() * 0.2;
    }
    
    return { positions, colors, count };
  }, []);
  
  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;
    
    timeRef.current += delta;
    
    // 脉冲动画
    const pulse = Math.sin(timeRef.current * 3) * 0.1 + 1;
    pointsRef.current.scale.setScalar(pulse);
    
    // 旋转
    pointsRef.current.rotation.y += delta * 0.5;
    
    // 3 秒后完成
    if (timeRef.current > 3 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });
  
  if (!active) {
    timeRef.current = 0;
    completedRef.current = false;
    return null;
  }
  
  return (
    <points ref={pointsRef} position={[0, 2, 0]}>
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
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
