import { useRef, useEffect, useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
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
  const prevFinished = useRef(false);
  
  const textY = useMemo(() => {
    const shapeBounds = getShapeBounds(settings.particleShape, settings.shapeScale);
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

  const getDisplayText = () => {
    if (countdown.isFinished) return settings.targetYear.toString();
    const finalNumber = getFinalCountdownNumber(countdown);
    return finalNumber !== null ? finalNumber.toString() : formatCountdown(countdown);
  };

  const getParticleScale = () => {
    if (countdown.isFinished) return 2.2;
    if (countdown.isLastTenSeconds) return 2.8;
    return 1.4;
  };

  const getParticleCount = () => {
    const base = settings.countdownParticleCount || 15000;
    if (countdown.isLastTenSeconds) return Math.min(base * 1.5, 40000);
    return base;
  };

  // 获取主题颜色
  const themeColors = COLOR_THEME_MAP[settings.colorTheme];

  return (
    <group position={[0, textY, 0]}>
      <CountdownParticleText
        text={getDisplayText()}
        colorTheme={settings.colorTheme}
        particleCount={getParticleCount()}
        particleSize={settings.countdownParticleSize || 1.5}
        position={[0, 0, 0]}
        scale={getParticleScale()}
      />
      {!countdown.isLastTenSeconds && !countdown.isFinished && (
        <Billboard follow={true} position={[0, -2.5, 2]}>
          <Text fontSize={0.22} color={themeColors.accent} anchorX="center" anchorY="middle">
            距 {settings.targetYear} 年还有
          </Text>
        </Billboard>
      )}
    </group>
  );
}
