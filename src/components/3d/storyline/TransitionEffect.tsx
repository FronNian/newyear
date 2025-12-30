import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TransitionType } from '@/types';

interface TransitionEffectProps {
  type: TransitionType;
  progress: number; // 0-1
  direction: 'in' | 'out';
}

/** 过渡效果组件 - 用于月份切换时的视觉效果 */
export default function TransitionEffect({ type, progress, direction }: TransitionEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 计算实际进度（出场时反转）
  const actualProgress = direction === 'out' ? 1 - progress : progress;
  
  // 根据过渡类型计算效果
  const effectProps = useMemo(() => {
    const eased = 1 - Math.pow(1 - actualProgress, 2); // easeOutQuad
    
    switch (type) {
      case 'fade':
        return {
          opacity: direction === 'in' ? eased : 1 - eased,
          scale: 1,
          rotation: 0,
          position: [0, 0, 0],
        };
      
      case 'slide_left':
      case 'slide_right':
        const slideDir = type === 'slide_left' ? -1 : 1;
        const slideOffset = direction === 'in' ? (1 - eased) * 10 * slideDir : eased * -10 * slideDir;
        return {
          opacity: 1,
          scale: 1,
          rotation: 0,
          position: [slideOffset, 0, 0],
        };
      
      case 'zoom':
        const zoomScale = direction === 'in' ? 0.5 + eased * 0.5 : 1 + eased * 0.5;
        return {
          opacity: direction === 'in' ? eased : 1 - eased,
          scale: zoomScale,
          rotation: 0,
          position: [0, 0, 0],
        };
      
      case 'flip':
        const flipRotation = direction === 'in' ? (1 - eased) * Math.PI : eased * Math.PI;
        return {
          opacity: actualProgress > 0.5 ? 1 : 0,
          scale: 1,
          rotation: flipRotation,
          position: [0, 0, 0],
        };
      
      case 'dissolve':
        // 溶解效果通过噪点实现
        return {
          opacity: direction === 'in' ? eased : 1 - eased,
          scale: 1,
          rotation: 0,
          position: [0, 0, 0],
          dissolve: true,
        };
      
      default:
        return {
          opacity: 1,
          scale: 1,
          rotation: 0,
          position: [0, 0, 0],
        };
    }
  }, [type, actualProgress, direction]);
  
  // 更新 mesh 变换
  useFrame(() => {
    if (!meshRef.current) return;
    
    meshRef.current.position.set(
      effectProps.position[0],
      effectProps.position[1],
      effectProps.position[2]
    );
    meshRef.current.scale.setScalar(effectProps.scale);
    meshRef.current.rotation.y = effectProps.rotation;
  });
  
  // 如果是纯透明度过渡，不需要额外的遮罩
  if (type === 'fade' || type === 'dissolve') {
    return null;
  }
  
  // 对于其他过渡类型，可以添加遮罩效果
  return (
    <mesh ref={meshRef} position={[0, 0, 5]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={type === 'flip' ? (1 - effectProps.opacity) * 0.5 : 0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** 获取过渡效果的变换参数 */
export function getTransitionTransform(
  type: TransitionType,
  progress: number,
  direction: 'in' | 'out'
) {
  const eased = 1 - Math.pow(1 - progress, 2);
  const actualProgress = direction === 'out' ? 1 - eased : eased;
  
  switch (type) {
    case 'fade':
      return { opacity: actualProgress, x: 0, y: 0, scale: 1 };
    
    case 'slide_left':
    case 'slide_right':
      const dir = type === 'slide_left' ? -1 : 1;
      const offset = direction === 'in' ? (1 - actualProgress) * 5 * dir : actualProgress * -5 * dir;
      return { opacity: 1, x: offset, y: 0, scale: 1 };
    
    case 'zoom':
      const scale = direction === 'in' ? 0.5 + actualProgress * 0.5 : 1 - actualProgress * 0.5;
      return { opacity: actualProgress, x: 0, y: 0, scale };
    
    case 'flip':
      return { opacity: progress > 0.5 ? 1 : 0, x: 0, y: 0, scale: 1 };
    
    case 'dissolve':
      return { opacity: actualProgress, x: 0, y: 0, scale: 1 };
    
    default:
      return { opacity: 1, x: 0, y: 0, scale: 1 };
  }
}
