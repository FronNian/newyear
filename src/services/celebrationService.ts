import type { CelebrationPhase } from '@/types';
import { useAppStore } from '@/stores/appStore';

/**
 * 获取庆祝序列阶段时间配置（毫秒）
 * 根据烟花配置的 celebrationDuration 动态计算
 */
export function getCelebrationPhaseDurations(celebrationDuration: number): Record<CelebrationPhase, number> {
  // celebrationDuration 是总的庆祝时间（秒）
  // 按比例分配给各个阶段
  const totalMs = celebrationDuration * 1000;
  
  return {
    idle: 0,
    firework_burst: Math.floor(totalMs * 0.1),    // 10% 烟花爆发
    year_display: Math.floor(totalMs * 0.15),     // 15% 年份显示
    blessing: Math.floor(totalMs * 0.2),          // 20% 祝福语
    confetti: Math.floor(totalMs * 0.45),         // 45% 彩纸效果（主要烟花时间）
    fadeout: Math.floor(totalMs * 0.1),           // 10% 淡出
  };
}

/**
 * 默认庆祝序列阶段时间配置（毫秒）- 30秒
 */
export const CELEBRATION_PHASE_DURATIONS: Record<CelebrationPhase, number> = getCelebrationPhaseDurations(30);

/**
 * 庆祝序列阶段顺序
 */
export const CELEBRATION_PHASE_ORDER: CelebrationPhase[] = [
  'firework_burst',
  'year_display',
  'blessing',
  'confetti',
  'fadeout',
];

/**
 * 获取下一个阶段
 */
export function getNextPhase(currentPhase: CelebrationPhase): CelebrationPhase | null {
  const currentIndex = CELEBRATION_PHASE_ORDER.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex >= CELEBRATION_PHASE_ORDER.length - 1) {
    return null;
  }
  return CELEBRATION_PHASE_ORDER[currentIndex + 1];
}

/**
 * 计算当前应该处于的阶段
 */
export function calculateCurrentPhase(
  startTime: number,
  currentTime: number,
  phaseDurations: Record<CelebrationPhase, number> = CELEBRATION_PHASE_DURATIONS
): { phase: CelebrationPhase; phaseProgress: number } {
  const elapsed = currentTime - startTime;
  let accumulatedTime = 0;
  
  for (const phase of CELEBRATION_PHASE_ORDER) {
    const phaseDuration = phaseDurations[phase];
    if (elapsed < accumulatedTime + phaseDuration) {
      const phaseElapsed = elapsed - accumulatedTime;
      return {
        phase,
        phaseProgress: phaseElapsed / phaseDuration,
      };
    }
    accumulatedTime += phaseDuration;
  }
  
  // 所有阶段完成
  return { phase: 'idle', phaseProgress: 1 };
}

/**
 * 获取庆祝序列总时长
 */
export function getTotalCelebrationDuration(phaseDurations: Record<CelebrationPhase, number> = CELEBRATION_PHASE_DURATIONS): number {
  return CELEBRATION_PHASE_ORDER.reduce(
    (total, phase) => total + phaseDurations[phase],
    0
  );
}

/**
 * 庆祝序列控制器类
 */
export class CelebrationController {
  private intervalId: number | null = null;
  private startTime: number | null = null;
  private phaseDurations: Record<CelebrationPhase, number> = CELEBRATION_PHASE_DURATIONS;
  
  /**
   * 开始庆祝序列
   */
  start(): void {
    const store = useAppStore.getState();
    
    // 如果已经在进行中，先停止
    if (this.intervalId) {
      this.stop();
    }
    
    // 获取配置的庆祝持续时间
    const celebrationDuration = store.fireworkConfig.celebrationDuration || 30;
    this.phaseDurations = getCelebrationPhaseDurations(celebrationDuration);
    
    this.startTime = Date.now();
    console.log('[CelebrationController] Starting celebration at', this.startTime, 'duration:', celebrationDuration, 's');
    store.startCelebration();
    
    // 立即执行一次更新
    this.update();
    
    // 启动更新循环 - 每 50ms 更新一次以确保流畅
    this.intervalId = window.setInterval(() => {
      this.update();
    }, 50);
  }
  
  /**
   * 更新庆祝状态
   */
  private update(): void {
    if (!this.startTime) return;
    
    const store = useAppStore.getState();
    const currentTime = Date.now();
    const { phase, phaseProgress } = calculateCurrentPhase(this.startTime, currentTime, this.phaseDurations);
    
    // 更新阶段
    if (phase !== store.celebrationState.phase) {
      console.log('[CelebrationController] Phase change:', store.celebrationState.phase, '->', phase, 'progress:', phaseProgress.toFixed(2));
      store.setCelebrationPhase(phase);
    }
    
    // 检查是否完成
    if (phase === 'idle' && phaseProgress >= 1) {
      console.log('[CelebrationController] Celebration complete');
      this.stop();
    }
  }
  
  /**
   * 停止庆祝序列
   */
  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.startTime = null;
    
    const store = useAppStore.getState();
    store.endCelebration();
  }
  
  /**
   * 检查是否正在进行
   */
  isActive(): boolean {
    return this.intervalId !== null;
  }
}

// 单例实例
export const celebrationController = new CelebrationController();

/**
 * 触发庆祝序列（便捷函数）
 */
export function triggerCelebration(): void {
  celebrationController.start();
}

/**
 * 停止庆祝序列（便捷函数）
 */
export function stopCelebration(): void {
  celebrationController.stop();
}
