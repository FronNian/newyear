import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { MonthSlideConfig } from '@/types';
import { MONTH_NAMES } from '@/types';
import SlideImageElement from './SlideImageElement';
import SlideParticleText from './SlideParticleText';
import SlideBackground from './SlideBackground';

interface MonthStationProps {
  config: MonthSlideConfig;
  position: [number, number, number];
  isActive: boolean;
  tunnelColor?: string;
  opacity?: number;
}

export default function MonthStation({
  config,
  position,
  isActive,
  tunnelColor = '#6366f1',
  opacity = 1,
}: MonthStationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  
  // 清理定时器
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);
  
  // 元素显示逻辑
  useEffect(() => {
    if (!isActive) return;
    
    clearTimers();
    
    config.elements.forEach((element) => {
      const delay = element.entranceDelay || 0;
      if (delay === 0) {
        setVisibleElements(prev => new Set(prev).add(element.id));
      } else {
        const timer = window.setTimeout(() => {
          setVisibleElements(prev => new Set(prev).add(element.id));
        }, delay);
        timersRef.current.push(timer);
      }
    });
    
    return clearTimers;
  }, [isActive, config.elements, clearTimers]);
  
  // 计算站点框架尺寸
  const frameSize = useMemo(() => ({
    width: 8,
    height: 6,
    depth: 0.1,
  }), []);
  
  // 站点发光效果
  useFrame((state) => {
    if (frameRef.current && isActive) {
      const material = frameRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      material.opacity = opacity * pulse * 0.3;
    }
  });
  
  const monthName = MONTH_NAMES[config.month];
  
  // 检查元素是否应该显示
  const shouldShowElement = (elementId: string, entranceDelay: number = 0): boolean => {
    if (entranceDelay === 0) return true;
    return visibleElements.has(elementId);
  };
  
  // 计算透明度（非活跃站点更透明）
  const stationOpacity = isActive ? opacity : opacity * 0.5;
  
  return (
    <group ref={groupRef} position={position} rotation={[0, -Math.PI / 2, 0]}>
      {/* 站点框架 - 发光边框 */}
      <mesh ref={frameRef} position={[0, 0, -0.5]}>
        <planeGeometry args={[frameSize.width + 0.5, frameSize.height + 0.5]} />
        <meshBasicMaterial
          color={tunnelColor}
          transparent
          opacity={stationOpacity * 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 站点边框线 */}
      <lineSegments position={[0, 0, -0.4]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(frameSize.width, frameSize.height)]} />
        <lineBasicMaterial color={tunnelColor} transparent opacity={stationOpacity * 0.8} />
      </lineSegments>
      
      {/* 背景效果 */}
      {isActive && <SlideBackground effect={config.backgroundEffect} />}
      
      {/* 月份标题 */}
      <Text
        position={[0, frameSize.height / 2 - 0.5, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        material-transparent
        material-opacity={stationOpacity}
      >
        {config.title || monthName}
      </Text>
      
      {/* 副标题 */}
      {config.subtitle && (
        <Text
          position={[0, frameSize.height / 2 - 1.1, 0]}
          fontSize={0.25}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          material-transparent
          material-opacity={stationOpacity * 0.8}
        >
          {config.subtitle}
        </Text>
      )}
      
      {/* 月份数字标识 */}
      <Text
        position={[-frameSize.width / 2 + 0.5, -frameSize.height / 2 + 0.5, 0]}
        fontSize={0.3}
        color={tunnelColor}
        anchorX="left"
        anchorY="bottom"
        material-transparent
        material-opacity={stationOpacity * 0.6}
      >
        {String(config.month + 1).padStart(2, '0')}
      </Text>
      
      {/* 元素渲染 */}
      {config.elements.map((element) => {
        if (!shouldShowElement(element.id, element.entranceDelay)) {
          return null;
        }
        
        switch (element.type) {
          case 'image':
            return (
              <SlideImageElement
                key={element.id}
                config={element}
                opacity={stationOpacity}
              />
            );
          case 'particle_text':
            return (
              <SlideParticleText
                key={element.id}
                config={element}
                opacity={stationOpacity}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}
