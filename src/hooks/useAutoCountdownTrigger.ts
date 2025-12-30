import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppStore, useAutoTriggerConfig } from '@/stores/appStore';
import { 
  calculateTargetTime, 
  shouldAutoTrigger, 
  isTargetTimePassed,
  getTimezoneDisplay,
  getSecondsToTarget,
} from '@/utils/countdown';

/**
 * 自动倒计时触发 Hook
 * 监控时间，在到达目标时间时自动触发庆祝效果
 */
export function useAutoCountdownTrigger() {
  const autoTriggerConfig = useAutoTriggerConfig();
  const settings = useAppStore((state) => state.settings);
  const startCelebration = useAppStore((state) => state.startCelebration);
  const startManualCountdown = useAppStore((state) => state.startManualCountdown);
  const setAutoTriggerHasTriggered = useAppStore((state) => state.setAutoTriggerHasTriggered);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  
  const hasTriggeredRef = useRef(autoTriggerConfig.hasTriggered);
  
  // 计算目标时间
  const targetTime = useMemo(() => {
    return calculateTargetTime(settings.targetYear, autoTriggerConfig.timezone);
  }, [settings.targetYear, autoTriggerConfig.timezone]);
  
  // 获取时区显示信息
  const timezoneDisplay = useMemo(() => {
    return getTimezoneDisplay(autoTriggerConfig.timezone);
  }, [autoTriggerConfig.timezone]);
  
  // 检查是否应该显示手动触发按钮
  const shouldShowManualTrigger = useMemo(() => {
    const now = new Date();
    const isPassed = isTargetTimePassed(targetTime, now);
    
    // 时间已过且未触发，或者自动触发已禁用且时间已过
    return (isPassed && !autoTriggerConfig.hasTriggered) || 
           (!autoTriggerConfig.enabled && isPassed);
  }, [targetTime, autoTriggerConfig.hasTriggered, autoTriggerConfig.enabled]);
  
  // 触发庆祝效果
  const triggerCelebration = useCallback(() => {
    const { effects } = autoTriggerConfig;
    
    // 标记已触发
    setAutoTriggerHasTriggered(true);
    hasTriggeredRef.current = true;
    
    // 根据配置触发效果
    if (effects.countdownAnimation) {
      startManualCountdown();
    }
    
    if (effects.music) {
      setIsPlaying(true);
    }
    
    if (effects.fireworks) {
      // 烟花效果会在 startCelebration 中自动触发
      startCelebration();
    } else if (effects.countdownAnimation) {
      // 如果只有倒计时动画，也需要启动庆祝状态
      startCelebration();
    }
    
    console.log('[AutoTrigger] 🎉 庆祝效果已触发！', {
      countdownAnimation: effects.countdownAnimation,
      music: effects.music,
      fireworks: effects.fireworks,
    });
  }, [autoTriggerConfig, setAutoTriggerHasTriggered, startManualCountdown, setIsPlaying, startCelebration]);
  
  // 监控时间，自动触发
  useEffect(() => {
    if (!autoTriggerConfig.enabled || hasTriggeredRef.current) {
      return;
    }
    
    const checkAndTrigger = () => {
      const now = new Date();
      const shouldTrigger = shouldAutoTrigger(
        targetTime,
        now,
        hasTriggeredRef.current,
        autoTriggerConfig.enabled
      );
      
      if (shouldTrigger) {
        console.log('[AutoTrigger] ⏰ 时间到达，自动触发庆祝！');
        triggerCelebration();
      }
    };
    
    // 立即检查一次
    checkAndTrigger();
    
    // 每秒检查一次
    const interval = setInterval(checkAndTrigger, 1000);
    
    return () => clearInterval(interval);
  }, [autoTriggerConfig.enabled, targetTime, triggerCelebration]);
  
  // 同步 ref 状态
  useEffect(() => {
    hasTriggeredRef.current = autoTriggerConfig.hasTriggered;
  }, [autoTriggerConfig.hasTriggered]);
  
  return {
    targetTime,
    timezoneDisplay,
    isAutoEnabled: autoTriggerConfig.enabled,
    hasTriggered: autoTriggerConfig.hasTriggered,
    shouldShowManualTrigger,
    triggerCelebration,
    effects: autoTriggerConfig.effects,
  };
}

// ============================================
// 控制台调试命令
// ============================================

/**
 * 暴露调试命令到 window 对象，方便在控制台测试
 */
