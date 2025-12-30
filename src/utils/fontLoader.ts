/**
 * 共享字体加载工具
 * 使用 fontsource CDN，支持可变字体
 */

// 字体 CDN 源列表（fontsource 官方 CDN）
const FONT_SOURCES = [
  {
    name: 'fontsource-chinese',
    // 中文字符集
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc:vf@latest/chinese-simplified-wght-normal.woff2',
  },
  {
    name: 'fontsource-latin',
    // 拉丁字符（数字、英文）
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc:vf@latest/latin-wght-normal.woff2',
  },
];

// 字体加载状态
let fontLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

/**
 * 加载字体
 */
async function loadFontFromSource(url: string, name: string): Promise<boolean> {
  try {
    const fontFace = new FontFace(
      'Noto Sans SC',
      `url(${url})`,
      { 
        weight: '100 900',  // 可变字体
        style: 'normal',
        display: 'swap' 
      }
    );
    
    // 设置超时 10 秒
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 10000);
    });
    
    await Promise.race([fontFace.load(), timeoutPromise]);
    document.fonts.add(fontFace);
    console.log(`[FontLoader] 字体加载成功: ${name}`);
    return true;
  } catch (error) {
    console.warn(`[FontLoader] ${name} 加载失败:`, error);
    return false;
  }
}

/**
 * 确保字体已加载
 */
export async function ensureFontLoaded(): Promise<void> {
  if (fontLoaded) return;
  
  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      // 并行加载中文和拉丁字符集
      const results = await Promise.allSettled(
        FONT_SOURCES.map(source => loadFontFromSource(source.url, source.name))
      );
      
      const anySuccess = results.some(r => r.status === 'fulfilled' && r.value);
      
      if (anySuccess) {
        console.log('[FontLoader] Noto Sans SC 字体加载完成');
      } else {
        console.warn('[FontLoader] 字体加载失败，使用系统字体');
      }
      
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
