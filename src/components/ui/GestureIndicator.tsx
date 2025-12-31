import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { GestureController } from './GestureController';

interface GestureIndicatorProps {
  debugMode?: boolean;
}

export default function GestureIndicator({ debugMode = false }: GestureIndicatorProps) {
  const [status, setStatus] = useState('');
  
  const triggerEffect = useAppStore((state) => state.triggerEffect);
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  const toggleParticleSpread = useAppStore((state) => state.toggleParticleSpread);
  const photos = useAppStore((state) => state.photos);
  const setSelectedPhotoId = useAppStore((state) => state.setSelectedPhotoId);
  const selectedPhotoId = useAppStore((state) => state.selectedPhotoId);
  const setPalmMove = useAppStore((state) => state.setPalmMove);
  const setZoomDelta = useAppStore((state) => state.setZoomDelta);
  
  // 处理手势
  const handleGesture = useCallback((gesture: string) => {
    switch (gesture) {
      case 'Closed_Fist':
        if (isParticleSpread) toggleParticleSpread();
        break;
      case 'Victory':
        if (!isParticleSpread) toggleParticleSpread();
        break;
      case 'Thumb_Up':
        triggerEffect('heart');
        break;
    }
  }, [isParticleSpread, toggleParticleSpread, triggerEffect]);
  
  // 处理捏合选择照片
  const handlePinch = useCallback((_pos: { x: number; y: number }) => {
    if (selectedPhotoId) {
      setSelectedPhotoId(null);
    } else if (photos.length > 0) {
      // 随机选择一张照片
      const randomIndex = Math.floor(Math.random() * photos.length);
      setSelectedPhotoId(photos[randomIndex].id);
    }
  }, [photos, selectedPhotoId, setSelectedPhotoId]);
  
  // 处理手掌移动
  const handlePalmMove = useCallback((dx: number, dy: number) => {
    setPalmMove({ x: dx, y: dy });
  }, [setPalmMove]);
  
  // 处理缩放
  const handleZoom = useCallback((delta: number) => {
    setZoomDelta(delta);
  }, [setZoomDelta]);
  
  return (
    <>
      {/* AI 状态显示 - 右上角小标签 */}
      <div className="fixed top-4 right-4 z-40">
        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white/80 text-xs">
          {status || 'AI 初始化中...'}
        </div>
      </div>
      
      {/* 手势控制器 - 默认启用 */}
      <GestureController
        enabled={true}
        debugMode={debugMode}
        onStatus={setStatus}
        onGesture={handleGesture}
        onPinch={handlePinch}
        onPalmMove={handlePalmMove}
        onZoom={handleZoom}
        isPhotoSelected={selectedPhotoId !== null}
        palmSpeed={25}
        zoomSpeed={100}
      />
    </>
  );
}
