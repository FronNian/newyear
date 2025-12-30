import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SlideImageElement as ImageElementType, ImageFrameStyle } from '@/types';

interface SlideImageElementProps {
  config: ImageElementType;
  opacity: number;
}

type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/** 获取边框样式的几何参数 */
function getBorderStyle(style: ImageFrameStyle) {
  switch (style) {
    case 'polaroid':
      return { padding: 0.15, bottomPadding: 0.4, borderRadius: 0 };
    case 'rounded':
      return { padding: 0.05, bottomPadding: 0.05, borderRadius: 0.1 };
    case 'shadow':
      return { padding: 0.02, bottomPadding: 0.02, borderRadius: 0 };
    default:
      return { padding: 0, bottomPadding: 0, borderRadius: 0 };
  }
}

export default function SlideImageElement({ config, opacity }: SlideImageElementProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [animProgress, setAnimProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  
  // 加载图片纹理
  useEffect(() => {
    // 验证 imageUrl
    if (!config.imageUrl || config.imageUrl.trim() === '') {
      console.warn(`[SlideImageElement] 元素 ${config.id} 没有有效的 imageUrl`);
      setLoadingState('error');
      return;
    }
    
    setLoadingState('loading');
    console.log(`[SlideImageElement] 开始加载图片: ${config.imageUrl}${retryCount > 0 ? ` (重试 ${retryCount})` : ''}`);
    
    let disposed = false;
    const loader = new THREE.TextureLoader();
    
    loader.load(
      config.imageUrl,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
        setLoadingState('loaded');
        console.log(`[SlideImageElement] 图片加载成功: ${config.imageUrl}`);
      },
      (progress) => {
        // 加载进度
        if (progress.lengthComputable) {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`[SlideImageElement] 加载进度: ${percent}%`);
        }
      },
      (err) => {
        if (disposed) return;
        console.error(`[SlideImageElement] 图片加载失败: ${config.imageUrl}`, err);
        // 自动重试
        if (retryCount < maxRetries) {
          console.log(`[SlideImageElement] 将在 1 秒后重试...`);
          setTimeout(() => setRetryCount(prev => prev + 1), 1000);
        } else {
          setLoadingState('error');
        }
      }
    );
    
    return () => {
      disposed = true;
    };
  }, [config.imageUrl, config.id, retryCount]);
  
  // 单独的清理 effect
  useEffect(() => {
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [texture]);
  
  // 入场动画
  useEffect(() => {
    setAnimProgress(0);
  }, [config.id]);
  
  useFrame((_, delta) => {
    if (animProgress < 1) {
      setAnimProgress(prev => Math.min(1, prev + delta * 2));
    }
  });
  
  // 计算动画变换
  const transform = useMemo(() => {
    const eased = 1 - Math.pow(1 - animProgress, 3);
    const anim = config.entranceAnimation || 'fade';
    
    switch (anim) {
      case 'slide_up':
        return { y: (1 - eased) * -1, scale: 1, opacity: eased };
      case 'slide_down':
        return { y: (1 - eased) * 1, scale: 1, opacity: eased };
      case 'zoom_in':
        return { y: 0, scale: 0.3 + eased * 0.7, opacity: eased };
      case 'bounce':
        const bounce = Math.sin(animProgress * Math.PI * 2) * (1 - animProgress) * 0.2;
        return { y: bounce, scale: 1, opacity: eased };
      default:
        return { y: 0, scale: 1, opacity: eased };
    }
  }, [animProgress, config.entranceAnimation]);
  
  const borderStyle = getBorderStyle(config.frameStyle || 'none');
  const scale = config.scale || 1;
  const [x, y, z] = config.position || [0, 0, 0];
  
  // 基础尺寸（不含 scale，scale 将应用到 group）
  const baseWidth = 1.5;
  const baseHeight = 1.0;
  
  // 加载中状态 - 显示占位符
  if (loadingState === 'loading') {
    return (
      <group 
        position={[x, y + transform.y, z]} 
        scale={[scale * transform.scale, scale * transform.scale, 1]}
      >
        {/* 加载中占位框 */}
        <mesh>
          <planeGeometry args={[baseWidth, baseHeight]} />
          <meshBasicMaterial
            color="#333333"
            transparent
            opacity={opacity * transform.opacity * 0.5}
          />
        </mesh>
        {/* 加载中文字 */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.15}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          加载中...
        </Text>
      </group>
    );
  }
  
  // 错误状态 - 显示错误提示
  if (loadingState === 'error') {
    return (
      <group 
        position={[x, y + transform.y, z]} 
        scale={[scale * transform.scale, scale * transform.scale, 1]}
      >
        {/* 错误占位框 */}
        <mesh>
          <planeGeometry args={[baseWidth, baseHeight]} />
          <meshBasicMaterial
            color="#442222"
            transparent
            opacity={opacity * transform.opacity * 0.5}
          />
        </mesh>
        {/* 错误图标和文字 */}
        <Text
          position={[0, 0.1, 0.01]}
          fontSize={0.2}
          color="#ff6666"
          anchorX="center"
          anchorY="middle"
        >
          ⚠
        </Text>
        <Text
          position={[0, -0.15, 0.01]}
          fontSize={0.1}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          图片加载失败
        </Text>
      </group>
    );
  }
  
  // 没有纹理时不渲染
  if (!texture) return null;
  
  // 计算图片宽高比，使用基础宽度计算高度
  // Fix: Cast texture.image to HTMLImageElement to access width and height
  const image = texture.image as HTMLImageElement;
  const aspect = image ? image.width / image.height : 1;
  const width = baseWidth;
  const height = width / aspect;
  
  return (
    <group
      position={[x, y + transform.y, z]}
      scale={[scale * transform.scale, scale * transform.scale, 1]}
    >
      {/* 边框背景（如果有） */}
      {config.frameStyle && config.frameStyle !== 'none' && (
        <mesh position={[0, -borderStyle.bottomPadding / 2, -0.01]}>
          <planeGeometry args={[
            width + borderStyle.padding * 2,
            height + borderStyle.padding + borderStyle.bottomPadding
          ]} />
          <meshBasicMaterial
            color={config.frameStyle === 'polaroid' ? '#ffffff' : '#333333'}
            transparent
            opacity={opacity * transform.opacity * 0.9}
          />
        </mesh>
      )}
      
      {/* 图片 */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={opacity * transform.opacity}
        />
      </mesh>
      
      {/* 阴影效果 */}
      {config.frameStyle === 'shadow' && (
        <mesh position={[0.05, -0.05, -0.02]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={opacity * transform.opacity * 0.3}
          />
        </mesh>
      )}
    </group>
  );
}
