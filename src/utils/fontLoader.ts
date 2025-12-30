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
          await document.fonts.ready;
          // 使用本地字体文件
          const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
          const fontFace = new FontFace(
            'Noto Sans SC',
            `url(${baseUrl}/fonts/NotoSansSC-Bold.ttf)`,
            { weight: '700' }
          );
          await fontFace.load();
          document.fonts.add(fontFace);
          console.log('[FontLoader] Noto Sans SC 本地字体加载成功');
        }
        fontLoaded = true;
      } catch (error) {
        console.warn('[FontLoader] 字体加载失败，使用系统字体:', error);
        fontLoaded = true; // 即使失败也标记为完成，使用系统字体
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
