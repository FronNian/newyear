import { useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStorylineStore } from '@/stores/storylineStore';
import { triggerCelebration } from '@/services/celebrationService';
import { useAppStore } from '@/stores/appStore';
import MonthSlide from './MonthSlide';
import TransitionEffect from './TransitionEffect';

interface StorylinePlayerProps {
  onComplete?: () => void;
}

export default function StorylinePlayer({ onComplete }: StorylinePlayerProps) {
  const {
    storyline,
    currentMonth,
    currentMonthIndex,
    isPlaying,
    isStorylineMode,
    transitionState,
    nextConfiguredMonth,
    setTransitionState,
    exitStorylineMode,
    getConfiguredMonths,
  } = useStorylineStore();
  
  const triggerEffect = useAppStore((state) => state.triggerEffect);
  
  // 过渡进度状态（使用 state 而不是 ref 以触发重新渲染）
  const [transitionProgress, setTransitionProgress] = useState(0);
  
  // 获取已配置的月份列表
  const configuredMonths = getConfiguredMonths();
  
  // 当前幻灯片配置
  const currentSlide = storyline.slides[currentMonth];
  const globalSettings = storyline.globalSettings;
  
  // 处理幻灯片切换
  const handleSlideTransition = useCallback(() => {
    if (!isPlaying) return;
    
    // 开始退出动画
    setTransitionState('exiting');
    setTransitionProgress(0);
    
    // 退出动画完成后切换到下一个已配置月份
    setTimeout(() => {
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
        setTransitionState('entering');
        setTransitionProgress(0);
      }
    }, globalSettings.transitionDuration);
  }, [
    isPlaying,
    currentMonthIndex,
    configuredMonths.length,
    globalSettings,
    nextConfiguredMonth,
    setTransitionState,
    triggerEffect,
    exitStorylineMode,
    onComplete,
  ]);
  
  // 自动播放逻辑
  useEffect(() => {
    if (!isPlaying || !isStorylineMode) return;
    
    // 进入时设置为 entering 状态（如果当前是 idle）
    if (transitionState === 'idle') {
      setTransitionState('entering');
      setTransitionProgress(0);
    }
    
    // 设置幻灯片持续时间计时器
    const slideDuration = globalSettings.slideDuration;
    const timer = window.setTimeout(() => {
      handleSlideTransition();
    }, slideDuration + globalSettings.transitionDuration);
    
    return () => window.clearTimeout(timer);
  }, [
    isPlaying,
    isStorylineMode,
    currentMonth,
    currentSlide,
    globalSettings,
    transitionState,
    setTransitionState,
    handleSlideTransition,
  ]);
  
  // 过渡动画进度更新
  useFrame((_, delta) => {
    if (transitionState === 'entering' || transitionState === 'exiting') {
      const duration = globalSettings.transitionDuration / 1000;
      setTransitionProgress(prev => {
        const next = Math.min(1, prev + delta / duration);
        
        // 进入动画完成
        if (transitionState === 'entering' && next >= 1) {
          setTransitionState('active');
          return 0;
        }
        
        return next;
      });
    }
  });
  
  // 不在故事线模式时不渲染
  if (!isStorylineMode) return null;
  
  // 没有已配置的月份时显示提示
  if (configuredMonths.length === 0) {
    console.warn('[StorylinePlayer] 没有已配置的月份');
    return null;
  }
  
  return (
    <group>
      {/* 当前月份幻灯片 */}
      <MonthSlide
        config={currentSlide}
        isActive={true}
        transitionState={transitionState}
        transitionProgress={transitionProgress}
      />
      
      {/* 过渡效果 */}
      {(transitionState === 'entering' || transitionState === 'exiting') && (
        <TransitionEffect
          type={currentSlide?.customTransition || globalSettings.transitionType}
          progress={transitionProgress}
          direction={transitionState === 'entering' ? 'in' : 'out'}
        />
      )}
    </group>
  );
}
