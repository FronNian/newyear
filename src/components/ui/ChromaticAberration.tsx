/**
 * 色差效果组件 - 屏幕边缘RGB光晕效果
 * 作为频谱柱状图色差效果的补充，在屏幕边缘添加微妙的RGB光晕
 * 主要色差效果已集成到 SpectrumBars 组件中
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { useChromaticSettings, useVisualizerSettings } from '@/stores/appStore';
import { audioAnalyzerService } from '@/services/audioAnalyzerService';

interface ChromaticAberrationProps {
  isPlaying: boolean;
}

export default function ChromaticAberration({ isPlaying }: ChromaticAberrationProps) {
  const visualizerSettings = useVisualizerSettings();
  const settings = useChromaticSettings();
  const animationRef = useRef<number>(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const smoothedRef = useRef({ x: 0, y: 0 });

  // 总开关控制
  const isEnabled = visualizerSettings.enabled && settings.enabled;

  const updateOffset = useCallback(() => {
    if (!isPlaying || !isEnabled || settings.target !== 'global') {
      // 平滑归零
      smoothedRef.current.x *= 0.9;
      smoothedRef.current.y *= 0.9;
      if (Math.abs(smoothedRef.current.x) < 0.1) {
        smoothedRef.current = { x: 0, y: 0 };
      }
      setOffset({ ...smoothedRef.current });
      if (smoothedRef.current.x !== 0) {
        animationRef.current = requestAnimationFrame(updateOffset);
      }
      return;
    }

    // 获取音频振幅
    const bassEnergy = audioAnalyzerService.getBassEnergy();
    
    // 计算偏移量：强度 0-100 映射到最大偏移 0-10px（比之前更小）
    const maxOffset = (settings.intensity / 100) * 10;
    
    // 使用低频能量
    const normalizedAmplitude = bassEnergy / 255;
    const targetOffset = normalizedAmplitude * maxOffset;
    
    // 平滑过渡
    smoothedRef.current.x += (targetOffset - smoothedRef.current.x) * 0.3;
    smoothedRef.current.y += (targetOffset * 0.5 - smoothedRef.current.y) * 0.3;
    
    setOffset({ 
      x: smoothedRef.current.x, 
      y: smoothedRef.current.y 
    });
    animationRef.current = requestAnimationFrame(updateOffset);
  }, [isPlaying, isEnabled, settings.intensity, settings.target]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateOffset);
    return () => cancelAnimationFrame(animationRef.current);
  }, [updateOffset]);

  // 只在全局模式且有足够偏移时显示
  if (!isEnabled || settings.intensity === 0 || settings.target !== 'global') {
    return null;
  }

  const { colors } = settings;
  const hasOffset = offset.x > 0.5;

  if (!hasOffset) return null;

  // 屏幕边缘微妙光晕效果（作为频谱色差的补充）
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 左侧红色光晕 */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: `${Math.max(2, offset.x * 2)}px`,
          background: `linear-gradient(to right, ${colors.red}40, transparent)`,
          opacity: 0.6,
          filter: `blur(${offset.x * 0.5}px)`,
        }}
      />
      
      {/* 右侧蓝色光晕 */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{
          width: `${Math.max(2, offset.x * 2)}px`,
          background: `linear-gradient(to left, ${colors.blue}40, transparent)`,
          opacity: 0.6,
          filter: `blur(${offset.x * 0.5}px)`,
        }}
      />
      
      {/* 整体微妙边框光晕 */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `
            inset ${offset.x}px 0 ${offset.x * 2}px -${offset.x * 0.5}px ${colors.red}20,
            inset ${-offset.x}px 0 ${offset.x * 2}px -${offset.x * 0.5}px ${colors.blue}20
          `,
        }}
      />
    </div>
  );
}
