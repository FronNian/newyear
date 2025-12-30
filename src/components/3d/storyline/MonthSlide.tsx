import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { MonthSlideConfig, EntranceAnimation } from '@/types';
import { MONTH_NAMES } from '@/types';
import SlideImageElement from './SlideImageElement';
import SlideParticleText from './SlideParticleText';
import SlideBackground from './SlideBackground';

interface MonthSlideProps {
  config: MonthSlideConfig;
  isActive: boolean;
  transitionState: 'entering' | 'active' | 'exiting' | 'idle';
  transitionProgress: number;
}

/** 获取入场动画的初始变换 */
function getEntranceTransform(animation: EntranceAnimation, progress: number) {
  const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
  
  switch (animation) {
    case 'fade':
      return { opacity: eased, position: [0, 0, 0], scale: 1 };
    case 'slide_up':
      return { opacity: eased, position: [0, (1 - eased) * -2, 0], scale: 1 };
    case 'slide_down':
      return { opacity: eased, position: [0, (1 - eased) * 2, 0], scale: 1 };
    case 'zoom_in':
      return { opacity: eased, position: [0, 0, 0], scale: 0.5 + eased * 0.5 };
    case 'bounce':
      const bounce = Math.sin(progress * Math.PI * 2) * (1 - progress) * 0.3;
      return { opacity: eased, position: [0, bounce, 0], scale: 1 };
    default:
      return { opacity: 1, position: [0, 0, 0], scale: 1 };
  }
}

export default function MonthSlide({
  config,
  isActive,
  transitionState,
  transitionProgress,
}: MonthSlideProps) {
  const groupRef = useRef<THREE.Group>(null);
  // 简化：使用 Set 记录已显示的元素，不再清空
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  
  // 计算整体变换 - 修复：idle 状态下如果 isActive 也应该显示
  const transform = useMemo(() => {
    if (transitionState === 'entering') {
      return getEntranceTransform('fade', transitionProgress);
    } else if (transitionState === 'exiting') {
      return getEntranceTransform('fade', 1 - transitionProgress);
    }
    // idle 或 active 状态下完全显示
    return { opacity: 1, position: [0, 0, 0], scale: 1 };
  }, [transitionState, transitionProgress]);
  
  // 清理定时器
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);
  
  // 简化的元素显示逻辑 - 只在进入时设置延迟，不清空已显示的元素
  useEffect(() => {
    if (!isActive) return;
    
    // 清理之前的定时器
    clearTimers();
    
    // 设置元素显示
    config.elements.forEach((element) => {
      const delay = element.entranceDelay || 0;
      if (delay === 0) {
        // 立即显示
        setVisibleElements(prev => new Set(prev).add(element.id));
      } else {
        // 延迟显示
        const timer = window.setTimeout(() => {
          setVisibleElements(prev => new Set(prev).add(element.id));
        }, delay);
        timersRef.current.push(timer);
      }
    });
    
    return clearTimers;
  }, [isActive, config.elements, clearTimers]);
  
  // 动画更新
  useFrame(() => {
    if (!groupRef.current) return;
    
    // 应用变换
    groupRef.current.position.set(
      transform.position[0] as number,
      transform.position[1] as number,
      transform.position[2] as number
    );
    groupRef.current.scale.setScalar(transform.scale);
  });
  
  // 修复：移除阻止渲染的条件，让 isActive 的幻灯片始终渲染
  // 只有在完全不活跃且不在过渡中时才不渲染
  if (!isActive && transitionState === 'idle') {
    return null;
  }
  
  const monthName = MONTH_NAMES[config.month];
  
  // 检查元素是否应该显示
  const shouldShowElement = (elementId: string, entranceDelay: number = 0): boolean => {
    // 如果没有延迟，始终显示
    if (entranceDelay === 0) return true;
    // 否则检查是否已经过了延迟时间
    return visibleElements.has(elementId);
  };
  
  return (
    <group ref={groupRef}>
      {/* 背景效果 */}
      <SlideBackground effect={config.backgroundEffect} />
      
      {/* 月份标题 */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        material-transparent
        material-opacity={transform.opacity}
      >
        {config.title || monthName}
      </Text>
      
      {/* 副标题 */}
      {config.subtitle && (
        <Text
          position={[0, 2.3, 0]}
          fontSize={0.3}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          material-transparent
          material-opacity={transform.opacity * 0.8}
        >
          {config.subtitle}
        </Text>
      )}
      
      {/* 元素渲染 - 简化逻辑 */}
      {config.elements.map((element) => {
        // 检查是否应该显示
        if (!shouldShowElement(element.id, element.entranceDelay)) {
          return null;
        }
        
        switch (element.type) {
          case 'image':
            return (
              <SlideImageElement
                key={element.id}
                config={element}
                opacity={transform.opacity}
              />
            );
          case 'particle_text':
            return (
              <SlideParticleText
                key={element.id}
                config={element}
                opacity={transform.opacity}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}
