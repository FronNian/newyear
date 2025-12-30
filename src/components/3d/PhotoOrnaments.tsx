import { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import type { ParticleShape } from '@/types';
import { useAppStore, useSettings } from '@/stores/appStore';

// 检测是否移动端
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 确定性随机数生成器
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// 生成散开位置 - 保持在可视范围内
const generateScatterPosition = (index: number): THREE.Vector3 => {
  const r1 = seededRandom(index * 3 + 1);
  const r2 = seededRandom(index * 3 + 2);
  const r3 = seededRandom(index * 3 + 3);
  const theta = r1 * Math.PI * 2;
  const phi = Math.acos(2 * r2 - 1);
  const r = 4 + r3 * 4;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// 根据形状生成目标位置
const generateTargetPosition = (
  index: number,
  total: number,
  shape: ParticleShape,
  height: number,
  radius: number
): THREE.Vector3 => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  switch (shape) {
    case 'tree': {
      const heightRatio = (index + 0.5) / total;
      const y = (heightRatio * height * 0.9) - (height / 2) + (height * 0.05);
      const normalizedY = (y + height / 2) / height;
      const currentRadius = radius * (1 - normalizedY * 0.85) + 0.8;
      const baseAngle = index * goldenAngle;
      const theta = baseAngle + (seededRandom(index * 7 + 300) * 0.3 - 0.15);
      const radiusOffset = (seededRandom(index * 7 + 301) - 0.5) * 0.8;
      const finalRadius = Math.max(0.5, currentRadius + radiusOffset);
      const yOffset = (seededRandom(index * 7 + 302) - 0.5) * 1.5;
      const finalY = Math.max(-height / 2 + 0.5, Math.min(height / 2 - 0.5, y + yOffset));
      return new THREE.Vector3(finalRadius * Math.cos(theta), finalY, finalRadius * Math.sin(theta));
    }
    case 'firework': {
      const isCenter = seededRandom(index * 5) < 0.3;
      if (isCenter) {
        const theta = seededRandom(index * 5 + 1) * Math.PI * 2;
        const phi = Math.acos(2 * seededRandom(index * 5 + 2) - 1);
        const r = Math.pow(seededRandom(index * 5 + 3), 0.5) * radius * 0.8;
        return new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta) * 0.6,
          r * Math.cos(phi) * 1.8,
          r * Math.sin(phi) * Math.sin(theta) * 0.6
        );
      } else {
        const layer = Math.floor(seededRandom(index * 5 + 4) * 5);
        const layerRadius = radius * (0.8 + layer * 0.3);
        const angle = seededRandom(index * 5 + 5) * Math.PI * 2;
        const y = (seededRandom(index * 5 + 6) - 0.5) * 0.5;
        return new THREE.Vector3(Math.cos(angle) * layerRadius, y, Math.sin(angle) * layerRadius);
      }
    }
    case 'heart': {
      const t = (index / total) * Math.PI * 2;
      const r = 0.5 + seededRandom(index * 4) * 0.5;
      const x2d = 16 * Math.pow(Math.sin(t), 3);
      const y2d = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const scale = 0.08 * r * (radius / 1.5);
      const depth = (seededRandom(index * 4 + 1) - 0.5) * 0.5;
      return new THREE.Vector3(x2d * scale, y2d * scale, depth);
    }
    case 'cake': {
      const layerRand = seededRandom(index * 6);
      let y: number, rad: number;
      if (layerRand < 0.4) {
        y = -height / 2 + seededRandom(index * 6 + 1) * height * 0.2;
        rad = radius * (0.5 + seededRandom(index * 6 + 2) * 0.5);
      } else if (layerRand < 0.7) {
        y = -height / 4 + seededRandom(index * 6 + 1) * height * 0.2;
        rad = radius * (0.4 + seededRandom(index * 6 + 2) * 0.4);
      } else if (layerRand < 0.9) {
        y = seededRandom(index * 6 + 1) * height * 0.15;
        rad = radius * (0.3 + seededRandom(index * 6 + 2) * 0.3);
      } else {
        y = height * 0.2 + seededRandom(index * 6 + 1) * height * 0.3;
        rad = seededRandom(index * 6 + 2) * radius * 0.2;
      }
      const angle = seededRandom(index * 6 + 3) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * rad, y, Math.sin(angle) * rad);
    }
    default: {
      const theta = seededRandom(index * 3) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(index * 3 + 1) - 1);
      const r = (0.5 + seededRandom(index * 3 + 2) * 0.5) * radius;
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * height / 4,
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
  }
};

