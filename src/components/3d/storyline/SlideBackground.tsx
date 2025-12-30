import { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import type { BackgroundEffectConfig } from '@/types';
import Snowfall from '../Snowfall';
import HeartEffect from '../HeartEffect';

interface SlideBackgroundProps {
  effect?: BackgroundEffectConfig;
}

/** 根据背景效果类型渲染对应组件 */
export default function SlideBackground({ effect }: SlideBackgroundProps) {
  const intensity = effect?.intensity || 0.5;
  const type = effect?.type || 'stars';
  
  // 根据强度计算粒子数量
  const particleCount = useMemo(() => {
    return Math.floor(200 + intensity * 800);
  }, [intensity]);
  
  switch (type) {
    case 'snow':
      return <Snowfall count={particleCount} area={20} />;
    
    case 'stars':
      return (
        <Stars
          radius={100}
          depth={50}
          count={Math.floor(2000 + intensity * 3000)}
          factor={4}
          saturation={0}
          fade
          speed={intensity}
        />
      );
    
    case 'hearts':
      return <HeartEffect active={true} />;
    
    case 'leaves':
      // 使用雪花组件模拟落叶，颜色不同
      return <Snowfall count={Math.floor(particleCount * 0.5)} area={15} />;
    
    case 'rain':
      // 使用雪花组件模拟雨滴，速度更快
      return <Snowfall count={particleCount} area={20} />;
    
    case 'fireworks':
      // 烟花效果在外部处理，这里只返回星空背景
      return (
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      );
    
    case 'none':
    default:
      return null;
  }
}
