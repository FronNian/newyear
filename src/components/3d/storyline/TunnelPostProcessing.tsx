import { forwardRef, useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Effect } from 'postprocessing';
import * as THREE from 'three';

// 径向模糊 Shader
const radialBlurFragmentShader = `
  uniform float uStrength;
  uniform float uCenterX;
  uniform float uCenterY;
  uniform int uSamples;
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 center = vec2(uCenterX, uCenterY);
    vec2 dir = uv - center;
    float dist = length(dir);
    
    if (uStrength < 0.001) {
      outputColor = inputColor;
      return;
    }
    
    vec4 color = vec4(0.0);
    float totalWeight = 0.0;
    int samples = uSamples;
    
    for (int i = 0; i < 12; i++) {
      if (i >= samples) break;
      
      float t = float(i) / float(samples - 1);
      float weight = 1.0 - t * 0.5;
      
      vec2 offset = dir * t * uStrength * dist;
      vec2 sampleUV = uv - offset;
      
      if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
        color += texture2D(inputBuffer, sampleUV) * weight;
        totalWeight += weight;
      }
    }
    
    outputColor = color / totalWeight;
    outputColor = mix(inputColor, outputColor, min(uStrength * 2.0, 0.8));
  }
`;

/**
 * 自定义径向模糊效果类
 */
class RadialBlurEffect extends Effect {
  constructor({ strength = 0, centerX = 0.5, centerY = 0.5, samples = 8 } = {}) {
    super('RadialBlurEffect', radialBlurFragmentShader, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uStrength', new THREE.Uniform(strength)],
        ['uCenterX', new THREE.Uniform(centerX)],
        ['uCenterY', new THREE.Uniform(centerY)],
        ['uSamples', new THREE.Uniform(samples)],
      ]),
    });
  }
  
  set strength(value: number) {
    (this.uniforms.get('uStrength') as THREE.Uniform).value = value;
  }
  
  get strength(): number {
    return (this.uniforms.get('uStrength') as THREE.Uniform).value;
  }
}

interface TunnelRadialBlurProps {
  enabled?: boolean;
  maxStrength?: number;
  samples?: number;
}

/**
 * 隧道径向模糊组件
 */
export const TunnelRadialBlur = forwardRef<RadialBlurEffect, TunnelRadialBlurProps>(
  function TunnelRadialBlur({ enabled = true, maxStrength = 0.15, samples = 8 }, ref) {
    const { camera } = useThree();
    const lastCameraX = useMemo(() => ({ value: camera.position.x }), [camera]);
    const velocity = useMemo(() => ({ value: 0, smoothed: 0 }), []);
    
    const effect = useMemo(() => {
      return new RadialBlurEffect({
        strength: 0,
        centerX: 0.5,
        centerY: 0.5,
        samples,
      });
    }, [samples]);
    
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(effect);
      } else if (ref) {
        ref.current = effect;
      }
    }, [effect, ref]);
    
    useFrame((_, delta) => {
      if (!enabled) {
        effect.strength = 0;
        return;
      }
      
      const currentX = camera.position.x;
      velocity.value = (currentX - lastCameraX.value) / Math.max(delta, 0.001);
      lastCameraX.value = currentX;
      
      velocity.smoothed += (Math.abs(velocity.value) - velocity.smoothed) * 0.1;
      
      const normalizedVelocity = Math.min(velocity.smoothed / 20, 1);
      const targetStrength = normalizedVelocity * maxStrength;
      
      effect.strength += (targetStrength - effect.strength) * 0.15;
    });
    
    return <primitive object={effect} />;
  }
);

export { RadialBlurEffect };