interface PhotoOrnamentsProps {
  photoPaths: string[];
}

// 单张照片组件 - 选中时独立渲染，不受父级旋转影响
const SelectedPhoto = memo(({ 
  texture, 
  aspectRatio,
  photoScale,
  onDeselect 
}: { 
  texture: THREE.Texture;
  aspectRatio: number;
  photoScale: number;
  onDeselect: () => void;
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef(new THREE.Vector3());
  const initializedRef = useRef(false);

  const baseSize = 0.5 * photoScale;
  const innerBorder = 0.02 * photoScale;
  const outerBorder = 0.06 * photoScale;
  const frameColor = '#FFFFFF';

  const innerColor = useMemo(() => {
    const color = new THREE.Color(frameColor);
    color.multiplyScalar(0.85);
    return '#' + color.getHexString();
  }, []);

  const geometries = useMemo(() => {
    const photoWidth = aspectRatio >= 1 ? baseSize * Math.sqrt(aspectRatio) : baseSize * Math.sqrt(aspectRatio);
    const photoHeight = aspectRatio >= 1 ? baseSize / Math.sqrt(aspectRatio) : baseSize / Math.sqrt(aspectRatio);
    const innerWidth = photoWidth + innerBorder * 2;
    const innerHeight = photoHeight + innerBorder * 2;
    const frameWidth = innerWidth + outerBorder * 2;
    const frameHeight = innerHeight + outerBorder * 2;
    return {
      photo: new THREE.PlaneGeometry(photoWidth, photoHeight),
      inner: new THREE.PlaneGeometry(innerWidth, innerHeight),
      frame: new THREE.PlaneGeometry(frameWidth, frameHeight)
    };
  }, [aspectRatio, baseSize, innerBorder, outerBorder]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const mobile = isMobile();
    const distance = mobile ? 3 : 4;
    const targetScale = mobile ? 3 : 4;
    
    // 计算相机前方的目标位置
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const target = camera.position.clone().add(cameraDir.multiplyScalar(distance));
    target.y += mobile ? 0.3 : 0.5;
    
    // 初始化位置或平滑移动
    if (!initializedRef.current) {
      positionRef.current.copy(target);
      initializedRef.current = true;
    } else {
      positionRef.current.lerp(target, Math.min(1, delta * 12));
    }
    
    groupRef.current.position.copy(positionRef.current);
    groupRef.current.scale.setScalar(targetScale);
    
    // 使用相机的旋转矩阵来确保照片正确面向相机，不会颠倒
    // 复制相机的四元数旋转，这样照片会和相机屏幕平行
    groupRef.current.quaternion.copy(camera.quaternion);
    
    // 轻微摆动效果 - 在四元数基础上添加
    const wobble = Math.sin(time * 2) * 0.02;
    groupRef.current.rotateZ(wobble);
  });

  return (
    <group ref={groupRef}>
      {/* 正面 */}
      <group position={[0, 0, 0.02]}>
        <mesh 
          geometry={geometries.frame} 
          position={[0, 0, -0.02]}
          onClick={(e) => {
            e.stopPropagation();
            onDeselect();
          }}
        >
          <meshBasicMaterial color={frameColor} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={geometries.inner} position={[0, 0, -0.01]}>
          <meshBasicMaterial color={innerColor} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={geometries.photo}>
          <meshBasicMaterial map={texture} side={THREE.FrontSide} toneMapped={false} />
        </mesh>
      </group>
      {/* 背面 */}
      <group position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
        <mesh 
          geometry={geometries.frame} 
          position={[0, 0, -0.02]}
          onClick={(e) => {
            e.stopPropagation();
            onDeselect();
          }}
        >
          <meshBasicMaterial color={frameColor} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={geometries.inner} position={[0, 0, -0.01]}>
          <meshBasicMaterial color={innerColor} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={geometries.photo}>
          <meshBasicMaterial map={texture} side={THREE.FrontSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
});

export const PhotoOrnaments = memo(({ photoPaths }: PhotoOrnamentsProps) => {
  const settings = useSettings();
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  const selectedPhotoId = useAppStore((state) => state.selectedPhotoId);
  const setSelectedPhotoId = useAppStore((state) => state.setSelectedPhotoId);
  const photos = useAppStore((state) => state.photos);

  const count = photoPaths.length;
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const currentChaosRef = useRef<THREE.Vector3[]>([]);
  const targetChaosRef = useRef<THREE.Vector3[]>([]);
  const chaosTransitionRef = useRef(1);
  const rotationRef = useRef(0);

  // 形状参数
  const shapeHeight = 4 * settings.shapeScale;
  const shapeRadius = 1.5 * settings.shapeScale;

  // 批量加载纹理
  const textures = useTexture(photoPaths);

  const textureData = useMemo(() => {
    const textureArray = Array.isArray(textures) ? textures : [textures];
    return textureArray.map((texture: THREE.Texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      const image = texture.image as { width: number; height: number } | undefined;
      const aspectRatio = (image && image.width && image.height) ? image.width / image.height : 1;
      return { texture, aspectRatio };
    });
  }, [textures]);

  // 拍立得尺寸
  const photoScale = 1.0;
  const baseSize = 0.5 * photoScale;
  const innerBorder = 0.02 * photoScale;
  const outerBorder = 0.06 * photoScale;

  const geometries = useMemo(() => {
    return textureData.map(({ aspectRatio }) => {
      const photoWidth = aspectRatio >= 1 ? baseSize * Math.sqrt(aspectRatio) : baseSize * Math.sqrt(aspectRatio);
      const photoHeight = aspectRatio >= 1 ? baseSize / Math.sqrt(aspectRatio) : baseSize / Math.sqrt(aspectRatio);
      const innerWidth = photoWidth + innerBorder * 2;
      const innerHeight = photoHeight + innerBorder * 2;
      const frameWidth = innerWidth + outerBorder * 2;
      const frameHeight = innerHeight + outerBorder * 2;
      return {
        photo: new THREE.PlaneGeometry(photoWidth, photoHeight),
        inner: new THREE.PlaneGeometry(innerWidth, innerHeight),
        frame: new THREE.PlaneGeometry(frameWidth, frameHeight)
      };
    });
  }, [textureData, baseSize, innerBorder, outerBorder]);

  const frameColor = '#FFFFFF';
  const innerColor = useMemo(() => {
    const color = new THREE.Color(frameColor);
    color.multiplyScalar(0.85);
    return '#' + color.getHexString();
  }, []);

  // 生成每张照片的数据
  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const targetPos = generateTargetPosition(i, count, settings.particleShape, shapeHeight, shapeRadius);
      const r1 = seededRandom(i * 6 + 200);
      const r2 = seededRandom(i * 6 + 201);
      const r3 = seededRandom(i * 6 + 202);
      const r4 = seededRandom(i * 6 + 203);
      const r5 = seededRandom(i * 6 + 204);
      const r6 = seededRandom(i * 6 + 205);
      return {
        targetPos,
        scale: r1 < 0.2 ? 1.5 : 0.8 + r2 * 0.4,
        textureIndex: i,
        currentPos: new THREE.Vector3(),
        currentScale: 1,
        chaosRotation: new THREE.Euler(r3 * Math.PI, r4 * Math.PI, r5 * Math.PI),
        rotationSpeed: { x: (r3 - 0.5), y: (r4 - 0.5), z: (r5 - 0.5) },
        wobbleOffset: r5 * 10,
        wobbleSpeed: 0.5 + r6 * 0.5
      };
    });
  }, [count, settings.particleShape, shapeHeight, shapeRadius]);

  // 初始化散开位置
  useEffect(() => {
    if (currentChaosRef.current.length !== count) {
      currentChaosRef.current = data.map((_, i) => generateScatterPosition(i));
      targetChaosRef.current = currentChaosRef.current.map(p => p.clone());
      data.forEach((d, i) => d.currentPos.copy(currentChaosRef.current[i]));
      chaosTransitionRef.current = 1;
    }
  }, [count, data]);

  // 找到选中照片的索引
  const selectedIndex = useMemo(() => {
    if (!selectedPhotoId) return null;
    return photos.findIndex(p => p.id === selectedPhotoId);
  }, [selectedPhotoId, photos]);

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = !isParticleSpread;
    const time = stateObj.clock.elapsedTime;
    const targetProgress = isFormed ? 1 : 0;
    const duration = 1;
    const step = delta / duration;

    if (targetProgress > progressRef.current) {
      progressRef.current = Math.min(targetProgress, progressRef.current + step);
    } else if (targetProgress < progressRef.current) {
      progressRef.current = Math.max(targetProgress, progressRef.current - step);
    }
    const rawT = progressRef.current;

    // 同步旋转 - 使用设置中的旋转速度 (0-1 映射到 0-0.2)
    const rotationAmount = delta * settings.rotationSpeed * 0.2;
    rotationRef.current += rotationAmount;
    groupRef.current.rotation.y = rotationRef.current;

    groupRef.current.children.forEach((group, i) => {
      const objData = data[i];
      if (!objData) return;

      const photoId = photos[i]?.id;
      const isSelected = selectedPhotoId === photoId;
      
      // 选中的照片隐藏（由 SelectedPhoto 组件独立渲染）
      group.visible = !isSelected;
      if (isSelected) return;

      const currentChaos = currentChaosRef.current[i];
      const targetChaos = targetChaosRef.current[i];
      if (!currentChaos || !targetChaos) return;

      const targetScale = objData.scale;
      const t = rawT * rawT * (3 - 2 * rawT); // smoothstep
      group.position.lerpVectors(currentChaos, objData.targetPos, t);
      objData.currentPos.copy(group.position);

      objData.currentScale = MathUtils.lerp(objData.currentScale, targetScale, delta * 5);
      group.scale.setScalar(objData.currentScale);

      if (isFormed) {
        group.lookAt(new THREE.Vector3(group.position.x * 2, group.position.y + 0.5, group.position.z * 2));
        group.rotation.x += Math.sin(time * objData.wobbleSpeed + objData.wobbleOffset) * 0.05;
        group.rotation.z += Math.cos(time * objData.wobbleSpeed * 0.8 + objData.wobbleOffset) * 0.05;
      } else {
        group.rotation.x += delta * objData.rotationSpeed.x;
        group.rotation.y += delta * objData.rotationSpeed.y;
        group.rotation.z += delta * objData.rotationSpeed.z;
      }
    });
  });

  if (count === 0) return null;

  return (
    <>
      {/* 旋转的照片组 */}
      <group ref={groupRef}>
        {data.map((obj, i) => {
          const geo = geometries[obj.textureIndex];
          if (!geo) return null;
          const photoId = photos[i]?.id;
          return (
            <group
              key={i}
              position={currentChaosRef.current[i] ? currentChaosRef.current[i].clone() : new THREE.Vector3()}
              scale={[obj.scale, obj.scale, obj.scale]}
              onClick={(e) => {
                e.stopPropagation();
                const nextId = selectedPhotoId === photoId ? null : photoId;
                requestAnimationFrame(() => setSelectedPhotoId(nextId ?? null));
              }}
            >
              {/* 正面 */}
              <group position={[0, 0, 0.02]}>
                <mesh geometry={geo.frame} position={[0, 0, -0.02]}>
                  <meshBasicMaterial color={frameColor} side={THREE.FrontSide} />
                </mesh>
                <mesh geometry={geo.inner} position={[0, 0, -0.01]}>
                  <meshBasicMaterial color={innerColor} side={THREE.FrontSide} />
                </mesh>
                <mesh geometry={geo.photo}>
                  <meshBasicMaterial map={textureData[obj.textureIndex]?.texture} side={THREE.FrontSide} toneMapped={false} />
                </mesh>
              </group>
              {/* 背面 */}
              <group position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
                <mesh geometry={geo.frame} position={[0, 0, -0.02]}>
                  <meshBasicMaterial color={frameColor} side={THREE.FrontSide} />
                </mesh>
                <mesh geometry={geo.inner} position={[0, 0, -0.01]}>
                  <meshBasicMaterial color={innerColor} side={THREE.FrontSide} />
                </mesh>
                <mesh geometry={geo.photo}>
                  <meshBasicMaterial map={textureData[obj.textureIndex]?.texture} side={THREE.FrontSide} toneMapped={false} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
      
      {/* 选中的照片 - 独立渲染，不受旋转影响 */}
      {selectedIndex !== null && selectedIndex >= 0 && textureData[selectedIndex] && (
        <SelectedPhoto
          texture={textureData[selectedIndex].texture}
          aspectRatio={textureData[selectedIndex].aspectRatio}
          photoScale={photoScale}
          onDeselect={() => setSelectedPhotoId(null)}
        />
      )}
    </>
  );
});

export default PhotoOrnaments;
