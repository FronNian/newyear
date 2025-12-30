import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DecorItemData } from '@/types';
import { DECOR_TYPE_CONFIGS } from '@/types';
import { getGeometryForType } from '@/utils/decorGeometries';
import { calculateShimmer } from '@/utils/decorUtils';

interface DecorItemProps {
  data: DecorItemData;
  shimmerIntensity: number;
  spreadProgress: number; // 0 = 聚合, 1 = 散开
  basePosition: [number, number, number]; // 聚合时的位置（跟随形状）
  spreadPosition: [number, number, number]; // 散开时的位置
}

export default function DecorItem({ 
  data, 
  shimmerIntensity, 
  spreadProgress,
  basePosition,
  spreadPosition 
}: DecorItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const config = DECOR_TYPE_CONFIGS[data.type];
  
  // 创建几何体
  const geometry = useMemo(() => {
    return getGeometryForType(data.type);
  }, [data.type]);
  
  // 解析颜色
  const color = useMemo(() => new THREE.Color(data.color), [data.color]);
  
  // 初始旋转
  const initialRotation = useMemo(() => ({
    x: data.rotation[0],
    y: data.rotation[1],
    z: data.rotation[2],
  }), [data.rotation]);
  
  // 动画
  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // 计算插值位置（聚合 <-> 散开）
    const t = spreadProgress;
    const currentX = basePosition[0] * (1 - t) + spreadPosition[0] * t;
    const currentY = basePosition[1] * (1 - t) + spreadPosition[1] * t;
    const currentZ = basePosition[2] * (1 - t) + spreadPosition[2] * t;
    
    // 星星闪烁效果 - 使用新的闪烁算法
    const shimmer = calculateShimmer(time, data.shimmerOffset, shimmerIntensity);
    // 发光强度随闪烁变化，模拟星星一闪一闪的效果
    materialRef.current.emissiveIntensity = shimmer * config.emissiveIntensity;
    // 透明度也随之变化，增强闪烁感
    materialRef.current.opacity = 0.6 + shimmer * 0.4;
    
    // 缓慢旋转
    meshRef.current.rotation.y = initialRotation.y + time * 0.3;
    
    // 轻柔浮动
    const floatOffset = Math.sin(time * 0.5 + data.shimmerOffset * Math.PI * 2) * 0.1;
    meshRef.current.position.set(currentX, currentY + floatOffset, currentZ);
    
    // 特殊动画（蝴蝶、萤火虫等）
    if (config.hasAnimation) {
      if (data.type === 'butterfly') {
        meshRef.current.scale.x = config.scale[0] * data.scale * (0.8 + Math.sin(time * 8) * 0.2);
      } else if (data.type === 'firefly') {
        // 萤火虫使用更强烈的闪烁效果
        materialRef.current.emissiveIntensity = shimmer * config.emissiveIntensity * (0.3 + Math.sin(time * 4) * 0.7);
      } else if (data.type === 'heart-decor') {
        const heartbeat = 1 + Math.sin(time * 3) * 0.1;
        meshRef.current.scale.setScalar(data.scale * heartbeat);
      } else if (data.type === 'balloon') {
        meshRef.current.rotation.z = Math.sin(time * 0.8 + data.shimmerOffset * Math.PI) * 0.1;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={basePosition}
      rotation={[initialRotation.x, initialRotation.y, initialRotation.z]}
      scale={[
        config.scale[0] * data.scale,
        config.scale[1] * data.scale,
        config.scale[2] * data.scale,
      ]}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={config.emissiveIntensity}
        transparent
        opacity={0.9}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}
