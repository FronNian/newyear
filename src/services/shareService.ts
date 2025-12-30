import type { ShareData, ShareParams, ColorTheme } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

/**
 * 生成分享链接
 * @param data 分享数据
 * @returns 分享链接
 */
export function generateShareUrl(data: ShareData): string {
  const params: ShareParams = {
    v: 1,
    t: data.settings.colorTheme || DEFAULT_SETTINGS.colorTheme,
    p: data.settings.particleCount || DEFAULT_SETTINGS.particleCount,
    b: data.settings.bloomIntensity || DEFAULT_SETTINGS.bloomIntensity,
    m: btoa(encodeURIComponent(data.message || '')),
  };
  
  const searchParams = new URLSearchParams();
  searchParams.set('v', params.v.toString());
  searchParams.set('t', params.t);
  searchParams.set('p', params.p.toString());
  searchParams.set('b', params.b.toString());
  searchParams.set('m', params.m);
  
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?share=${searchParams.toString()}`;
}

/**
 * 解析分享链接
 * @param url 分享链接
 * @returns 分享数据，如果解析失败返回 null
 */
export function parseShareUrl(url: string): ShareData | null {
  try {
    const urlObj = new URL(url);
    const shareParam = urlObj.searchParams.get('share');
    
    if (!shareParam) {
      return null;
    }
    
    const params = new URLSearchParams(shareParam);
    
    const version = parseInt(params.get('v') || '0', 10);
    if (version !== 1) {
      return null;
    }
    
    const theme = params.get('t') as ColorTheme;
    const particleCount = parseInt(params.get('p') || '5000', 10);
    const bloomIntensity = parseFloat(params.get('b') || '0.8');
    const messageEncoded = params.get('m') || '';
    
    let message = '';
    try {
      message = decodeURIComponent(atob(messageEncoded));
    } catch {
      message = '';
    }
    
    return {
      settings: {
        colorTheme: theme,
        particleCount,
        bloomIntensity,
      },
      message,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * 检查当前 URL 是否包含分享参数
 * @returns 是否是分享链接
 */
export function isShareLink(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('share');
}

/**
 * 从当前 URL 加载分享数据
 * @returns 分享数据，如果不是分享链接返回 null
 */
export function loadShareDataFromUrl(): ShareData | null {
  return parseShareUrl(window.location.href);
}

/**
 * 生成场景截图
 * @param canvas WebGL Canvas 元素
 * @param watermark 水印文字（可选）
 * @param highResolution 是否高分辨率（2x）
 * @returns 截图的 Data URL
 */
export async function captureScreenshot(
  canvas: HTMLCanvasElement,
  watermark?: string,
  highResolution: boolean = true
): Promise<string> {
  // 计算目标尺寸
  const scale = highResolution ? 2 : 1;
  const targetWidth = canvas.width * scale;
  const targetHeight = canvas.height * scale;
  
  // 创建临时 canvas 用于添加水印
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;
  
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // 启用图像平滑
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // 绘制原始画面（缩放）
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  
  // 添加水印
  if (watermark) {
    const fontSize = Math.max(24, targetHeight * 0.03);
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // 水印阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 水印文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(watermark, targetWidth / 2, targetHeight - fontSize);
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  
  return tempCanvas.toDataURL('image/png', 1.0);
}

/**
 * 高分辨率截图配置
 */
export interface ScreenshotOptions {
  watermark?: string;
  watermarkEnabled?: boolean;
  highResolution?: boolean;
  filename?: string;
}

/**
 * 增强版截图函数
 */
export async function captureAndProcessScreenshot(
  canvas: HTMLCanvasElement,
  options: ScreenshotOptions = {}
): Promise<string> {
  const {
    watermark,
    watermarkEnabled = true,
    highResolution = true,
  } = options;
  
  const finalWatermark = watermarkEnabled ? watermark : undefined;
  return captureScreenshot(canvas, finalWatermark, highResolution);
}

/**
 * 分享截图（使用 Web Share API）
 */
export async function shareScreenshot(
  dataUrl: string,
  title: string = '2026 新年快乐'
): Promise<boolean> {
  // 将 data URL 转换为 Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], '2026-countdown.png', { type: 'image/png' });
  
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title,
        files: [file],
      });
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * 下载截图
 * @param dataUrl 图片 Data URL
 * @param filename 文件名
 */
export function downloadScreenshot(dataUrl: string, filename: string = '2026-countdown.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 使用系统分享 API 分享
 * @param data 分享数据
 * @returns 是否分享成功
 */
export async function shareViaWebAPI(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // 用户取消分享不算错误
    if ((error as Error).name === 'AbortError') {
      return false;
    }
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * 复制链接到剪贴板
 * @param url 链接
 * @returns 是否复制成功
 */
export async function copyToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // 降级方案
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}
