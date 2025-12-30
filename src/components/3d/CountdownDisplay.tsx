import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, useCountdown, useSettings } from '@/stores/appStore';
import { calculateCountdown, formatCountdown, getFinalCountdownNumber } from '@/utils/countdown';
import { getShapeBounds } from '@/utils/particleUtils';
import { COLOR_THEME_MAP } from '@/types';
import CountdownParticleText from './CountdownParticleText';

export default function CountdownDisplay() {
  const countdown = useCountdown();
  const settings = useSettings();
  const setCountdown = useAppStore((state) => state.setCountdown);
  const triggerEffect = useAppStore((state) => state.triggerEffect);
  const textRef = useRef<THREE.Mesh>(null);
  const prevFinished = useRef(false);
  const [lastDisplayText, setLastDisplayText] = useState('');
  
  // 动态计算高度，确保永远不重叠
  const textY = useMemo(() => {
    const shapeBounds = getShapeBounds(settings.particleShape, settings.shapeScale);
    // 根据形状动态调整间距，烟花形状需要更多空间
    const padding = settings.particleShape === 'firework' ? 1.5 : 1.0;
    return shapeBounds.maxY + padding;
  }, [settings.particleShape, settings.shapeScale]);
  
  useEffect(() => {
    const updateCountdown = () => {
      const data = calculateCountdown(new Date(), new Date(`${settings.targetYear}-01-01T00:00:00`));
      setCountdown(data);
      
      if (data.isFinished && !prevFinished.current) {
        triggerEffect('firework');
        prevFinished.current = true;
      }
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [setCountdown, triggerEffect, settings.targetYear]);
  
  useFrame((state) => {
    if (!textRef.current) return;
    const time = state.clock.elapsedTime;
    
    // 增强动态效果
    if (countdown.isLastTenSeconds && !countdown.isFinished) {
      const s = 1 + Math.abs(Math.sin(time * 10)) * 0.1;
      textRef.current.scale.setScalar(s);
    } else {
      const float = Math.sin(time * 2) * 0.05 + 1;
      textRef.current.scale.setScalar(float);
    }
  });

  const getDisplayText = () => {
    if (countdown.isFinished) return settings.targetYear.toString();
    const finalNumber = getFinalCountdownNumber(countdown);
    return finalNumber !== null ? finalNumber.toString() : formatCountdown(countdown);
  };

  const getFontSize = () => {
    const baseSize = settings.countdownFontSize || 0.5;
    if (countdown.isFinished) return baseSize * 2.0;
    if (countdown.isLastTenSeconds) return baseSize * 3.5;
    return baseSize;
  };

  const getColor = () => {
    const themeColors = COLOR_THEME_MAP[settings.colorTheme];
    if (countdown.isFinished) return themeColors.primary;
    if (countdown.isLastTenSeconds) return themeColors.secondary;
    return themeColors.primary;
  };

  const displayText = getDisplayText();
  
  // 更新上一次显示的文字（用于粒子模式的 key）
  useEffect(() => {
    if (displayText !== lastDisplayText) {
      setLastDisplayText(displayText);
    }
  }, [displayText, lastDisplayText]);

  // 粒子模式
  if (settings.countdownDisplayMode === 'particle') {
    return (
      <group position={[0, textY, 0]}>
        <CountdownParticleText
          text={displayText}
          colorTheme={settings.colorTheme}
          particleCount={settings.countdownParticleCount}
          position={[0, 0, 0]}
          scale={countdown.isLastTenSeconds ? 1.5 : (countdown.isFinished ? 1.2 : 0.8)}
        />
        
        {!countdown.isLastTenSeconds && !countdown.isFinished && (
          <Billboard follow={true} position={[0, -1.5, 0]}>
            <Text
              fontSize={getFontSize() * 0.3}
              color="#AAAAAA"
              anchorX="center"
              anchorY="middle"
            >
              距 {settings.targetYear} 年还有
            </Text>
          </Billboard>
        )}
      </group>
    );
  }

  // 文字模式（默认）
  return (
    <Billboard follow={true} position={[0, textY, 0]}>
      <group>
        <Text
          ref={textRef}
          fontSize={getFontSize()}
          color={getColor()}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
          outlineOpacity={0.5}
        >
          {displayText}
          <meshStandardMaterial
            emissive={getColor()}
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </Text>
        
        {!countdown.isLastTenSeconds && !countdown.isFinished && (
          <Text
            position={[0, -0.6, 0]}
            fontSize={getFontSize() * 0.3}
            color="#AAAAAA"
            anchorX="center"
            anchorY="middle"
          >
            距 {settings.targetYear} 年还有
          </Text>
        )}
      </group>
    </Billboard>
  );
}
