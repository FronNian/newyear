/**
 * Fireworks Component - Canvas-based firework system
 * Renders as a portal outside the Three.js canvas
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFireworkConfig, useCountdown, useAppStore } from '@/stores/appStore';
import { FireworkSystem, FireworkConfig as FWConfig } from '@/fireworks/fireworkSystem';
import { FireworkRenderer } from '@/fireworks/renderer';
import { ParticleColor } from '@/fireworks/particle';

interface FireworksProps {
  active?: boolean;
  onComplete?: () => void;
}

// Color palettes
const COLOR_PALETTES: Record<string, ParticleColor[]> = {
  classic: [
    { r: 255, g: 80, b: 80 },
    { r: 80, g: 255, b: 80 },
    { r: 80, g: 80, b: 255 },
    { r: 255, g: 255, b: 80 },
    { r: 255, g: 80, b: 255 },
    { r: 80, g: 255, b: 255 },
    { r: 255, g: 180, b: 80 },
  ],
  warm: [
    { r: 255, g: 50, b: 50 },
    { r: 255, g: 150, b: 50 },
    { r: 255, g: 220, b: 100 },
    { r: 255, g: 100, b: 150 },
  ],
  cool: [
    { r: 100, g: 150, b: 255 },
    { r: 150, g: 100, b: 255 },
    { r: 100, g: 255, b: 200 },
  ],
  mono: [
    { r: 255, g: 255, b: 255 },
    { r: 220, g: 220, b: 255 },
    { r: 255, g: 255, b: 220 },
  ]
};

interface FireworksCanvasProps {
  active: boolean;
  isParticleSpread: boolean;
  onComplete?: () => void;
}

function FireworksCanvas({ active, isParticleSpread, onComplete }: FireworksCanvasProps) {
  const config = useFireworkConfig();
  const countdown = useCountdown();
  const setFireworkTriggerState = useAppStore((s) => s.setFireworkTriggerState);
  const setCelebrationStartTime = useAppStore((s) => s.setCelebrationStartTime);
  const celebrationStartTime = useAppStore((s) => s.celebrationStartTime);
  const triggerState = useAppStore((s) => s.fireworkTriggerState);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<FireworkSystem | null>(null);
  const rendererRef = useRef<FireworkRenderer | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const launchTimerRef = useRef<number>(0);
  const prevActiveRef = useRef(false);
  const initializedRef = useRef(false);
  
  // Store config in ref for use in callbacks
  const configRef = useRef(config);
  configRef.current = config;
  
  // Get random color from palette
  const getRandomColor = useCallback((): ParticleColor => {
    const palette = COLOR_PALETTES[configRef.current.colorTheme] || COLOR_PALETTES.classic;
    return { ...palette[Math.floor(Math.random() * palette.length)] };
  }, []);
  
  // Launch a single firework - uses ref to get latest config
  const launchFirework = useCallback(() => {
    if (!systemRef.current || !configRef.current.enabled) return;
    
    const cfg = configRef.current;
    // Use particle count directly from config (20-200)
    const actualParticleCount = cfg.particleCount;
    
    // explosionRange controls the velocity range (0.3-2.0)
    const velocityMultiplier = cfg.explosionRange;
    
    const fwConfig: Partial<FWConfig> = {
      explosionParticleCount: actualParticleCount,
      explosionVelocityMin: 50 * cfg.burstSize * velocityMultiplier,
      explosionVelocityMax: 180 * cfg.burstSize * velocityMultiplier,
      gravity: 150,
      drag: 0.6,
      trailLength: Math.min(cfg.trailLength, 10),
      flickerRate: 0,
      secondaryEnabled: false,
      crackleEnabled: false,
      primaryColor: getRandomColor(),
      secondaryColor: { r: 255, g: 255, b: 255 }
    };
    
    systemRef.current.launch(fwConfig);
  }, [getRandomColor]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initializedRef.current) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    systemRef.current = new FireworkSystem(width, height);
    rendererRef.current = new FireworkRenderer(canvas, {
      glowEnabled: true,
      motionBlurEnabled: true,
      fadeAlpha: 0.15
    });
    
    initializedRef.current = true;
    
    // Handle resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      
      systemRef.current?.resize(w, h);
      rendererRef.current?.resize(canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update renderer glow setting when config changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setConfig({
        glowEnabled: config.glowIntensity > 0
      });
    }
  }, [config.glowIntensity]);
  
  // Animation loop
  useEffect(() => {
    if (!initializedRef.current) return;
    
    const animate = (currentTime: number) => {
      if (!systemRef.current || !rendererRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const dt = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = currentTime;
      const cappedDt = Math.min(dt, 0.05);
      
      // Update simulation
      systemRef.current.update(cappedDt);
      
      // Clear and render
      rendererRef.current.clear();
      rendererRef.current.render(systemRef.current);
      
      // Auto launch when active - use configRef for latest values
      // 只有在粒子散开状态时才继续发射烟花
      const cfg = configRef.current;
      if (active && cfg.enabled && isParticleSpread) {
        launchTimerRef.current += cappedDt * 1000;
        // launchRate: 1-10, interval: 1000ms - 100ms
        const interval = Math.floor(1000 / cfg.launchRate);
        if (launchTimerRef.current >= interval) {
          launchTimerRef.current = 0;
          launchFirework();
        }
      }
      
      // Check completion - 当粒子聚合时也视为完成
      if ((!active || !isParticleSpread) && systemRef.current.fireworks.length === 0) {
        onComplete?.();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active, isParticleSpread, launchFirework, onComplete]);
  
  // Handle active state change - launch initial burst (controlled by launchRate)
  useEffect(() => {
    if (active && !prevActiveRef.current && configRef.current.enabled && systemRef.current) {
      setCelebrationStartTime(Date.now());
      setFireworkTriggerState({ phase: 'celebration', burstTriggered: true, lastLaunchTime: Date.now() });
      
      // Launch initial fireworks based on launchRate (1-3 fireworks)
      const initialCount = Math.min(3, Math.ceil(configRef.current.launchRate / 3));
      for (let i = 0; i < initialCount; i++) {
        setTimeout(() => launchFirework(), i * 200);
      }
    }
    prevActiveRef.current = active;
  }, [active, launchFirework, setCelebrationStartTime, setFireworkTriggerState]);
  
  // Countdown trigger
  useEffect(() => {
    if (!configRef.current.enabled || active || !systemRef.current) return;
    
    const { totalSeconds, isFinished } = countdown;
    let phase = triggerState.phase;
    
    if (isFinished) {
      phase = celebrationStartTime ? 'celebration' : 'idle';
    } else if (totalSeconds <= 3) {
      phase = 'accelerate';
    } else if (totalSeconds <= 10) {
      phase = 'warmup';
    } else {
      phase = 'idle';
    }
    
    if (phase !== triggerState.phase) {
      setFireworkTriggerState({ phase });
    }
    
    if (phase === 'warmup' || phase === 'accelerate') {
      const interval = phase === 'accelerate' ? 800 : 2000;
      const now = Date.now();
      if (now - triggerState.lastLaunchTime >= interval) {
        launchFirework();
        setFireworkTriggerState({ lastLaunchTime: now });
      }
    }
  }, [active, countdown, celebrationStartTime, triggerState, setFireworkTriggerState, launchFirework]);
  
  // Reset state
  useEffect(() => {
    if (!countdown.isFinished && triggerState.burstTriggered) {
      setFireworkTriggerState({ burstTriggered: false, phase: 'idle' });
      setCelebrationStartTime(null);
    }
  }, [countdown.isFinished, triggerState.burstTriggered, setFireworkTriggerState, setCelebrationStartTime]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
}

export default function Fireworks({ active = false, onComplete }: FireworksProps) {
  const config = useFireworkConfig();
  const triggerState = useAppStore((s) => s.fireworkTriggerState);
  const countdown = useCountdown();
  const isParticleSpread = useAppStore((s) => s.isParticleSpread);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const shouldRender = active || triggerState.phase === 'warmup' || triggerState.phase === 'accelerate' || countdown.isFinished;
  
  if (!shouldRender || !config.enabled || !mounted) return null;
  
  // Render canvas as portal to document.body
  return createPortal(
    <FireworksCanvas active={active || false} isParticleSpread={isParticleSpread} onComplete={onComplete} />,
    document.body
  );
}
