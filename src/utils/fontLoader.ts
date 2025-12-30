/**
 * 共享字体加载工具
 * 多 CDN 备用，自动故障转移
 */

// 字体 CDN 源列表（按优先级排序）
const FONT_SOURCES = [
  {
    name: '字节跳动',
    url: 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/fontsource-noto-sans-sc/4.2.2/chinese-simplified-700-normal.woff2',
  },
  {
    name: 'jsDelivr',
    url: 'https://cdn.jsdelivr.net/npm/@aspect-build/aspect-fonts@0.0.1/fonts/noto-sans-sc/NotoSansSC-Bold.woff2',
  },
  {
    name: 'unpkg',
    url: 'https://unpkg.com/@aspect-build/aspect-fonts@0.0.1/fonts/noto-sans-sc/NotoSansSC-Bold.woff2',
  },
];

// 字体加载状态
let fontLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

/**
 * 尝试从单个源加载字体
 */
async function tryLoadFont(source: typeof FONT_SOURCES[0]): Promise<boolean> {
  try {
    const fontFace = new FontFace(
      'Noto Sans SC',
      `url(${source.url})`,
      { weight: '700', display: 'swap' }
    );
    
    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 5000);
    });
    
    await Promise.race([fontFace.load(), timeoutPromise]);
    document.fonts.add(fontFace);
    console.log(`[FontLoader] 字体加载成功: ${source.name}`);
    return true;
  } catch (error) {
    console.warn(`[FontLoader] ${source.name} 加载失败:`, error);
    return false;
  }
}

/**
 * 确保字体已加载
 * 使用单例模式，多 CDN 故障转移
 */
export async function ensureFontLoaded(): Promise<void> {
  if (fontLoaded) return;
  
  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      // 先检查字体是否已通过 CSS 加载
      if ('fonts' in document) {
        await document.fonts.ready;
        if (document.fonts.check('700 16px "Noto Sans SC"')) {
          console.log('[FontLoader] 字体已通过 CSS 加载');
          fontLoaded = true;
          return;
        }
      }
      
      // 依次尝试各个 CDN 源
      for (const source of FONT_SOURCES) {
        const success = await tryLoadFont(source);
        if (success) {
          fontLoaded = true;
          return;
        }
      }
      
      // 所有源都失败，使用系统字体
      console.warn('[FontLoader] 所有 CDN 源加载失败，使用系统字体');
      fontLoaded = true;
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
