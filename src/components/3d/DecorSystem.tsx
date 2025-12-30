import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDecorSettings, useAppStore, useSettings } from '@/stores/appStore';
import type { DecorType, ParticleShape } from '@/types';
import { DECOR_TYPE_CONFIGS, DECOR_TYPES_BY_CATEGORY } from '@/types';
import { generateShimmerOffset, getDecorColor, validateDecorSettings, calculateShimmer } from '@/utils/decorUtils';
import { getGeometryForType } from '@/utils/decorGeometries';
import { generateParticles } from '@/utils/particleUtils';

interface DecorInstanceData {
  type: DecorType;
  basePosition: THREE.Vector3;
  spreadPosition: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  color: THREE.Color;
  shimmerOffset: number;
}

/**
 * 生成散开位置
 */
function generateSpreadPosition(): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 4 + Math.random() * 4;
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * 从形状采样生成聚合位置
 */
function generateBasePositionsFromShape(
  count: number,
  shape: ParticleShape,
  shapeScale: number
): THREE.Vector3[] {
  const shapeParticles = generateParticles(Math.max(count * 10, 1000), shape);
  const positions: THREE.Vector3[] = [];
  
  for (let i = 0; i < count; i++) {
    const sampleIdx = Math.floor(Math.random() * (shapeParticles.length / 3));
    const x = shapeParticles[sampleIdx * 3] * shapeScale;
    const y = shapeParticles[sampleIdx * 3 + 1] * shapeScale;
    const z = shapeParticles[sampleIdx * 3 + 2] * shapeScale;
    
    const offset = 0.3;
    positions.push(new THREE.Vector3(
      x + (Math.random() - 0.5) * offset,
      y + (Math.random() - 0.5) * offset,
      z + (Math.random() - 0.5) * offset
    ));
  }
  
  return positions;
}

/**
 * 单个类型的实例化渲染组件
 */
function DecorTypeInstances({
  type,
  instances,
  shimmerIntensity,
  spreadProgress,
}: {
  type: DecorType;
  instances: DecorInstanceData[];
  shimmerIntensity: number;
  spreadProgress: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const config = DECOR_TYPE_CONFIGS[type];
  
  const geometry = useMemo(() => getGeometryForType(type), [type]);
  
  // 临时对象用于矩阵计算
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const baseColor = useMemo(() => instances[0]?.color || new THREE.Color('#ffffff'), [instances]);
  
  useFrame((state) => {
    if (!meshRef.current || instances.length === 0) return;
    
    const time = state.clock.elapsedTime;
    const t = spreadProgress.current;
    
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      
      // 插值位置
      const x = inst.basePosition.x * (1 - t) + inst.spreadPosition.x * t;
      const y = inst.basePosition.y * (1 - t) + inst.spreadPosition.y * t;
      const z = inst.basePosition.z * (1 - t) + inst.spreadPosition.z * t;
      
      // 浮动效果
      const floatOffset = Math.sin(time * 0.5 + inst.shimmerOffset * Math.PI * 2) * 0.1;
      
      tempObject.position.set(x, y + floatOffset, z);
      tempObject.rotation.set(
        inst.rotation.x,
        inst.rotation.y + time * 0.3,
        inst.rotation.z
      );
      
      // 星星闪烁效果 - 通过缩放来增强闪烁感
      const shimmer = calculateShimmer(time, inst.shimmerOffset, shimmerIntensity);
      const scaleMultiplier = 0.8 + shimmer * 0.4; // 大小也随闪烁变化
      
      tempObject.scale.set(
        config.scale[0] * inst.scale * scaleMultiplier,
        config.scale[1] * inst.scale * scaleMultiplier,
        config.scale[2] * inst.scale * scaleMultiplier
      );
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      
      // 星星闪烁颜色效果 - 亮度变化更明显
      const brightness = 0.2 + shimmer * 1.5; // 更大的亮度范围
      tempColor.copy(inst.color).multiplyScalar(brightness);
      meshRef.current.setColorAt(i, tempColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
    
    // 更新材质的发光强度 - 使用平均闪烁值
    if (materialRef.current && instances.length > 0) {
      const avgShimmer = calculateShimmer(time, 0.5, shimmerIntensity);
      materialRef.current.emissiveIntensity = config.emissiveIntensity * (0.5 + avgShimmer * 1.5);
    }
  });
  
  if (instances.length === 0) return null;
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, instances.length]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={config.emissiveIntensity}
        transparent
        opacity={0.9}
        roughness={0.2}
        metalness={0.8}
      />
    </instancedMesh>
  );
}

