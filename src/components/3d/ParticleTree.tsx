
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ColorTheme, ParticleShape } from '@/types';
import { useAppStore, useSettings } from '@/stores/appStore';
import { generateParticles, generateTreeColors } from '@/utils/particleUtils';

interface ParticleTreeProps {
  particleCount: number;
  particleShape: ParticleShape;
  colorTheme: ColorTheme;
}

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPulseIntensity;
  uniform float uPulseTime;

  void main() {
    vColor = color;
    // 基础缩放与呼吸
    float breathe = sin(uTime * 1.2 + position.y * 0.5) * 0.15 + 1.0;
    
    // 脉冲效果：从中心向外扩散的波动
    float distFromCenter = length(position.xz);
    float pulseWave = sin((distFromCenter * 3.0 - uPulseTime * 8.0)) * 0.5 + 0.5;
    float pulseEffect = pulseWave * uPulseIntensity * 0.3;
    
    // 脉冲时粒子轻微抖动
    vec3 pulseOffset = vec3(
      sin(uTime * 20.0 + position.x * 10.0) * uPulseIntensity * 0.02,
      sin(uTime * 25.0 + position.y * 10.0) * uPulseIntensity * 0.02,
      sin(uTime * 22.0 + position.z * 10.0) * uPulseIntensity * 0.02
    );
    
    vec4 mvPosition = modelViewMatrix * vec4(position + pulseOffset, 1.0);
    // 调整粒子大小计算：增加基础倍数，确保小尺寸时也能看到
    // 脉冲时粒子变大
    float pulseSizeBoost = 1.0 + pulseEffect;
    gl_PointSize = size * breathe * pulseSizeBoost * uPixelRatio * (800.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // 随深度微调透明度，脉冲时更亮
    vOpacity = clamp(1.0 / (-mvPosition.z * 0.2), 0.2, 1.0) * (1.0 + pulseEffect * 0.5);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    // 绘制完美的圆形扁平粒子
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // 边缘柔化
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 1.5);
    
    gl_FragColor = vec4(vColor, vOpacity * strength);
  }
`;

export default function ParticleTree({ particleCount, particleShape, colorTheme }: ParticleTreeProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  const countdownPulse = useAppStore((state) => state.countdownPulse);
  const settings = useSettings();
  const lerpProgress = useRef(0);
  const pulseTimeRef = useRef(0);
  const targetPulseIntensity = useRef(0);

  const { basePositions, spreadPositions, colors, sizes } = useMemo(() => {
    const base = generateParticles(particleCount, particleShape);
    const scaledBase = new Float32Array(base.length);
    for (let i = 0; i < base.length; i++) scaledBase[i] = base[i] * settings.shapeScale;

    const spread = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = (5 + Math.random() * 5) * settings.shapeScale;
      spread[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      spread[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      spread[i * 3 + 2] = radius * Math.cos(phi);
      sz[i] = settings.particleSize * (0.8 + Math.random() * 1.2);
    }

    return {
      basePositions: scaledBase,
      spreadPositions: spread,
      colors: generateTreeColors(particleCount, colorTheme),
      sizes: sz
    };
  }, [particleCount, particleShape, colorTheme, settings.shapeScale, settings.particleSize]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(basePositions), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [basePositions, colors, sizes]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    // 脉冲效果处理
    if (countdownPulse.active) {
      // 新脉冲触发时重置时间
      const timeSincePulse = (Date.now() - countdownPulse.timestamp) / 1000;
      if (timeSincePulse < 0.1) {
        pulseTimeRef.current = 0;
        targetPulseIntensity.current = countdownPulse.intensity;
      }
      pulseTimeRef.current += delta;
      
      // 脉冲强度随时间衰减
      const decayedIntensity = targetPulseIntensity.current * Math.max(0, 1 - pulseTimeRef.current * 1.5);
      materialRef.current.uniforms.uPulseIntensity.value = decayedIntensity;
      materialRef.current.uniforms.uPulseTime.value = pulseTimeRef.current;
    } else {
      // 平滑衰减到0
      materialRef.current.uniforms.uPulseIntensity.value *= 0.95;
      if (materialRef.current.uniforms.uPulseIntensity.value < 0.01) {
        materialRef.current.uniforms.uPulseIntensity.value = 0;
      }
    }
    
    // 使用设置中的旋转速度 (0-1 映射到 0-0.2)
    const rotationAmount = delta * settings.rotationSpeed * 0.2;
    pointsRef.current.rotation.y += rotationAmount;
    
    const target = isParticleSpread ? 1 : 0;
    lerpProgress.current += (target - lerpProgress.current) * delta * 2.0;
    
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = lerpProgress.current;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      posAttr.setXYZ(
        i,
        basePositions[i3] * (1 - t) + spreadPositions[i3] * t,
        basePositions[i3 + 1] * (1 - t) + spreadPositions[i3 + 1] * t,
        basePositions[i3 + 2] * (1 - t) + spreadPositions[i3 + 2] * t
      );
    }
    posAttr.needsUpdate = true;
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uPulseIntensity: { value: 0 },
    uPulseTime: { value: 0 },
  }), []);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </points>
  );
}
