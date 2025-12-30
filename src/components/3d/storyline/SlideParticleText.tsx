import { useMemo } from 'react';
import type { SlideParticleTextElement } from '@/types';
import ParticleText from '../ParticleText';

interface SlideParticleTextProps {
  config: SlideParticleTextElement;
  opacity: number; // 保留接口兼容性，但粒子文字不支持透明度
}

export default function SlideParticleText({ config }: SlideParticleTextProps) {
  const position = useMemo(() => {
    return (config.position || [0, 0, 0]) as [number, number, number];
  }, [config.position]);
  
  // 验证配置
  if (!config.text || config.text.trim() === '') {
    console.warn(`[SlideParticleText] 元素 ${config.id} 没有有效的文本内容`);
    return null;
  }
  
  console.log(`[SlideParticleText] 渲染粒子文字: "${config.text}", 位置: ${position.join(',')}, 缩放: ${config.scale || 1}`);
  
  return (
    <ParticleText
      text={config.text}
      colorTheme={config.colorTheme || 'golden'}
      particleCount={config.particleCount || 2000}
      position={position}
      scale={config.scale || 1}
      fontSize={config.fontSize || 200}
      duration={10} // 持续显示
    />
  );
}
