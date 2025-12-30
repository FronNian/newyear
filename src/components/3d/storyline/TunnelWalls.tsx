import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpeedLines, TunnelPortalGlow } from './TunnelEffects';

/** 隧道布局常量 */
export const TUNNEL_LAYOUT = {
  STATION_SPACING: 12,
  TUNNEL_RADIUS: 6,
  TUNNEL_SEGMENTS: 64,
  CAMERA_Z: 0,
  CAMERA_Y: 0,
};

/** 隧道主题颜色配置 */
export const TUNNEL_THEMES = {
  neon: { primary: '#00ffff', secondary: '#ff00ff', glow: 1.5 },
  galaxy: { primary: '#6366f1', secondary: '#8b5cf6', glow: 1.0 },
  warm: { primary: '#f59e0b', secondary: '#ef4444', glow: 0.8 },
  cool: { primary: '#06b6d4', secondary: '#3b82f6', glow: 1.2 },
} as const;

export type TunnelTheme = keyof typeof TUNNEL_THEMES;

interface TunnelWallsProps {
  length: number;
  globalColor?: string;
  monthColors?: Record<number, string>;
  monthPositions: number[];
  wallOpacity?: number;
  glowIntensity?: number;
  theme?: TunnelTheme;
  enableSpeedLines?: boolean;
  enablePortalGlow?: boolean;
}

