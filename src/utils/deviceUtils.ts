import type { DeviceInfo, PerformanceLevel } from '@/types';

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 检测是否为平板设备
 */
export function isTabletDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
      userAgent
    )
  );
}

/**
 * 检测 WebGL 2.0 支持
 */
export function hasWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * 检测 WebGL 支持（包括 1.0）
 */
export function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * 估算设备性能级别
 */
export function detectPerformanceLevel(): PerformanceLevel {
  // 检查硬件并发数
  const cores = navigator.hardwareConcurrency || 2;
  
  // 检查设备内存（如果可用）
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  
  // 检查是否为移动设备
  const mobile = isMobileDevice();
  
  // 简单的性能评估
  if (mobile) {
    if (cores >= 8 && memory >= 6) {
      return 'medium';
    }
    return 'low';
  }
  
  if (cores >= 8 && memory >= 8) {
    return 'high';
  }
  
  if (cores >= 4 && memory >= 4) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * 获取屏幕方向
 */
export function getScreenOrientation(): 'portrait' | 'landscape' {
  if (window.screen.orientation) {
    return window.screen.orientation.type.includes('portrait')
      ? 'portrait'
      : 'landscape';
  }
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * 检测完整的设备信息
 */
export function detectDevice(): DeviceInfo {
  return {
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    hasWebGL2: hasWebGL2Support(),
    performanceLevel: detectPerformanceLevel(),
    screenOrientation: getScreenOrientation(),
  };
}

/**
 * 根据设备信息获取推荐的粒子数量
 * @param deviceInfo 设备信息
 * @param requestedCount 请求的粒子数量
 * @returns 调整后的粒子数量
 */
export function getAdjustedParticleCount(
  deviceInfo: DeviceInfo,
  requestedCount: number
): number {
  // 移动设备限制
  if (deviceInfo.isMobile) {
    return Math.min(requestedCount, 2000);
  }
  
  // 根据性能级别调整
  switch (deviceInfo.performanceLevel) {
    case 'low':
      return Math.min(requestedCount, 3000);
    case 'medium':
      return Math.min(requestedCount, 6000);
    case 'high':
    default:
      return requestedCount;
  }
}

/**
 * 根据设备信息获取推荐的渲染设置
 * @param deviceInfo 设备信息
 */
export function getRecommendedRenderSettings(deviceInfo: DeviceInfo): {
  antialias: boolean;
  pixelRatio: number;
  shadowMapEnabled: boolean;
} {
  if (deviceInfo.performanceLevel === 'low' || deviceInfo.isMobile) {
    return {
      antialias: false,
      pixelRatio: Math.min(window.devicePixelRatio, 1.5),
      shadowMapEnabled: false,
    };
  }
  
  if (deviceInfo.performanceLevel === 'medium') {
    return {
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      shadowMapEnabled: false,
    };
  }
  
  return {
    antialias: true,
    pixelRatio: window.devicePixelRatio,
    shadowMapEnabled: true,
  };
}

/**
 * 监听屏幕方向变化
 * @param callback 回调函数
 * @returns 清理函数
 */
export function onOrientationChange(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  const handler = () => {
    callback(getScreenOrientation());
  };
  
  if (window.screen.orientation) {
    window.screen.orientation.addEventListener('change', handler);
    return () => window.screen.orientation.removeEventListener('change', handler);
  }
  
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}
