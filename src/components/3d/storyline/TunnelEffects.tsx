import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TUNNEL_LAYOUT, TUNNEL_THEMES, TunnelTheme } from './TunnelWalls';

interface SpeedLinesProps {
  count?: number;
  length?: number;
  globalColor?: string;
  theme?: TunnelTheme;
}

/**
 * 速度线效果 - 高速掠过的拖尾粒子
 * 使用 Line 而非 Points，产生明确的方向感
 */
export function SpeedLines({
  count = 150,
  length = 80,
  globalColor = '#6366f1',
  theme = 'galaxy',
}: SpeedLinesProps) {
  const linesRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const lastCameraX = useRef(0);
  const cameraVelocity = useRef(0);
  
  const themeColors = TUNNEL_THEMES[theme];
  
  // 创建速度线数据
  const linesData = useMemo(() => {
    const lines: {
      startPos: THREE.Vector3;
      angle: number;
      radius: number;
      speed: number;
      trailLength: number;
      color: THREE.Color;
    }[] = [];
    
    const color1 = new THREE.Color(globalColor);
    const color2 = new THREE.Color(themeColors.secondary);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 0.5 + Math.random() * 0.45;
      const radius = TUNNEL_LAYOUT.TUNNEL_RADIUS * radiusVariation;
      const x = (Math.random() - 0.5) * length;
      
      const mixRatio = Math.random();
      const color = color1.clone().lerp(color2, mixRatio);
      
      lines.push({
        startPos: new THREE.Vector3(x, Math.cos(angle) * radius, Math.sin(angle) * radius),
        angle,
        radius,
        speed: 8 + Math.random() * 12,
        trailLength: 0.5 + Math.random() * 1.5,
        color,
      });
    }
    
    return lines;
  }, [count, length, globalColor, themeColors.secondary]);

  // 创建线条几何体
  const lineGeometries = useMemo(() => {
    return linesData.map((line) => {
      const geometry = new THREE.BufferGeometry();
      // 每条线2个点：起点和终点（拖尾）
      const positions = new Float32Array(6);
      const colors = new Float32Array(6);
      
      // 起点
      positions[0] = line.startPos.x;
      positions[1] = line.startPos.y;
      positions[2] = line.startPos.z;
      // 终点（初始与起点相同）
      positions[3] = line.startPos.x - line.trailLength;
      positions[4] = line.startPos.y;
      positions[5] = line.startPos.z;
      
      // 颜色：头部亮，尾部暗
      colors[0] = line.color.r;
      colors[1] = line.color.g;
      colors[2] = line.color.b;
      colors[3] = line.color.r * 0.2;
      colors[4] = line.color.g * 0.2;
      colors[5] = line.color.b * 0.2;
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      return geometry;
    });
  }, [linesData]);
  
  // 动画更新
  useFrame((_, delta) => {
    const currentCameraX = camera.position.x;
    cameraVelocity.current = (currentCameraX - lastCameraX.current) / Math.max(delta, 0.001);
    lastCameraX.current = currentCameraX;
    
    // 速度响应：相机移动越快，速度线越长越快
    const velocityFactor = Math.min(Math.abs(cameraVelocity.current) * 0.1, 2);
    const baseSpeed = 1 + velocityFactor;
    
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        const data = linesData[i];
        const positions = line.geometry.attributes.position.array as Float32Array;
        
        // 移动速度线（向 -X 方向）
        const moveSpeed = data.speed * baseSpeed * delta;
        positions[0] -= moveSpeed;
        positions[3] -= moveSpeed;
        
        // 动态拖尾长度：速度越快，拖尾越长
        const dynamicTrailLength = data.trailLength * (1 + velocityFactor * 0.5);
        positions[3] = positions[0] - dynamicTrailLength;
        
        // 循环：当线条移出视野后，重置到前方
        if (positions[0] < currentCameraX - 15) {
          const newX = currentCameraX + 30 + Math.random() * 20;
          positions[0] = newX;
          positions[3] = newX - dynamicTrailLength;
        }
        
        line.geometry.attributes.position.needsUpdate = true;
      });
    }
  });
  
  return (
    <group ref={linesRef}>
      {lineGeometries.map((geometry, i) => (
        <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }))} />
      ))}
    </group>
  );
}


interface TunnelPortalGlowProps {
  globalColor?: string;
  theme?: TunnelTheme;
  intensity?: number;
}

/**
 * 隧道口光晕效果 - 前方的发光平面
 * 模拟"隧道尽头的光"，增强深度感和方向感
 */
export function TunnelPortalGlow({
  theme = 'galaxy',
  intensity = 1.0,
}: TunnelPortalGlowProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const timeRef = useRef(0);
  
  const themeColors = TUNNEL_THEMES[theme];
  
  // 光晕材质
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(themeColors.primary) },
        uSecondaryColor: { value: new THREE.Color(themeColors.secondary) },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uSecondaryColor;
        uniform float uIntensity;
        varying vec2 vUv;
        
        void main() {
          // 从中心向外的径向渐变
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // 多层光晕
          float glow1 = 1.0 - smoothstep(0.0, 0.5, dist);
          float glow2 = 1.0 - smoothstep(0.0, 0.3, dist);
          float glow3 = 1.0 - smoothstep(0.0, 0.15, dist);
          
          // 脉冲效果
          float pulse = sin(uTime * 1.5) * 0.15 + 0.85;
          
          // 颜色混合
          vec3 color = mix(uColor, uSecondaryColor, glow2 * 0.5);
          color = mix(color, vec3(1.0), glow3 * 0.3);
          
          // 最终透明度
          float alpha = (glow1 * 0.3 + glow2 * 0.4 + glow3 * 0.5) * uIntensity * pulse;
          alpha = clamp(alpha, 0.0, 0.8);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [themeColors, intensity]);
  
  // 内层更亮的光晕
  const innerGlowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#ffffff') },
        uIntensity: { value: intensity * 0.8 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // 更集中的核心光
          float core = 1.0 - smoothstep(0.0, 0.2, dist);
          float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
          
          float alpha = core * uIntensity * pulse * 0.6;
          
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [intensity]);
  
  // 动画更新
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    // 更新材质时间
    if (glowMaterial.uniforms) {
      glowMaterial.uniforms.uTime.value = timeRef.current;
    }
    if (innerGlowMaterial.uniforms) {
      innerGlowMaterial.uniforms.uTime.value = timeRef.current;
    }
    
    // 光晕跟随相机前方
    if (glowRef.current) {
      glowRef.current.position.x = camera.position.x + 25;
    }
    if (innerGlowRef.current) {
      innerGlowRef.current.position.x = camera.position.x + 25;
    }
  });
  
  return (
    <group>
      {/* 外层大光晕 */}
      <mesh
        ref={glowRef}
        position={[25, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[TUNNEL_LAYOUT.TUNNEL_RADIUS * 3, TUNNEL_LAYOUT.TUNNEL_RADIUS * 3]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
      
      {/* 内层核心光 */}
      <mesh
        ref={innerGlowRef}
        position={[25, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[TUNNEL_LAYOUT.TUNNEL_RADIUS * 1.5, TUNNEL_LAYOUT.TUNNEL_RADIUS * 1.5]} />
        <primitive object={innerGlowMaterial} attach="material" />
      </mesh>
    </group>
  );
}
