import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePhotoWallSettings, useCelebrationState, usePhotos, useCountdown } from '@/stores/appStore';
import type { PhotoWallSettings, PhotoData } from '@/types';

// ============================================
// 单列滚动数据结构
// ============================================
interface ColumnData {
  col: number;
  meshes: {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    photoIndex: number;
  }[];
  // 当前列最底部的照片索引（下一个要显示的）
  bottomPhotoIndex: number;
  // 当前列最顶部的照片索引（向上滚动时用）
  topPhotoIndex: number;
}

// ============================================
// 照片网格组件 - 连续平滑滚动
// ============================================

interface PhotoGridProps {
  photos: PhotoData[];
  columns: number;
  rows: number;
  gap: number;
  photoScale: number;
  shape: PhotoWallSettings['photoShape'];
  borderRadius: number;
  opacity: number;
  scrollSpeed: number;
  scrollDirection: PhotoWallSettings['scrollDirection'];
  scrollPaused: boolean;
}

const PhotoGrid = function PhotoGrid({
  photos,
  columns,
  rows,
  gap,
  photoScale,
  shape,
  borderRadius,
  opacity,
  scrollSpeed,
  scrollDirection,
  scrollPaused,
}: PhotoGridProps) {
  const groupRef = useRef<THREE.Group>(null);
  const columnsDataRef = useRef<ColumnData[]>([]);
  
  // 用 ref 存储频繁变化的值
  const scrollSpeedRef = useRef(scrollSpeed);
  const scrollPausedRef = useRef(scrollPaused);
  const scrollDirectionRef = useRef(scrollDirection);
  const opacityRef = useRef(opacity);
  
  // 每次渲染时同步更新 refs
  scrollSpeedRef.current = scrollSpeed;
  scrollPausedRef.current = scrollPaused;
  scrollDirectionRef.current = scrollDirection;
  
  // 平滑速度（用于缓动效果）
  const currentVelocityRef = useRef(0);
  
  // 用于稳定 photos 的 ID 列表
  const photosKey = useMemo(() => photos.map(p => p.id).join(','), [photos]);
  
  // 生成随机化的照片索引序列（只在 photos ID 变化时重新生成）
  const shuffledIndices = useMemo(() => {
    const indices = photos.map((_, i) => i);
    // Fisher-Yates 洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photosKey]);
  
  // opacity 变化时更新材质
  useEffect(() => {
    opacityRef.current = opacity;
    columnsDataRef.current.forEach(colData => {
      colData.meshes.forEach(item => {
        if (item.material) item.material.opacity = opacity / 100;
      });
    });
  }, [opacity]);
  
  // 预加载所有照片纹理
  const photoUrls = useMemo(() => photos.map(p => p.url), [photos]);
  const textures = useTexture(photoUrls);
  const textureArray = useMemo(() => 
    Array.isArray(textures) ? textures : [textures], 
    [textures]
  );
  
  // 用 ref 存储 textureArray 避免重复初始化
  const textureArrayRef = useRef(textureArray);
  textureArrayRef.current = textureArray;
  
  // 设置纹理属性
  useEffect(() => {
    textureArray.forEach(texture => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    });
  }, [textureArray]);
  
  // 计算网格布局参数
  const gridParams = useMemo(() => {
    const size = 1.5 * photoScale;
    const gapSize = gap / 50;
    const cellHeight = size + gapSize;
    const cellWidth = size + gapSize;
    
    // 可视区域
    const viewportHeight = rows * cellHeight;
    const viewportWidth = columns * cellWidth - gapSize;
    
    // 总行数 = rows + 1（多一行用于循环）
    const totalRows = rows + 1;
    
    const startX = -viewportWidth / 2 + size / 2;
    const topY = viewportHeight / 2 - size / 2;
    const bottomY = -viewportHeight / 2 - size / 2 - cellHeight; // 回收边界
    const recycleTopY = topY + cellHeight; // 回收到顶部的位置
    
    return { 
      size, cellHeight, cellWidth, 
      viewportHeight, viewportWidth, totalRows,
      startX, topY, bottomY, recycleTopY
    };
  }, [columns, rows, gap, photoScale]);
  
  // 创建几何体（共享）
  const geometry = useMemo(() => {
    const size = gridParams.size;
    if (shape === 'circle') {
      return new THREE.CircleGeometry(size / 2, 24);
    } else if (shape === 'rounded') {
      const roundedShape = new THREE.Shape();
      const radius = (borderRadius / 100) * (size / 2);
      const x = -size / 2;
      const y = -size / 2;
      const width = size;
      const height = size;
      
      roundedShape.moveTo(x + radius, y);
      roundedShape.lineTo(x + width - radius, y);
      roundedShape.quadraticCurveTo(x + width, y, x + width, y + radius);
      roundedShape.lineTo(x + width, y + height - radius);
      roundedShape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      roundedShape.lineTo(x + radius, y + height);
      roundedShape.quadraticCurveTo(x, y + height, x, y + height - radius);
      roundedShape.lineTo(x, y + radius);
      roundedShape.quadraticCurveTo(x, y, x + radius, y);
      
      return new THREE.ShapeGeometry(roundedShape);
    } else {
      return new THREE.PlaneGeometry(size, size);
    }
  }, [gridParams.size, shape, borderRadius]);
  
  // 初始化列数据（只在布局参数变化时重新创建）
  useEffect(() => {
    if (!groupRef.current) return;
    
    // 清理旧的
    columnsDataRef.current.forEach(colData => {
      colData.meshes.forEach(item => {
        item.material.dispose();
        item.mesh.removeFromParent();
      });
    });
    columnsDataRef.current = [];
    
    const { startX, cellWidth, cellHeight, topY, totalRows } = gridParams;
    const currentTextureArray = textureArrayRef.current;
    
    // 为每列创建数据
    for (let col = 0; col < columns; col++) {
      // 使用随机化索引
      const startIdx = shuffledIndices[col % shuffledIndices.length];
      
      const colData: ColumnData = {
        col,
        meshes: [],
        // 初始化：最底部照片索引（随机起点）
        bottomPhotoIndex: (startIdx + totalRows) % shuffledIndices.length,
        // 初始化：最顶部照片索引
        topPhotoIndex: (startIdx - 1 + shuffledIndices.length) % shuffledIndices.length,
      };
      
      const x = startX + col * cellWidth;
      
      // 为该列创建 totalRows 个 mesh
      for (let row = 0; row < totalRows; row++) {
        // 使用随机化的照片索引
        const shuffleIdx = (startIdx + row) % shuffledIndices.length;
        const photoIndex = shuffledIndices[shuffleIdx];
        const y = topY - row * cellHeight;
        
        const material = new THREE.MeshBasicMaterial({
          map: currentTextureArray[photoIndex],
          transparent: true,
          opacity: opacityRef.current / 100,
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 0);
        groupRef.current.add(mesh);
        
        colData.meshes.push({ mesh, material, photoIndex });
      }
      
      columnsDataRef.current.push(colData);
    }
    
    return () => {
      columnsDataRef.current.forEach(colData => {
        colData.meshes.forEach(item => item.material.dispose());
      });
    };
  }, [columns, rows, gridParams, geometry, shuffledIndices]);
  
  // 每帧更新 - 连续平滑滚动
  useFrame((_, delta) => {
    if (columnsDataRef.current.length === 0) return;
    
    const { cellHeight, cellWidth, bottomY, recycleTopY } = gridParams;
    
    // 速度模型：scrollSpeed 表示每秒滚动多少行（cellHeight）
    // scrollSpeed = 1 → 每秒滚动 0.33 行（缓慢）
    // scrollSpeed = 5 → 每秒滚动 1.67 行（中等，类似手机照片墙）
    // scrollSpeed = 10 → 每秒滚动 3.33 行（快速）
    const rowsPerSecond = scrollSpeedRef.current / 3;
    const targetVelocity = scrollPausedRef.current ? 0 : rowsPerSecond * cellHeight;
    
    // 平滑插值速度（缓动效果）
    const smoothFactor = 5;
    currentVelocityRef.current += (targetVelocity - currentVelocityRef.current) * Math.min(1, delta * smoothFactor);
    
    // 如果速度太小，直接停止
    if (Math.abs(currentVelocityRef.current) < 0.0001 * cellHeight) {
      currentVelocityRef.current = 0;
      return;
    }
    
    const speed = currentVelocityRef.current;
    
    // 根据方向计算位移（speed 已经是基于 cellHeight 的速度）
    let dy = 0;
    let dx = 0;
    const direction = scrollDirectionRef.current;
    
    switch (direction) {
      case 'vertical':
        dy = -delta * speed; // 向下滚动
        break;
      case 'horizontal':
        dx = -delta * speed; // 向左滚动
        break;
      case 'diagonal-down':
        dy = -delta * speed * 0.707; // 45度角
        dx = -delta * speed * 0.707;
        break;
      case 'diagonal-up':
        dy = delta * speed * 0.707; // 向上45度角
        dx = -delta * speed * 0.707;
        break;
    }
    
    // 更新每列的 mesh 位置
    columnsDataRef.current.forEach(colData => {
      colData.meshes.forEach(item => {
        item.mesh.position.y += dy;
        item.mesh.position.x += dx;
      });
      
      // 垂直滚动回收逻辑
      if (dy !== 0) {
        // 向下滚动：检查是否有 mesh 移出底部
        if (dy < 0) {
          // 找到最底部的 mesh
          let bottomMesh = colData.meshes[0];
          colData.meshes.forEach((item) => {
            if (item.mesh.position.y < bottomMesh.mesh.position.y) {
              bottomMesh = item;
            }
          });
          
          // 如果最底部的 mesh 移出可视区域
          if (bottomMesh.mesh.position.y < bottomY) {
            // 找到最顶部的 mesh
            let topMesh = colData.meshes[0];
            colData.meshes.forEach(item => {
              if (item.mesh.position.y > topMesh.mesh.position.y) {
                topMesh = item;
              }
            });
            
            // 将最底部的 mesh 移到最顶部上方
            bottomMesh.mesh.position.y = topMesh.mesh.position.y + cellHeight;
            
            // 更换贴图：使用随机化的照片索引
            const newPhotoIndex = shuffledIndices[colData.bottomPhotoIndex % shuffledIndices.length];
            bottomMesh.material.map = textureArrayRef.current[newPhotoIndex];
            bottomMesh.material.needsUpdate = true;
            bottomMesh.photoIndex = newPhotoIndex;
            
            // 更新该列的索引
            colData.bottomPhotoIndex = (colData.bottomPhotoIndex + 1) % shuffledIndices.length;
            colData.topPhotoIndex = (colData.topPhotoIndex + 1) % shuffledIndices.length;
          }
        }
        
        // 向上滚动：检查是否有 mesh 移出顶部
        if (dy > 0) {
          // 找到最顶部的 mesh
          let topMesh = colData.meshes[0];
          colData.meshes.forEach((item) => {
            if (item.mesh.position.y > topMesh.mesh.position.y) {
              topMesh = item;
            }
          });
          
          // 如果最顶部的 mesh 移出可视区域
          if (topMesh.mesh.position.y > recycleTopY) {
            // 找到最底部的 mesh
            let bottomMesh = colData.meshes[0];
            colData.meshes.forEach(item => {
              if (item.mesh.position.y < bottomMesh.mesh.position.y) {
                bottomMesh = item;
              }
            });
            
            // 将最顶部的 mesh 移到最底部下方
            topMesh.mesh.position.y = bottomMesh.mesh.position.y - cellHeight;
            
            // 更换贴图：使用随机化的照片索引
            const newPhotoIndex = shuffledIndices[colData.topPhotoIndex];
            topMesh.material.map = textureArrayRef.current[newPhotoIndex];
            topMesh.material.needsUpdate = true;
            topMesh.photoIndex = newPhotoIndex;
            
            // 更新该列的索引
            colData.topPhotoIndex = (colData.topPhotoIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
            colData.bottomPhotoIndex = (colData.bottomPhotoIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
          }
        }
      }
      
      // 水平滚动回收逻辑
      if (dx !== 0 && direction === 'horizontal') {
        const leftBound = gridParams.startX - cellWidth;
        const rightBound = gridParams.startX + columns * cellWidth;
        
        // 向左滚动：检查是否有 mesh 移出左边
        if (dx < 0) {
          colData.meshes.forEach(item => {
            if (item.mesh.position.x < leftBound) {
              // 找到最右边的 mesh
              let rightMost = colData.meshes[0];
              colData.meshes.forEach(m => {
                if (m.mesh.position.x > rightMost.mesh.position.x) {
                  rightMost = m;
                }
              });
              
              // 移到最右边
              item.mesh.position.x = rightMost.mesh.position.x + cellWidth;
              
              // 更换贴图
              const newPhotoIndex = shuffledIndices[colData.bottomPhotoIndex % shuffledIndices.length];
              item.material.map = textureArrayRef.current[newPhotoIndex];
              item.material.needsUpdate = true;
              item.photoIndex = newPhotoIndex;
              
              colData.bottomPhotoIndex = (colData.bottomPhotoIndex + 1) % shuffledIndices.length;
            }
          });
        }
        
        // 向右滚动：检查是否有 mesh 移出右边
        if (dx > 0) {
          colData.meshes.forEach(item => {
            if (item.mesh.position.x > rightBound) {
              // 找到最左边的 mesh
              let leftMost = colData.meshes[0];
              colData.meshes.forEach(m => {
                if (m.mesh.position.x < leftMost.mesh.position.x) {
                  leftMost = m;
                }
              });
              
              // 移到最左边
              item.mesh.position.x = leftMost.mesh.position.x - cellWidth;
              
              // 更换贴图
              const newPhotoIndex = shuffledIndices[colData.topPhotoIndex];
              item.material.map = textureArrayRef.current[newPhotoIndex];
              item.material.needsUpdate = true;
              item.photoIndex = newPhotoIndex;
              
              colData.topPhotoIndex = (colData.topPhotoIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
            }
          });
        }
      }
    });
  });
  
  return <group ref={groupRef} />;
};

// ============================================
// 遮罩组件 - 隐藏滚动边缘
// ============================================

interface EdgeMaskProps {
  viewportWidth: number;
  viewportHeight: number;
  scrollDirection: PhotoWallSettings['scrollDirection'];
  maskSize: number;
}

function EdgeMask({ viewportWidth, viewportHeight, scrollDirection, maskSize }: EdgeMaskProps) {
  // 纯黑色完全不透明材质
  const blackMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: false,
      opacity: 1,
      depthWrite: true,
    });
  }, []);

  const isVertical = scrollDirection === 'vertical' || scrollDirection === 'diagonal-down' || scrollDirection === 'diagonal-up';
  const isHorizontal = scrollDirection === 'horizontal' || scrollDirection === 'diagonal-down' || scrollDirection === 'diagonal-up';

  // 遮罩尺寸放大
  const bigMaskSize = maskSize * 3;
  
  // 顶部遮罩偏移
  const topOffset = maskSize * 1.5;
  // 底部遮罩偏移（更大，往下移更多）
  const bottomOffset = maskSize * 0.5;

  return (
    <group position={[0, 0, 0.5]}>
      {/* 顶部遮罩 */}
      {isVertical && (
        <mesh position={[0, viewportHeight / 2 + bigMaskSize / 2 - topOffset, 0]} material={blackMaterial}>
          <planeGeometry args={[viewportWidth + 6, bigMaskSize]} />
        </mesh>
      )}
      {/* 底部遮罩 - 更往下 */}
      {isVertical && (
        <mesh position={[0, -viewportHeight / 2 - bigMaskSize / 2 + bottomOffset, 0]} material={blackMaterial}>
          <planeGeometry args={[viewportWidth + 6, bigMaskSize]} />
        </mesh>
      )}
      {/* 左侧遮罩 */}
      {isHorizontal && (
        <mesh position={[-viewportWidth / 2 - bigMaskSize / 2 + topOffset, 0, 0]} material={blackMaterial}>
          <planeGeometry args={[bigMaskSize, viewportHeight + 6]} />
        </mesh>
      )}
      {/* 右侧遮罩 */}
      {isHorizontal && (
        <mesh position={[viewportWidth / 2 + bigMaskSize / 2 - topOffset, 0, 0]} material={blackMaterial}>
          <planeGeometry args={[bigMaskSize, viewportHeight + 6]} />
        </mesh>
      )}
    </group>
  );
}

// ============================================
// 照片墙文字组件
// ============================================

function WallTextDisplay({ settings, wallHeight }: { 
  settings: PhotoWallSettings['text']; 
  wallHeight: number;
}) {
  if (!settings.enabled || !settings.content) return null;
  
  let yPosition = 0;
  switch (settings.position) {
    case 'top': yPosition = wallHeight / 2 + 1; break;
    case 'center': yPosition = 0; break;
    case 'bottom': yPosition = -wallHeight / 2 - 1; break;
  }
  
  return (
    <Text
      position={[0, yPosition, 0.5]}
      fontSize={settings.fontSize / 50}
      color={settings.color}
      anchorX="center"
      anchorY="middle"
      maxWidth={10}
    >
      {settings.content}
    </Text>
  );
}

// ============================================
// 主照片墙组件
// ============================================

export default function PhotoWall() {
  const settings = usePhotoWallSettings();
  const celebrationState = useCelebrationState();
  const countdown = useCountdown();
  const allPhotos = usePhotos();
  
  const selectedPhotos = useMemo(() => {
    if (settings.selectedPhotoIds.length === 0) return allPhotos;
    const filtered = allPhotos.filter(p => settings.selectedPhotoIds.includes(p.id));
    return filtered.length === 0 ? allPhotos : filtered;
  }, [allPhotos, settings.selectedPhotoIds]);
  
  // 判断是否显示照片墙
  const shouldShow = settings.enabled && selectedPhotos.length > 0 && (
    settings.displayMode === 'global' ||
    (settings.displayMode === 'celebration' && celebrationState.isActive &&
      ['year_display', 'blessing', 'confetti'].includes(celebrationState.phase)) ||
    (settings.displayMode === 'after-countdown' && (countdown.isFinished || celebrationState.isActive))
  );
  
  const opacityRef = useRef(0);
  const [displayOpacity, setDisplayOpacity] = useState(0);
  const targetOpacity = shouldShow ? settings.opacity : 0;
  
  useFrame((_, delta) => {
    const fadeSpeed = 1 / Math.max(settings.fadeDuration, 0.1);
    const prev = opacityRef.current;
    
    if (opacityRef.current < targetOpacity) {
      opacityRef.current = Math.min(opacityRef.current + delta * fadeSpeed * 100, targetOpacity);
    } else if (opacityRef.current > targetOpacity) {
      opacityRef.current = Math.max(opacityRef.current - delta * fadeSpeed * 100, targetOpacity);
    }
    
    if (Math.abs(opacityRef.current - displayOpacity) > 2 ||
        (prev <= 0 && opacityRef.current > 0) ||
        (prev > 0 && opacityRef.current <= 0)) {
      setDisplayOpacity(opacityRef.current);
    }
  });
  
  const wallHeight = useMemo(() => {
    const size = 1.5 * settings.photoScale;
    return settings.rows * (size + settings.gap / 50);
  }, [settings.rows, settings.photoScale, settings.gap]);
  
  const wallWidth = useMemo(() => {
    const size = 1.5 * settings.photoScale;
    const gapSize = settings.gap / 50;
    return settings.columns * (size + gapSize) - gapSize;
  }, [settings.columns, settings.photoScale, settings.gap]);
  
  const maskSize = useMemo(() => {
    const size = 1.5 * settings.photoScale;
    return size * 0.8; // 遮罩大小为照片大小的 80%
  }, [settings.photoScale]);
  
  if (displayOpacity <= 0 || selectedPhotos.length === 0) return null;
  
  return (
    <group position={[0, 0, -25]}>
      <PhotoGrid
        photos={selectedPhotos}
        columns={settings.columns}
        rows={settings.rows}
        gap={settings.gap}
        photoScale={settings.photoScale}
        shape={settings.photoShape}
        borderRadius={settings.borderRadius}
        opacity={displayOpacity}
        scrollSpeed={settings.scrollSpeed}
        scrollDirection={settings.scrollDirection}
        scrollPaused={settings.scrollPaused}
      />
      <EdgeMask
        viewportWidth={wallWidth}
        viewportHeight={wallHeight}
        scrollDirection={settings.scrollDirection}
        maskSize={maskSize}
      />
      <WallTextDisplay settings={settings.text} wallHeight={wallHeight} />
    </group>
  );
}
