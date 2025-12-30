/**
 * 全局色差效果组件
 * 使用CSS filter实现真正的RGB通道分离效果
 * 通过动态注入样式影响整个页面
 */
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useChromaticSettings, useAppStore, useVisualizerSettings } from '@/stores/appStore';
import { audioAnalyzerService } from '@/services/audioAnalyzerService';
import { calculateDirectionalOffset, clamp, getRecommendedQuality } from '@/utils/chromaticUtils';

/** 样式ID */
const STYLE_ID = 'global-chromatic-aberration-style';
const FILTER_ID = 'global-chromatic-aberration-filter';

/**
 * 音频同步Hook
 * 根据音频低频能量返回强度修正值
 */
function useAudioSync(enabled: boolean, sensitivity: number): number {
  const [audioModifier, setAudioModifier] = useState(0);
  const smoothedRef = useRef(0);
  const animationRef = useRef<number>(0);
  const isPlaying = useAppStore((state) => state.isPlaying);

  const updateAudioModifier = useCallback(() => {
    if (!enabled || !isPlaying) {
      smoothedRef.current *= 0.92;
      if (Math.abs(smoothedRef.current) < 0.01) {
        smoothedRef.current = 0;
      }
      setAudioModifier(smoothedRef.current);
      
      if (smoothedRef.current > 0.01) {
        animationRef.current = requestAnimationFrame(updateAudioModifier);
      }
      return;
    }

    const bassEnergy = audioAnalyzerService.getBassEnergy();
    const normalized = (bassEnergy / 255) * (sensitivity / 100);
    
    smoothedRef.current += (normalized - smoothedRef.current) * 0.25;
    setAudioModifier(smoothedRef.current);
    
    animationRef.current = requestAnimationFrame(updateAudioModifier);
  }, [enabled, sensitivity, isPlaying]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateAudioModifier);
    return () => cancelAnimationFrame(animationRef.current);
  }, [updateAudioModifier]);

  return audioModifier;
}

export default function GlobalChromaticAberration() {
  const visualizerSettings = useVisualizerSettings();
  const settings = useChromaticSettings();
  const deviceInfo = useAppStore((state) => state.deviceInfo);
  
  // 总开关控制
  const isVisualizerEnabled = visualizerSettings.enabled;
  
  const audioModifier = useAudioSync(
    isVisualizerEnabled && settings.audioSync.enabled,
    settings.audioSync.sensitivity
  );
  
  const qualitySettings = useMemo(() => {
    if (!deviceInfo) return { enabled: true, maxIntensity: 100 };
    return getRecommendedQuality(deviceInfo.performanceLevel);
  }, [deviceInfo]);
  
  const finalIntensity = useMemo(() => {
    if (!isVisualizerEnabled || !settings.enabled || !qualitySettings.enabled) return 0;
    
    let intensity = settings.intensity;
    
    if (settings.audioSync.enabled) {
      intensity = settings.intensity * 0.3 + settings.intensity * 0.7 * (1 + audioModifier);
    }
    
    return clamp(intensity, 0, qualitySettings.maxIntensity);
  }, [isVisualizerEnabled, settings.enabled, settings.intensity, settings.audioSync.enabled, audioModifier, qualitySettings]);
  
  const offsets = useMemo(() => {
    return calculateDirectionalOffset(finalIntensity, settings.direction);
  }, [finalIntensity, settings.direction]);

  const isGlobalActive = isVisualizerEnabled && settings.enabled && settings.target === 'global' && finalIntensity >= 0.5;
  const isTextActive = isVisualizerEnabled && settings.enabled && settings.target === 'text' && finalIntensity >= 0.5;
  const isCountdownActive = isVisualizerEnabled && settings.enabled && settings.target === 'countdown' && finalIntensity >= 0.5;
  const isActive = isGlobalActive || isTextActive || isCountdownActive;

  // 动态注入/更新全局样式
  useEffect(() => {
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    
    if (!isActive) {
      if (styleEl) {
        styleEl.remove();
      }
      // 移除 body 上的 data 属性
      document.body.removeAttribute('data-chromatic-mode');
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    // 设置 body 上的 data 属性，方便其他组件检测
    document.body.setAttribute('data-chromatic-mode', settings.target);

    if (isGlobalActive) {
      // 全局模式：应用到整个页面
      styleEl.textContent = `
        body {
          filter: url(#${FILTER_ID});
        }
      `;
    } else if (isTextActive) {
      // 文字模式：应用到 canvas 和标记了 data-chromatic-text 的元素
      styleEl.textContent = `
        canvas {
          filter: url(#${FILTER_ID});
        }
        [data-chromatic-text] {
          filter: url(#${FILTER_ID});
        }
      `;
    } else if (isCountdownActive) {
      // 倒计时模式：只应用到 canvas
      styleEl.textContent = `
        canvas {
          filter: url(#${FILTER_ID});
        }
      `;
    }

    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
      document.body.removeAttribute('data-chromatic-mode');
    };
  }, [isActive, isGlobalActive, isTextActive, isCountdownActive, settings.target, offsets]);

  // 始终渲染 SVG 滤镜定义，但只在激活时应用样式
  return (
    <svg 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0, 
        height: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id={FILTER_ID} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          {/* 红色通道 */}
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            in="SourceGraphic"
            result="red"
          />
          <feOffset in="red" dx={isActive ? offsets.redOffset.x : 0} dy={isActive ? offsets.redOffset.y : 0} result="redShifted" />
          
          {/* 绿色通道 - 保持中心 */}
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            in="SourceGraphic"
            result="green"
          />
          
          {/* 蓝色通道 */}
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            in="SourceGraphic"
            result="blue"
          />
          <feOffset in="blue" dx={isActive ? offsets.blueOffset.x : 0} dy={isActive ? offsets.blueOffset.y : 0} result="blueShifted" />
          
          {/* 合成 */}
          <feBlend mode="screen" in="redShifted" in2="green" result="rg" />
          <feBlend mode="screen" in="rg" in2="blueShifted" result="final" />
        </filter>
      </defs>
    </svg>
  );
}
