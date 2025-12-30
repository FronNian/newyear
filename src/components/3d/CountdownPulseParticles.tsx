import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/stores/appStore';

interface CountdownPulseParticlesProps {
  particleCount?: number;
}

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute vec3 basePosition;
  attribute float randomSeed;
  
  varying vec3 vColor;
  varying float vOpacity;
  
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPulseIntensity;
  uniform float uPulseTime;

  void main() {
    vColor = color;
    
    // 基础位置
    vec3 pos = basePosition;
    
    // 轻微漂浮动画
    pos.x += sin(uTime * 0.5 + randomSeed * 10.0) * 0.1;
    pos.y += sin(uTime * 0.7 + randomSeed * 8.0) * 0.1;
    pos.z += sin(uTime * 0.3 + randomSeed * 6.0) * 0.05;
    
    // 脉冲时的抖动效果 - 随机方向剧烈抖动
    float shakeIntensity = uPulseIntensity * 0.3;
    pos.x += sin(uTime * 30.0 + randomSeed * 100.0) * shakeIntensity;
    pos.y += sin(uTime * 35.0 + randomSeed * 120.0) * shakeIntensity;
    pos.z += sin(uTime * 25.0 + randomSeed * 80.0) * shakeIntensity * 0.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // 脉冲时粒子变大
    float pulseSizeBoost = 1.0 + uPulseIntensity * 1.2;
    // 基础呼吸效果
    float breathe = sin(uTime * 1.5 + randomSeed * 5.0) * 0.15 + 1.0;
    
    gl_PointSize = size * breathe * pulseSizeBoost * uPixelRatio * (500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // 脉冲时更亮
    vOpacity = 0.5 + uPulseIntensity * 0.5;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // 柔和的圆形
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 1.5);
    
    // 发光效果
    vec3 glowColor = vColor * 1.3;
    
    gl_FragColor = vec4(glowColor, vOpacity * strength);
  }
`;

export default function CountdownPulseParticles({ particleCount = 300 }: CountdownPulseParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const countdownPulse = useAppStore((state) => state.countdownPulse);
  const pulseTimeRef = useRef(0);
  const targetPulseIntensity = useRef(0);
  const lastTimestamp = useRef(0);

  const { colors, sizes, basePositions, randomSeeds } = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const szs = new Float32Array(particleCount);
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    
    // 多种颜色
    const colorPalette = [
      [1.0, 1.0, 1.0],     // 白色
      [1.0, 1.0, 0.6],     // 浅黄色
      [1.0, 0.9, 0.3],     // 金黄色
      [0.6, 1.0, 0.6],     // 浅绿色
      [0.4, 1.0, 0.8],     // 青绿色
      [0.8, 0.6, 1.0],     // 淡紫色
      [1.0, 0.7, 0.7],     // 淡粉色
      [0.7, 0.9, 1.0],     // 淡蓝色
      [1.0, 0.8, 0.5],     // 橙黄色
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // 随机颜色
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      cols[i * 3] = color[0];
      cols[i * 3 + 1] = color[1];
      cols[i * 3 + 2] = color[2];
      
      // 随机大小
      szs[i] = 0.06 + Math.random() * 0.1;
      
      // 分布在屏幕各个角落 - 球形分布，但避开中心区域
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // 半径范围：3-8，避开中心的倒计时数字
      const radius = 3 + Math.random() * 5;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6; // 压扁一点，更像屏幕分布
      positions[i * 3 + 2] = radius * Math.cos(phi) * 0.3 + 1; // z轴压缩，保持在可视范围
      
      // 随机种子用于动画
      seeds[i] = Math.random();
    }
    
    return { colors: cols, sizes: szs, basePositions: positions, randomSeeds: seeds };
  }, [particleCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('basePosition', new THREE.BufferAttribute(basePositions, 3));
    geo.setAttribute('randomSeed', new THREE.BufferAttribute(randomSeeds, 1));
    return geo;
  }, [particleCount, colors, sizes, basePositions, randomSeeds]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    // 脉冲效果处理
    if (countdownPulse.active) {
      // 检测新脉冲
      if (countdownPulse.timestamp !== lastTimestamp.current) {
        lastTimestamp.current = countdownPulse.timestamp;
        pulseTimeRef.current = 0;
        targetPulseIntensity.current = countdownPulse.intensity;
      }
      
      pulseTimeRef.current += delta;
      
      // 脉冲强度随时间快速衰减，产生"跳动"感
      const decayedIntensity = targetPulseIntensity.current * Math.max(0, 1 - pulseTimeRef.current * 2.0);
      materialRef.current.uniforms.uPulseIntensity.value = decayedIntensity;
      materialRef.current.uniforms.uPulseTime.value = pulseTimeRef.current;
    } else {
      // 平滑衰减
      materialRef.current.uniforms.uPulseIntensity.value *= 0.9;
    }
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
