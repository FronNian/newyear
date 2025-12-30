import { useAppStore } from '@/stores/appStore';
import type { ParticleShape } from '@/types';

/**
 * 触摸手势配置
 */
export const TOUCH_GESTURE_CONFIG = {
  doubleTapDelay: 300,        // 双击间隔（毫秒）
  pinchThreshold: 0.1,        // 缩放阈值
  rotationThreshold: 0.1,     // 旋转阈值（弧度）
  swipeThreshold: 50,         // 滑动阈值（像素）
  swipeVelocityThreshold: 0.3, // 滑动速度阈值
};

/**
 * 粒子形状顺序（用于滑动切换）
 */
const SHAPE_ORDER: ParticleShape[] = ['tree', 'cake', 'firework', 'heart'];

/**
 * 获取下一个形状
 */
export function getNextShape(current: ParticleShape, direction: 'left' | 'right'): ParticleShape {
  const currentIndex = SHAPE_ORDER.indexOf(current);
  if (direction === 'right') {
    return SHAPE_ORDER[(currentIndex + 1) % SHAPE_ORDER.length];
  } else {
    return SHAPE_ORDER[(currentIndex - 1 + SHAPE_ORDER.length) % SHAPE_ORDER.length];
  }
}

/**
 * 触发触觉反馈
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!('vibrate' in navigator)) return;
  
  const durations: Record<string, number> = {
    light: 10,
    medium: 20,
    heavy: 30,
  };
  
  try {
    navigator.vibrate(durations[type]);
  } catch {
    // 静默失败
  }
}

/**
 * 计算两点之间的距离
 */
export function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点之间的角度
 */
export function getAngle(touch1: Touch, touch2: Touch): number {
  return Math.atan2(
    touch2.clientY - touch1.clientY,
    touch2.clientX - touch1.clientX
  );
}

/**
 * 触摸手势控制器类
 */
export class TouchGestureController {
  private element: HTMLElement | null = null;
  private initialDistance: number = 0;
  private initialAngle: number = 0;
  private lastTapTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  
  /**
   * 绑定到元素
   */
  bind(element: HTMLElement): void {
    this.element = element;
    
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }
  
  /**
   * 解绑
   */
  unbind(): void {
    if (!this.element) return;
    
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element = null;
  }
  
  private handleTouchStart = (e: TouchEvent): void => {
    const store = useAppStore.getState();
    
    if (e.touches.length === 1) {
      // 单指触摸 - 记录起始位置（用于滑动检测）
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    } else if (e.touches.length === 2) {
      // 双指触摸 - 初始化缩放和旋转
      this.initialDistance = getDistance(e.touches[0], e.touches[1]);
      this.initialAngle = getAngle(e.touches[0], e.touches[1]);
      
      store.setTouchGestureState({
        isPinching: true,
        isRotating: true,
      });
    }
  };
  
  private handleTouchMove = (e: TouchEvent): void => {
    const store = useAppStore.getState();
    
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);
      
      // 计算缩放比例
      const scale = currentDistance / this.initialDistance;
      if (Math.abs(scale - 1) > TOUCH_GESTURE_CONFIG.pinchThreshold) {
        const zoomDelta = (scale - 1) * 5;
        store.setZoomDelta(zoomDelta);
        this.initialDistance = currentDistance;
      }
      
      // 计算旋转角度
      const rotation = currentAngle - this.initialAngle;
      if (Math.abs(rotation) > TOUCH_GESTURE_CONFIG.rotationThreshold) {
        store.setPalmMove({
          x: rotation * 0.5,
          y: 0,
        });
        this.initialAngle = currentAngle;
      }
      
      store.setTouchGestureState({
        pinchScale: scale,
        rotationAngle: rotation,
      });
    }
  };
  
  private handleTouchEnd = (e: TouchEvent): void => {
    const store = useAppStore.getState();
    const now = Date.now();
    
    if (e.touches.length === 0) {
      // 所有手指离开
      
      // 检测双击
      if (now - this.lastTapTime < TOUCH_GESTURE_CONFIG.doubleTapDelay) {
        // 双击 - 重置相机
        this.handleDoubleTap();
        this.lastTapTime = 0;
      } else {
        // 检测滑动
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const deltaTime = now - this.touchStartTime;
        
        const velocity = Math.abs(deltaX) / deltaTime;
        
        if (
          Math.abs(deltaX) > TOUCH_GESTURE_CONFIG.swipeThreshold &&
          Math.abs(deltaX) > Math.abs(deltaY) * 2 &&
          velocity > TOUCH_GESTURE_CONFIG.swipeVelocityThreshold
        ) {
          // 水平滑动
          const direction = deltaX > 0 ? 'right' : 'left';
          this.handleSwipe(direction);
        }
        
        this.lastTapTime = now;
      }
      
      // 重置状态
      store.setTouchGestureState({
        isPinching: false,
        isRotating: false,
        swipeDirection: null,
      });
    }
  };
  
  private handleDoubleTap(): void {
    // 重置相机位置
    triggerHapticFeedback('medium');
    
    // 通过设置 zoomDelta 来触发相机重置
    // 实际的重置逻辑在 Scene.tsx 的 GestureOrbitControls 中处理
    const store = useAppStore.getState();
    store.setZoomDelta(0);
    store.setPalmMove(null);
    
    // 这里可以添加一个专门的重置相机方法
    console.log('Double tap: Reset camera');
  }
  
  private handleSwipe(direction: 'left' | 'right'): void {
    const store = useAppStore.getState();
    const currentShape = store.settings.particleShape;
    const nextShape = getNextShape(currentShape, direction);
    
    triggerHapticFeedback('light');
    
    store.updateSettings({ particleShape: nextShape });
    store.setTouchGestureState({ swipeDirection: direction });
    
    console.log(`Swipe ${direction}: Changed shape to ${nextShape}`);
  }
}

// 单例实例
export const touchGestureController = new TouchGestureController();

/**
 * 初始化触摸手势（便捷函数）
 */
export function initTouchGestures(element: HTMLElement): void {
  touchGestureController.bind(element);
}

/**
 * 清理触摸手势（便捷函数）
 */
export function cleanupTouchGestures(): void {
  touchGestureController.unbind();
}
