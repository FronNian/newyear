/**
 * 共享字体加载工具
 * 多 CDN 备用，自动故障转移
 */

// 字体 CDN 源列表（按优先级排序）- 使用完整字体文件
const FONT_SOURCES = [
  {
    name: 'npmmirror',
    // npmmirror 国内镜像，完整字体
    url: 'https://registry.npmmirror.com/@aspect-build/aspect-fonts/0.0.1/files/fonts/noto-sans-sc/NotoSansSC-Bold.woff2',
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
let loadedFontName: string | null = null;

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
    
    // 设置超时 8 秒
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 8000);
    });
    
    await Promise.race([fontFace.load(), timeoutPromise]);
    document.fonts.add(fontFace);
    
    // 验证字体是否真正可用（测试渲染数字和中文）
    await document.fonts.ready;
    const testChars = '0123456789新年快乐';
    const isValid = document.fonts.check(`700 16px "Noto Sans SC"`, testChars);
    
    if (!isValid) {
      console.warn(`[FontLoader] ${source.name} 字体加载但验证失败`);
      return false;
    }
    
    console.log(`[FontLoader] 字体加载成功: ${source.name}`);
    loadedFontName = source.name;
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
 * 获取已加载的字体源名称
 */
export function getLoadedFontSource(): string | null {
  return loadedFontName;
}

/**
 * 获取中文字体族字符串
 */
export const CHINESE_FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei", "Heiti SC", "WenQuanYi Micro Hei", Arial, sans-serif';
