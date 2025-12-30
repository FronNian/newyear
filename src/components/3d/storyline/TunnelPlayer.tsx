import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { EffectComposer } from '@react-three/postprocessing';
import { useStorylineStore } from '@/stores/storylineStore';
import { triggerCelebration } from '@/services/celebrationService';
import { useAppStore } from '@/stores/appStore';
import { musicService, DEFAULT_SONGS } from '@/services/musicService';
import TunnelWalls, { TUNNEL_LAYOUT } from './TunnelWalls';
import MonthStation from './MonthStation';
import CameraController, { calculateStationPositions, calculateCameraTarget } from './CameraController';
import { TunnelRadialBlur } from './TunnelPostProcessing';

interface TunnelPlayerProps {
  onComplete?: () => void;
  enableMotionBlur?: boolean;
}

export default function TunnelPlayer({ onComplete, enableMotionBlur = true }: TunnelPlayerProps) {
  const {
    storyline,
    tunnelConfig,
    currentMonthIndex,
    isPlaying,
    isStorylineMode,
    nextConfiguredMonth,
    exitStorylineMode,
    getConfiguredMonths,
  } = useStorylineStore();
  
  const triggerEffect = useAppStore((state) => state.triggerEffect);
  
  // 自动播放计时器ID
  const [autoPlayTimer, setAutoPlayTimer] = useState<number | null>(null);
  
  // 记录进入故事线前的音乐状态
  const previousMusicState = useRef<{
    wasPlaying: boolean;
    songId: string | null;
  } | null>(null);
  
  // 获取已配置的月份列表
  const configuredMonths = getConfiguredMonths();
  
  // 全局设置
  const globalSettings = storyline.globalSettings;
  
  // 故事线音乐控制
  useEffect(() => {
    if (isStorylineMode && globalSettings.musicEnabled) {
      // 保存当前音乐状态
      const currentSong = musicService.getCurrentSong();
      previousMusicState.current = {
        wasPlaying: musicService.getIsPlaying(),
        songId: currentSong?.id || null,
      };
      
      // 如果指定了音乐，加载并播放
      if (globalSettings.musicId) {
        const targetSong = DEFAULT_SONGS.find(s => s.id === globalSettings.musicId);
        if (targetSong) {
          musicService.load(targetSong).then(() => {
            musicService.play();
          });
        }
      } else {
        // 没有指定音乐，如果当前没在播放就播放当前歌曲
        if (!musicService.getIsPlaying()) {
          const currentSong = musicService.getCurrentSong();
          if (currentSong) {
            musicService.play();
          } else {
            // 没有当前歌曲，加载第一首
            musicService.load(DEFAULT_SONGS[0]).then(() => {
              musicService.play();
            });
          }
        }
      }
    }
    
    // 退出故事线时恢复之前的状态
    return () => {
      if (previousMusicState.current && !isStorylineMode) {
        // 如果之前没在播放，暂停音乐
        if (!previousMusicState.current.wasPlaying) {
          musicService.pause();
        }
        previousMusicState.current = null;
      }
    };
  }, [isStorylineMode, globalSettings.musicEnabled, globalSettings.musicId]);
  
  // 计算站点位置
  const stationPositions = useMemo(() => 
    calculateStationPositions(configuredMonths.length),
    [configuredMonths.length]
  );
  
  // 计算隧道长度
  const tunnelLength = useMemo(() => 
    Math.max(20, (configuredMonths.length - 1) * TUNNEL_LAYOUT.STATION_SPACING + 20),
    [configuredMonths.length]
  );
  
  // 当前相机目标位置
  const cameraTargetX = useMemo(() => 
    calculateCameraTarget(currentMonthIndex),
    [currentMonthIndex]
  );
  
  // 处理幻灯片切换
  const handleSlideTransition = useCallback(() => {
    const isLastConfiguredMonth = currentMonthIndex === configuredMonths.length - 1;
    
    if (isLastConfiguredMonth && !globalSettings.autoLoop) {
      // 最后一个已配置月份，触发庆祝
      if (globalSettings.triggerCelebrationOnEnd) {
        triggerEffect('firework');
        triggerCelebration();
      }
      exitStorylineMode();
      onComplete?.();
    } else {
      nextConfiguredMonth();
    }
  }, [
    currentMonthIndex,
    configuredMonths.length,
    globalSettings,
    nextConfiguredMonth,
    triggerEffect,
    exitStorylineMode,
    onComplete,
  ]);
  
  // 自动播放逻辑
  useEffect(() => {
    if (!isPlaying || !isStorylineMode) {
      if (autoPlayTimer) {
        window.clearTimeout(autoPlayTimer);
        setAutoPlayTimer(null);
      }
      return;
    }
    
    // 设置幻灯片持续时间计时器
    const timer = window.setTimeout(() => {
      handleSlideTransition();
    }, globalSettings.slideDuration);
    
    setAutoPlayTimer(timer);
    
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    isPlaying,
    isStorylineMode,
    currentMonthIndex,
    globalSettings.slideDuration,
    handleSlideTransition,
  ]);
  
  // 相机过渡完成回调
  const handleTransitionComplete = useCallback(() => {
    console.log(`[TunnelPlayer] 相机移动到站点 ${currentMonthIndex} 完成`);
  }, [currentMonthIndex]);
  
  // 不在故事线模式时不渲染
  if (!isStorylineMode) return null;
  
  // 没有已配置的月份时不渲染
  if (configuredMonths.length === 0) {
    console.warn('[TunnelPlayer] 没有已配置的月份');
    return null;
  }
  
  return (
    <group>
      {/* 相机控制器 */}
      <CameraController
        targetX={cameraTargetX}
        transitionDuration={globalSettings.transitionDuration}
        onTransitionComplete={handleTransitionComplete}
        enabled={isStorylineMode}
      />
      
      {/* 隧道墙体 + 速度线 + 光晕 */}
      <TunnelWalls
        length={tunnelLength}
        globalColor={tunnelConfig.colors.globalColor}
        monthColors={tunnelConfig.colors.monthColors}
        monthPositions={stationPositions}
        wallOpacity={tunnelConfig.wallOpacity}
        glowIntensity={tunnelConfig.glowIntensity}
        theme={tunnelConfig.theme}
        enableSpeedLines={true}
        enablePortalGlow={true}
      />
      
      {/* 月份站点 */}
      {configuredMonths.map((monthIndex, stationIndex) => {
        const slide = storyline.slides[monthIndex];
        const posX = stationPositions[stationIndex];
        const isActive = stationIndex === currentMonthIndex;
        const stationColor = tunnelConfig.colors.monthColors[monthIndex] || tunnelConfig.colors.globalColor;
        
        return (
          <MonthStation
            key={monthIndex}
            config={slide}
            position={[posX, 0, 0]}
            isActive={isActive}
            tunnelColor={stationColor}
            opacity={isActive ? 1 : 0.4}
          />
        );
      })}
      
      {/* 径向模糊后处理 - 相机移动时的运动模糊 */}
      {enableMotionBlur && (
        <EffectComposer>
          <TunnelRadialBlur maxStrength={0.12} samples={10} />
        </EffectComposer>
      )}
    </group>
  );
}