export function setupAutoTriggerDebugCommands() {
  if (typeof window === 'undefined') return;
  
  const debug = {
    // 获取当前自动触发配置
    getConfig: () => {
      const state = useAppStore.getState();
      console.log('📋 当前自动触发配置:', state.autoTriggerConfig);
      return state.autoTriggerConfig;
    },
    
    // 启用/禁用自动触发
    setEnabled: (enabled: boolean) => {
      useAppStore.getState().setAutoTriggerEnabled(enabled);
      console.log(`✅ 自动触发已${enabled ? '启用' : '禁用'}`);
    },
    
    // 设置时区
    setTimezone: (timezone: string) => {
      useAppStore.getState().setAutoTriggerTimezone(timezone);
      const display = getTimezoneDisplay(timezone);
      console.log(`🌍 时区已设置为: ${display.name} (${display.offset})`);
    },
    
    // 设置效果配置
    setEffects: (effects: { countdownAnimation?: boolean; music?: boolean; fireworks?: boolean }) => {
      useAppStore.getState().setAutoTriggerEffects(effects);
      console.log('🎆 效果配置已更新:', effects);
    },
    
    // 重置触发状态（用于测试）
    resetTrigger: () => {
      useAppStore.getState().setAutoTriggerHasTriggered(false);
      console.log('🔄 触发状态已重置');
    },
    
    // 手动触发庆祝（用于测试）
    triggerNow: () => {
      const state = useAppStore.getState();
      state.setAutoTriggerHasTriggered(true);
      state.startManualCountdown();
      state.setIsPlaying(true);
      state.startCelebration();
      console.log('🎉 手动触发庆祝效果！');
    },
    
    // 模拟时间到达（用于测试）
    simulateTimeReached: () => {
      const state = useAppStore.getState();
      if (state.autoTriggerConfig.hasTriggered) {
        console.log('⚠️ 已经触发过了，请先调用 resetTrigger()');
        return;
      }
      state.setAutoTriggerHasTriggered(true);
      
      const { effects } = state.autoTriggerConfig;
      if (effects.countdownAnimation) {
        state.startManualCountdown();
      }
      if (effects.music) {
        state.setIsPlaying(true);
      }
      if (effects.fireworks) {
        state.startCelebration();
      }
      console.log('🎉 模拟时间到达，触发庆祝效果！');
    },
    
    // 获取目标时间信息
    getTargetTime: () => {
      const state = useAppStore.getState();
      const targetTime = calculateTargetTime(
        state.settings.targetYear,
        state.autoTriggerConfig.timezone
      );
      const now = new Date();
      const secondsToTarget = getSecondsToTarget(targetTime, now);
      const display = getTimezoneDisplay(state.autoTriggerConfig.timezone);
      
      console.log('🎯 目标时间信息:');
      console.log(`  目标年份: ${state.settings.targetYear}`);
      console.log(`  时区: ${display.name} (${display.offset})`);
      console.log(`  目标时间: ${targetTime.toLocaleString()}`);
      console.log(`  当前时间: ${now.toLocaleString()}`);
      console.log(`  距离目标: ${secondsToTarget} 秒`);
      console.log(`  已过目标: ${secondsToTarget < 0 ? '是' : '否'}`);
      
      return { targetTime, now, secondsToTarget };
    },
    
    // 列出所有可用时区
    listTimezones: () => {
      const { COMMON_TIMEZONES } = require('@/types');
      console.log('🌍 可用时区列表:');
      COMMON_TIMEZONES.forEach((tz: any) => {
        console.log(`  ${tz.value}: ${tz.label} (${tz.offset})`);
      });
      return COMMON_TIMEZONES;
    },
    
    // 帮助信息
    help: () => {
      console.log(`
🎄 自动倒计时触发调试命令 🎄
================================
window.autoTrigger.getConfig()        - 获取当前配置
window.autoTrigger.setEnabled(true)   - 启用/禁用自动触发
window.autoTrigger.setTimezone('Asia/Shanghai') - 设置时区
window.autoTrigger.setEffects({ music: true })  - 设置效果
window.autoTrigger.resetTrigger()     - 重置触发状态
window.autoTrigger.triggerNow()       - 立即触发庆祝
window.autoTrigger.simulateTimeReached() - 模拟时间到达
window.autoTrigger.getTargetTime()    - 获取目标时间信息
window.autoTrigger.listTimezones()    - 列出所有时区
window.autoTrigger.help()             - 显示帮助
================================
      `);
    },
  };
  
  (window as any).autoTrigger = debug;
  
  console.log('🎄 自动触发调试命令已加载！输入 window.autoTrigger.help() 查看帮助');
}

export default useAutoCountdownTrigger;
