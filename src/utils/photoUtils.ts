import type { PhotoData, PhotoValidationResult, ParticleShape } from '@/types';
import { SUPPORTED_PHOTO_FORMATS, MAX_PHOTO_SIZE, MAX_PHOTO_COUNT } from '@/types';

/**
 * 验证照片文件
 * @param file 文件对象
 * @returns 验证结果
 */
export function validatePhoto(file: File): PhotoValidationResult {
  // 检查文件格式
  if (!SUPPORTED_PHOTO_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'invalid_format',
      message: `不支持的文件格式。支持的格式：JPG, PNG, WebP`,
    };
  }
  
  // 检查文件大小
  if (file.size > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: 'file_too_large',
      message: `文件大小超过限制。最大允许 ${MAX_PHOTO_SIZE / 1024 / 1024}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * 检查是否可以添加更多照片
 * @param currentCount 当前照片数量
 * @returns 是否可以添加
 */
export function canAddMorePhotos(currentCount: number): boolean {
  return currentCount < MAX_PHOTO_COUNT;
}

/**
 * 生成唯一的照片 ID
 * @returns 唯一 ID
 */
export function generatePhotoId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 根据粒子形状生成照片的随机位置
 * @param shape 粒子形状
 * @returns 3D 位置坐标
 */
export function generateRandomPhotoPosition(
  shape: ParticleShape
): [number, number, number] {
  switch (shape) {
    case 'tree':
      return generateTreePosition();
    case 'cake':
      return generateCakePosition();
    case 'firework':
      return generateFireworkPosition();
    case 'heart':
      return generateHeartPosition();
    default:
      return generateFireworkPosition();
  }
}

/**
 * 圣诞树形状的随机位置 - 贴合粒子形状
 */
function generateTreePosition(): [number, number, number] {
  // 树的高度范围：-2 到 2（与 particleUtils 一致）
  const y = (Math.random() - 0.5) * 4;
  
  // 半径：随高度递减形成圆锥形（顶部尖，底部宽）
  const normalizedY = (y + 2) / 4; // 0 到 1
  const maxRadius = Math.max(0.2, (1 - normalizedY) * 1.5);
  const radius = maxRadius * (0.3 + Math.random() * 0.7);
  
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  return [x, y, z];
}

/**
 * 蛋糕形状的随机位置 - 贴合粒子形状
 */
function generateCakePosition(): [number, number, number] {
  // 蛋糕三层 + 蜡烛，y 范围约 -1 到 2
  const layer = Math.random();
  let y: number;
  let radius: number;
  
  if (layer < 0.4) {
    // 底层
    y = -1 + Math.random() * 0.8;
    radius = 0.5 + Math.random() * 1.0;
  } else if (layer < 0.7) {
    // 中层
    y = -0.2 + Math.random() * 0.7;
    radius = 0.4 + Math.random() * 0.7;
  } else if (layer < 0.9) {
    // 顶层
    y = 0.5 + Math.random() * 0.5;
    radius = 0.3 + Math.random() * 0.4;
  } else {
    // 蜡烛区域
    y = 1.0 + Math.random() * 1.0;
    radius = Math.random() * 0.3;
  }
  
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  return [x, y, z];
}

/**
 * 烟花形状的随机位置 - 贴合粒子形状
 */
function generateFireworkPosition(): [number, number, number] {
  // 烟花：中心椭圆 + 外围圆环，以 y=0 为中心
  // 与 particleUtils.ts 中的 generateFireworkParticles 保持一致
  const isCenter = Math.random() < 0.3;
  
  if (isCenter) {
    // 中心椭圆（与粒子一致）
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * 1.0;
    
    const x = r * Math.sin(phi) * Math.cos(theta) * 0.6;
    const y = r * Math.cos(phi) * 1.8; // 垂直拉伸
    const z = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    
    return [x, y, z];
  } else {
    // 外围圆环（与粒子一致）
    const layer = Math.floor(Math.random() * 5);
    const layerRadius = 1.2 + layer * 0.4; // 1.2 到 2.8
    const angle = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 0.3; // 中心在 y=0
    
    const x = Math.cos(angle) * layerRadius;
    const z = Math.sin(angle) * layerRadius;
    
    return [x, y, z];
  }
}

/**
 * 爱心形状的随机位置 - 贴合粒子形状
 */
function generateHeartPosition(): [number, number, number] {
  // 心形参数方程
  const t = Math.random() * Math.PI * 2;
  const r = 0.3 + Math.random() * 0.7;
  
  const x2d = 16 * Math.pow(Math.sin(t), 3);
  const y2d = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  
  const scale = 0.08 * r;
  const depth = (Math.random() - 0.5) * 0.5;
  
  return [x2d * scale, y2d * scale, depth];
}

/**
 * 生成照片在圣诞树上的随机位置（旧版本，保留兼容）
 * @param index 照片索引（用于分布）
 * @param total 总照片数量
 * @returns 3D 位置坐标
 */
export function generatePhotoPosition(
  index: number,
  total: number
): [number, number, number] {
  // 在树的不同高度层分布照片
  const layerCount = Math.ceil(total / 4); // 每层最多 4 张
  const layer = Math.floor(index / 4);
  const indexInLayer = index % 4;
  
  // 高度：从底部到顶部分布
  const y = 0.5 + (layer / layerCount) * 2.5;
  
  // 半径：随高度递减（圣诞树形状）
  const maxRadius = 1.2 * (1 - y / 4);
  const radius = maxRadius * 0.8;
  
  // 角度：在当前层均匀分布
  const angleOffset = (layer % 2) * (Math.PI / 4); // 交错层
  const angle = angleOffset + (indexInLayer / 4) * Math.PI * 2;
  
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  return [x, y, z];
}

/**
 * 将文件转换为 Data URL
 * @param file 文件对象
 * @returns Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 创建照片数据对象
 * @param file 文件对象
 * @param shape 粒子形状（用于确定位置）
 * @returns 照片数据
 */
export async function createPhotoData(
  file: File,
  shape: ParticleShape = 'firework'
): Promise<PhotoData> {
  const url = await fileToDataUrl(file);
  const position = generateRandomPhotoPosition(shape);
  
  return {
    id: generatePhotoId(),
    url,
    position,
    rotation: Math.random() * Math.PI * 2,
  };
}

/**
 * 压缩图片（如果需要）
 * @param file 原始文件
 * @param maxWidth 最大宽度
 * @param quality 质量 0-1
 * @returns 压缩后的 Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
