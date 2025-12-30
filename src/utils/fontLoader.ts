/**
 * 共享字体加载工具
 * 避免多个组件重复加载字体
 */

// 字体加载状态
let fontLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

/**
 * 确保字体已加载
 * 使用单例模式，只加载一次
 */
export async function ensureFontLoaded(): Promise<void> {
  if (fontLoaded) return;
  
  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      try {
        if ('fonts' in document) {
          // 等待 CSS 中通过 CDN 加载的字体就绪
          await document.fonts.ready;
          
          // 检查字体是否已通过 CSS @import 加载
          const hasFont = document.fonts.check('700 16px "Noto Sans SC"');
          if (hasFont) {
            console.log('[FontLoader] Noto Sans SC CDN 字体加载成功');
          } else {
            console.log('[FontLoader] 使用系统中文字体');
          }
        }
        fontLoaded = true;
      } catch (error) {
        console.warn('[FontLoader] 字体加载检查失败，使用系统字体:', error);
        fontLoaded = true;
      }
    })();
  }
  
  await fontLoadPromise;
}

/**
 * 检查字体是否已加载
 */
export function isFontLoaded(): boolean {
  return fontLoaded;
}

/**
 * 获取中文字体族字符串
 */
export const CHINESE_FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei", "Heiti SC", "WenQuanYi Micro Hei", Arial, sans-serif';
