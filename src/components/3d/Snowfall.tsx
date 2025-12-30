import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowfallProps {
  count?: number;
  area?: number;
}

export default function Snowfall({ count = 500, area = 20 }: SnowfallProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // 生成雪花位置和速度
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // 随机位置
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 1] = Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * area;
      
      // 随机下落速度
      vel[i] = 0.5 + Math.random() * 1.5;
    }
    
    return { positions: pos, velocities: vel };
  }, [count, area]);
  
  // 动画
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      // 下落
      let y = positionAttr.getY(i) - velocities[i] * delta;
      
      // 重置到顶部
      if (y < -2) {
        y = 15;
        positionAttr.setX(i, (Math.random() - 0.5) * area);
        positionAttr.setZ(i, (Math.random() - 0.5) * area);
      }
      
      // 水平飘动
      const x = positionAttr.getX(i) + Math.sin(time + i) * 0.01;
      const z = positionAttr.getZ(i) + Math.cos(time + i * 0.5) * 0.01;
      
      positionAttr.setXYZ(i, x, y, z);
    }
    
    positionAttr.needsUpdate = true;
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
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFFFFF"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
