import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { TUNNEL_LAYOUT } from './TunnelWalls';

interface CameraControllerProps {
  targetX: number;
  transitionDuration?: number;
  onTransitionComplete?: () => void;
  enabled?: boolean;
}

export default function CameraController({
  targetX,
  transitionDuration = 1000,
  onTransitionComplete,
  enabled = true,
}: CameraControllerProps) {
  const { camera } = useThree();
  const currentX = useRef(targetX); // 初始值设为 targetX
  const targetXRef = useRef(targetX);
  const isTransitioning = useRef(false);
  const transitionStartTime = useRef(0);
  const transitionStartX = useRef(0);
  const hasCalledComplete = useRef(false);
  const isInitialized = useRef(false);
  
  // 更新目标位置
  useEffect(() => {
    if (targetXRef.current !== targetX) {
      targetXRef.current = targetX;
      isTransitioning.current = true;
      transitionStartTime.current = Date.now();
      transitionStartX.current = currentX.current;
      hasCalledComplete.current = false;
    }
  }, [targetX]);
  
  // 初始化相机位置 - 只在 enabled 变为 true 时执行一次
  useEffect(() => {
    if (enabled && !isInitialized.current) {
      // 相机在站点后方5单位处，看向站点
      const newPosX = targetX - 8;
      console.log('[CameraController] 初始化相机:', {
        targetX,
        cameraPosition: [newPosX, TUNNEL_LAYOUT.CAMERA_Y, TUNNEL_LAYOUT.CAMERA_Z],
        lookAt: [targetX, 0, 0],
      });
      camera.position.set(newPosX, TUNNEL_LAYOUT.CAMERA_Y, TUNNEL_LAYOUT.CAMERA_Z);
      camera.up.set(0, 1, 0); // 确保相机的 "up" 向量是 Y 轴正方向
      camera.lookAt(targetX, 0, 0);
      currentX.current = targetX;
      targetXRef.current = targetX;
      isInitialized.current = true;
    }
    
    // 当 enabled 变为 false 时，重置初始化标志
    if (!enabled) {
      isInitialized.current = false;
    }
  }, [enabled, targetX, camera]);
  
  // 缓动函数 - easeInOutCubic
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // 动画更新
  useFrame(() => {
    if (!enabled) return;
    
    if (isTransitioning.current) {
      const elapsed = Date.now() - transitionStartTime.current;
      const progress = Math.min(1, elapsed / transitionDuration);
      const easedProgress = easeInOutCubic(progress);
      
      // 计算当前位置
      currentX.current = transitionStartX.current + 
        (targetXRef.current - transitionStartX.current) * easedProgress;
      
      // 更新相机位置 - 相机在隧道内部，稍微后退以看到当前站点
      camera.position.x = currentX.current - 8;
      camera.position.y = TUNNEL_LAYOUT.CAMERA_Y;
      camera.position.z = TUNNEL_LAYOUT.CAMERA_Z;
      
      // 相机看向当前站点位置
      camera.lookAt(currentX.current, 0, 0);
      
      // 过渡完成
      if (progress >= 1) {
        isTransitioning.current = false;
        currentX.current = targetXRef.current;
        
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true;
          onTransitionComplete?.();
        }
      }
    } else {
      // 非过渡状态，保持相机位置 - 相机在站点后方5单位处
      camera.position.x = currentX.current - 8;
      camera.position.y = TUNNEL_LAYOUT.CAMERA_Y;
      camera.position.z = TUNNEL_LAYOUT.CAMERA_Z;
      camera.lookAt(currentX.current, 0, 0);
    }
  });
  
  return null;
}

/** 计算月份站点的X坐标 */
export function calculateStationPositions(configuredMonthCount: number): number[] {
  return Array.from({ length: configuredMonthCount }, (_, index) => 
    index * TUNNEL_LAYOUT.STATION_SPACING
  );
}

/** 计算相机目标位置 */
export function calculateCameraTarget(stationIndex: number): number {
  return stationIndex * TUNNEL_LAYOUT.STATION_SPACING;
}