export default function TunnelWalls({
  length,
  globalColor = '#6366f1',
  wallOpacity = 0.25,
  glowIntensity = 1.0,
  theme = 'galaxy',
  enableSpeedLines = true,
  enablePortalGlow = true,
}: TunnelWallsProps) {
  const tunnelRef = useRef<THREE.Mesh>(null);
  const flowRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const lastCameraX = useRef(0);
  const cameraVelocity = useRef(0);
  
  const { camera } = useThree();
  const themeColors = TUNNEL_THEMES[theme];

  // 隧道几何体：完整圆柱但通过shader控制可见性
  const tunnelGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      TUNNEL_LAYOUT.TUNNEL_RADIUS,
      TUNNEL_LAYOUT.TUNNEL_RADIUS,
      length + 40,
      TUNNEL_LAYOUT.TUNNEL_SEGMENTS,
      Math.ceil(length / 4),
      true
    );
    geometry.rotateZ(Math.PI / 2);
    return geometry;
  }, [length]);
  
  // 流动粒子：反向流动产生穿行感
  const flowParticles = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    
    const color1 = new THREE.Color(globalColor);
    const color2 = new THREE.Color(themeColors.secondary);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 0.7 + Math.random() * 0.25;
      const radius = TUNNEL_LAYOUT.TUNNEL_RADIUS * radiusVariation;
      const x = (Math.random() - 0.5) * (length + 30);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = Math.cos(angle) * radius;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      const mixRatio = Math.random();
      const color = color1.clone().lerp(color2, mixRatio);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      speeds[i] = 2.0 + Math.random() * 3.0;
    }
    
    return { positions, colors, speeds, count };
  }, [length, globalColor, themeColors.secondary]);

  // Shader材质：基于UV流动，无网格线
  const tunnelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraX: { value: 0 },
        uCameraVelocity: { value: 0 },
        uColor: { value: new THREE.Color(globalColor) },
        uGlowColor: { value: new THREE.Color(themeColors.primary) },
        uSecondaryColor: { value: new THREE.Color(themeColors.secondary) },
        uOpacity: { value: wallOpacity },
        uGlowIntensity: { value: glowIntensity * themeColors.glow },
        uTunnelLength: { value: length },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying float vAngle;
        
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vAngle = atan(position.y, position.z);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uCameraX;
        uniform float uCameraVelocity;
        uniform vec3 uColor;
        uniform vec3 uGlowColor;
        uniform vec3 uSecondaryColor;
        uniform float uOpacity;
        uniform float uGlowIntensity;
        uniform float uTunnelLength;
        
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying float vAngle;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        void main() {
          // 侧面衰减：弱化结构感
          float angleFromTop = abs(vAngle);
          float angleFromBottom = abs(vAngle - 3.14159);
          float minAngle = min(angleFromTop, angleFromBottom);
          float sideAttenuation = smoothstep(0.3, 1.2, minAngle);
          sideAttenuation = mix(0.1, 1.0, sideAttenuation);
          
          // 基于UV的流动效果
          float flowOffset = uCameraX * 0.1 + uTime * 0.5;
          vec2 flowUV = vec2(vUv.y * 3.0 + flowOffset, vUv.x * 8.0);
          float n1 = noise(flowUV * 2.0 + uTime * 0.3);
          float n2 = noise(flowUV * 4.0 - uTime * 0.5) * 0.5;
          float n3 = noise(flowUV * 8.0 + uTime * 0.2) * 0.25;
          float flowNoise = n1 + n2 + n3;
          
          // 速度响应
          float velocityEffect = abs(uCameraVelocity) * 0.5;
          float speedStreak = smoothstep(0.3, 0.7, flowNoise + velocityEffect * 0.3);
          
          // 深度渐变
          float distFromCamera = abs(vWorldPosition.x - uCameraX);
          float depthFade = 1.0 - smoothstep(5.0, 40.0, distFromCamera);
          
          // 边缘发光
          float edgeGlow = pow(depthFade, 2.0) * 0.5;
          
          // 颜色混合
          vec3 baseColor = mix(uColor, uGlowColor, flowNoise * 0.4);
          baseColor = mix(baseColor, uSecondaryColor, speedStreak * 0.3);
          float pulse = sin(uTime * 2.0 + vWorldPosition.x * 0.2) * 0.1 + 0.9;
          baseColor *= pulse;
          vec3 finalColor = baseColor + uGlowColor * edgeGlow * uGlowIntensity;
          
          // 最终透明度
          float alpha = uOpacity * depthFade * sideAttenuation;
          alpha *= (0.2 + flowNoise * 0.3 + speedStreak * 0.2);
          alpha = clamp(alpha, 0.0, 0.6);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [globalColor, themeColors, wallOpacity, glowIntensity, length]);

  // 动画更新：粒子反向流动 + 速度响应
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    // 计算相机速度
    const currentCameraX = camera.position.x;
    cameraVelocity.current = (currentCameraX - lastCameraX.current) / Math.max(delta, 0.001);
    lastCameraX.current = currentCameraX;
    
    // 更新shader uniforms
    if (tunnelMaterial.uniforms) {
      tunnelMaterial.uniforms.uTime.value = timeRef.current;
      tunnelMaterial.uniforms.uCameraX.value = currentCameraX;
      tunnelMaterial.uniforms.uCameraVelocity.value = cameraVelocity.current;
    }
    
    // 粒子反向流动（-X方向）
    if (flowRef.current) {
      const positions = flowRef.current.geometry.attributes.position.array as Float32Array;
      const speeds = flowParticles.speeds;
      const baseFlow = 1.0;
      const velocityBoost = Math.abs(cameraVelocity.current) * 0.3;
      
      for (let i = 0; i < flowParticles.count; i++) {
        positions[i * 3] -= (speeds[i] * baseFlow + velocityBoost) * delta;
        
        if (positions[i * 3] < currentCameraX - 20) {
          positions[i * 3] = currentCameraX + length / 2 + Math.random() * 10;
        }
      }
      
      flowRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <group position={[length / 2 - 5, 0, 0]}>
      {/* 隧道背景层 */}
      <mesh
        ref={tunnelRef}
        geometry={tunnelGeometry}
        material={tunnelMaterial}
      />
      
      {/* 流动粒子层 */}
      <points ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={flowParticles.count}
            array={flowParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={flowParticles.count}
            array={flowParticles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* 速度线效果 - 高速掠过的拖尾 */}
      {enableSpeedLines && (
        <SpeedLines
          count={120}
          length={length}
          globalColor={globalColor}
          theme={theme}
        />
      )}
      
      {/* 隧道口光晕 - 前方的发光效果 */}
      {enablePortalGlow && (
        <TunnelPortalGlow
          globalColor={globalColor}
          theme={theme}
          intensity={glowIntensity * 0.8}
        />
      )}
    </group>
  );
}