export default function DecorSystem() {
  const decorSettings = useDecorSettings();
  const settings = useSettings();
  const deviceInfo = useAppStore((state) => state.deviceInfo);
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  
  const spreadProgress = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0); // 跟踪整体旋转角度
  
  // 按类型分组的实例数据
  const instancesByType = useMemo(() => {
    if (!decorSettings.enabled) return new Map<DecorType, DecorInstanceData[]>();
    
    const validSettings = validateDecorSettings(decorSettings);
    const enabledFromCategories = validSettings.enabledCategories.flatMap(
      category => DECOR_TYPES_BY_CATEGORY[category] || []
    );
    const enabledTypes = validSettings.enabledTypes.filter(type => 
      enabledFromCategories.includes(type)
    );
    
    if (enabledTypes.length === 0) return new Map<DecorType, DecorInstanceData[]>();
    
    let count = validSettings.totalCount;
    const performanceLevel = deviceInfo?.performanceLevel || 'high';
    if (performanceLevel === 'low') count = Math.floor(count * 0.5);
    else if (performanceLevel === 'medium') count = Math.floor(count * 0.75);
    count = Math.min(count, 100);
    
    const basePositions = generateBasePositionsFromShape(
      count, settings.particleShape, settings.shapeScale
    );
    
    const result = new Map<DecorType, DecorInstanceData[]>();
    const shimmerOffsets: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
      const shimmerOffset = generateShimmerOffset(shimmerOffsets);
      shimmerOffsets.push(shimmerOffset);
      
      const instance: DecorInstanceData = {
        type,
        basePosition: basePositions[i],
        spreadPosition: generateSpreadPosition(),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        scale: 0.8 + Math.random() * 0.4,
        color: new THREE.Color(getDecorColor(type, validSettings.customColors)),
        shimmerOffset,
      };
      
      if (!result.has(type)) result.set(type, []);
      result.get(type)!.push(instance);
    }
    
    return result;
  }, [
    decorSettings.enabled,
    decorSettings.totalCount,
    decorSettings.enabledCategories,
    decorSettings.enabledTypes,
    decorSettings.customColors,
    deviceInfo?.performanceLevel,
    settings.particleShape,
    settings.shapeScale,
  ]);
  
  // 更新散开进度和旋转
  useFrame((_, delta) => {
    const target = isParticleSpread ? 1 : 0;
    spreadProgress.current += (target - spreadProgress.current) * delta * 3;
    
    // 同步旋转 - 使用设置中的旋转速度 (0-1 映射到 0-0.2)
    if (groupRef.current) {
      const rotationAmount = delta * settings.rotationSpeed * 0.2;
      rotationRef.current += rotationAmount;
      groupRef.current.rotation.y = rotationRef.current;
    }
  });
  
  if (!decorSettings.enabled || instancesByType.size === 0) return null;
  
  return (
    <group name="decor-system" ref={groupRef}>
      {Array.from(instancesByType.entries()).map(([type, instances]) => (
        <DecorTypeInstances
          key={type}
          type={type}
          instances={instances}
          shimmerIntensity={decorSettings.shimmerIntensity}
          spreadProgress={spreadProgress}
        />
      ))}
    </group>
  );
}
