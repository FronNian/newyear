/**
 * 字体路径解析工具
 * 使用 opentype.js 解析字体文件，提取文字的矢量路径
 */
import opentype from 'opentype.js';

/** 2D 点 */
interface Point2D {
  x: number;
  y: number;
}

/** 字体缓存 */
const fontCache = new Map<string, opentype.Font>();

/** 默认字体 URL - 尝试多个路径 */
const FONT_URLS = [
  '/fonts/NotoSansSC-Bold.ttf',
  '/fonts/NotoSansSC-Bold.otf',
  '/fonts/SourceHanSansSC-Bold.otf',
];

/**
 * 加载字体文件 - 尝试多个路径
 */
export async function loadFont(fontUrl?: string): Promise<opentype.Font | null> {
  const urlsToTry = fontUrl ? [fontUrl] : FONT_URLS;
  
  for (const url of urlsToTry) {
    // 检查缓存
    if (fontCache.has(url)) {
      return fontCache.get(url)!;
    }
    
    try {
      const font = await opentype.load(url);
      fontCache.set(url, font);
      console.log(`[fontPathUtils] 字体加载成功: ${url}`);
      return font;
    } catch (error) {
      // 静默失败，尝试下一个
      console.log(`[fontPathUtils] 字体 ${url} 不可用，尝试下一个...`);
    }
  }
  
  console.warn('[fontPathUtils] 所有字体路径都不可用');
  return null;
}

/**
 * 二次贝塞尔曲线采样
 */
function sampleQuadraticBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  samples: number
): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    points.push({
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    });
  }
  return points;
}

/**
 * 三次贝塞尔曲线采样
 */
function sampleCubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  samples: number
): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    points.push({
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    });
  }
  return points;
}

/**
 * 从字体路径提取采样点
 */
function samplePathCommands(
  commands: opentype.PathCommand[],
  samplesPerCurve: number = 10
): Point2D[] {
  const points: Point2D[] = [];
  let currentX = 0;
  let currentY = 0;
  
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M': // moveTo
        currentX = cmd.x;
        currentY = cmd.y;
        points.push({ x: currentX, y: currentY });
        break;
        
      case 'L': // lineTo
        // 线段采样
        const linePoints = Math.max(2, Math.ceil(
          Math.sqrt(Math.pow(cmd.x - currentX, 2) + Math.pow(cmd.y - currentY, 2)) / 10
        ));
        for (let i = 1; i <= linePoints; i++) {
          const t = i / linePoints;
          points.push({
            x: currentX + (cmd.x - currentX) * t,
            y: currentY + (cmd.y - currentY) * t,
          });
        }
        currentX = cmd.x;
        currentY = cmd.y;
        break;
        
      case 'Q': // quadraticCurveTo
        const qPoints = sampleQuadraticBezier(
          { x: currentX, y: currentY },
          { x: cmd.x1, y: cmd.y1 },
          { x: cmd.x, y: cmd.y },
          samplesPerCurve
        );
        points.push(...qPoints.slice(1)); // 跳过起点
        currentX = cmd.x;
        currentY = cmd.y;
        break;
        
      case 'C': // bezierCurveTo
        const cPoints = sampleCubicBezier(
          { x: currentX, y: currentY },
          { x: cmd.x1, y: cmd.y1 },
          { x: cmd.x2, y: cmd.y2 },
          { x: cmd.x, y: cmd.y },
          samplesPerCurve
        );
        points.push(...cPoints.slice(1)); // 跳过起点
        currentX = cmd.x;
        currentY = cmd.y;
        break;
        
      case 'Z': // closePath
        // 闭合路径，不需要额外处理
        break;
    }
  }
  
  return points;
}

/**
 * 使用字体矢量路径生成粒子位置
 */
export async function getTextPathPoints(
  text: string,
  particleCount: number,
  fontSize: number = 200,
  fontUrl?: string
): Promise<Float32Array | null> {
  const font = await loadFont(fontUrl);
  
  if (!font) {
    console.log('[fontPathUtils] 无法加载字体，将使用 Canvas fallback');
    return null;
  }
  
  // 获取文字路径
  const path = font.getPath(text, 0, 0, fontSize);
  const commands = path.commands;
  
  if (commands.length === 0) {
    console.warn('[fontPathUtils] 字体路径为空');
    return null;
  }
  
  // 计算每条曲线的采样数
  const samplesPerCurve = Math.max(5, Math.ceil(particleCount / commands.length / 2));
  
  // 采样路径点
  const pathPoints = samplePathCommands(commands, samplesPerCurve);
  
  if (pathPoints.length === 0) {
    console.warn('[fontPathUtils] 采样点为空');
    return null;
  }
  
  // 计算边界框
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const p of pathPoints) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // 归一化缩放因子（将文字缩放到合适的 3D 空间大小）
  const targetSize = 4; // 目标宽度
  const scaleFactor = targetSize / Math.max(width, height);
  
  // 生成粒子位置
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // 从路径点中随机选择或插值
    const pathIndex = Math.floor(Math.random() * pathPoints.length);
    const point = pathPoints[pathIndex];
    
    // 添加微小随机偏移，使粒子分布更自然
    const jitterX = (Math.random() - 0.5) * 2;
    const jitterY = (Math.random() - 0.5) * 2;
    const jitterZ = (Math.random() - 0.5) * 0.3;
    
    // 转换到 3D 坐标（居中，Y 轴翻转）
    positions[i * 3] = ((point.x - centerX) * scaleFactor) + jitterX * scaleFactor * 0.02;
    positions[i * 3 + 1] = -((point.y - centerY) * scaleFactor) + jitterY * scaleFactor * 0.02;
    positions[i * 3 + 2] = jitterZ;
  }
  
  console.log(`[fontPathUtils] 生成 ${particleCount} 个粒子，路径点数: ${pathPoints.length}`);
  
  return positions;
}

/**
 * 检查字体是否可用
 */
export function isFontLoaded(): boolean {
  return fontCache.size > 0;
}

/**
 * 预加载字体
 */
export async function preloadFont(fontUrl?: string): Promise<boolean> {
  const font = await loadFont(fontUrl);
  return font !== null;
}
