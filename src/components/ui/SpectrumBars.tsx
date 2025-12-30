/**
 * 频谱柱状图组件 - 音频可视化
 * 支持底部、左侧、右侧、环绕四种布局
 * 包含色差效果（RGB分离）
 */
import { useRef, useEffect, useCallback } from 'react';
import { useSpectrumSettings, useChromaticSettings, useVisualizerSettings } from '@/stores/appStore';
import { audioAnalyzerService } from '@/services/audioAnalyzerService';

interface SpectrumBarsProps {
  isPlaying: boolean;
}

export default function SpectrumBars({ isPlaying }: SpectrumBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const visualizerSettings = useVisualizerSettings();
  const settings = useSpectrumSettings();
  const chromaticSettings = useChromaticSettings();

  // 总开关或频谱开关关闭时，不显示
  const isEnabled = visualizerSettings.enabled && settings.enabled;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 获取频率数据
    const frequencyData = audioAnalyzerService.getFrequencyData();
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (frequencyData.length === 0 || !isPlaying) {
      // 空闲状态：绘制静态低矮柱状
      drawIdleBars(ctx, canvas, settings, chromaticSettings);
    } else {
      // 播放状态：绘制动态频谱（带色差效果）
      drawSpectrumBars(ctx, canvas, frequencyData, settings, chromaticSettings);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [isPlaying, settings, chromaticSettings]);

  useEffect(() => {
    if (!isEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置 canvas 尺寸
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // 开始动画
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isEnabled, draw]);

  if (!isEnabled) return null;

  // 根据位置返回不同的样式
  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 25,
      pointerEvents: 'none',
    };

    switch (settings.position) {
      case 'bottom':
        return { ...base, bottom: 80, left: 0, right: 0, height: 60 };
      case 'left':
        return { ...base, left: 0, top: '20%', bottom: '20%', width: 60 };
      case 'right':
        return { ...base, right: 0, top: '20%', bottom: '20%', width: 60 };
      case 'circular':
        return { ...base, inset: 0 };
      default:
        return { ...base, bottom: 80, left: 0, right: 0, height: 60 };
    }
  };

  return (
    <div style={getContainerStyle()}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}


// 绘制空闲状态的柱状图
function drawIdleBars(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: ReturnType<typeof useSpectrumSettings>,
  chromaticSettings: ReturnType<typeof useChromaticSettings>
) {
  const { barCount, gap, borderRadius, position } = settings;
  const isVertical = position === 'left' || position === 'right';
  
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);

  if (position === 'circular') {
    drawCircularBars(ctx, width, height, new Uint8Array(barCount).fill(10), settings, chromaticSettings, 0);
    return;
  }

  const barWidth = isVertical
    ? height / barCount - gap
    : width / barCount - gap;

  // 色差效果：空闲时使用微小偏移，保持紧贴
  const chromaticEnabled = chromaticSettings.enabled && chromaticSettings.intensity > 0;
  const baseOffset = chromaticEnabled ? (chromaticSettings.intensity / 100) * 1 : 0;
  const { colors } = chromaticSettings;

  for (let i = 0; i < barCount; i++) {
    const barHeight = 3 + Math.sin(i * 0.3) * 2; // 微小波动

    if (isVertical) {
      const x = position === 'left' ? 0 : width - barHeight;
      const y = i * (barWidth + gap);
      
      if (chromaticEnabled && baseOffset > 0.5) {
        // 绘制RGB分离效果
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = colors.red;
        roundRect(ctx, x - baseOffset, y, barHeight, barWidth, borderRadius);
        ctx.fillStyle = colors.green;
        roundRect(ctx, x, y, barHeight, barWidth, borderRadius);
        ctx.fillStyle = colors.blue;
        roundRect(ctx, x + baseOffset, y, barHeight, barWidth, borderRadius);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.fillStyle = settings.barColor;
        roundRect(ctx, x, y, barHeight, barWidth, borderRadius);
      }
    } else {
      const x = i * (barWidth + gap);
      const y = height - barHeight;
      
      if (chromaticEnabled && baseOffset > 0.5) {
        // 绘制RGB分离效果
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = colors.red;
        roundRect(ctx, x - baseOffset, y, barWidth, barHeight, borderRadius);
        ctx.fillStyle = colors.green;
        roundRect(ctx, x, y, barWidth, barHeight, borderRadius);
        ctx.fillStyle = colors.blue;
        roundRect(ctx, x + baseOffset, y, barWidth, barHeight, borderRadius);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.fillStyle = settings.barColor;
        roundRect(ctx, x, y, barWidth, barHeight, borderRadius);
      }
    }
  }
}

// 绘制动态频谱柱状图（带色差效果）
function drawSpectrumBars(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frequencyData: Uint8Array,
  settings: ReturnType<typeof useSpectrumSettings>,
  chromaticSettings: ReturnType<typeof useChromaticSettings>
) {
  const { barCount, barColor, barGradient, sensitivity, gap, borderRadius, position, mirror } = settings;
  const isVertical = position === 'left' || position === 'right';

  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);

  // 获取低频能量用于色差偏移
  const bassEnergy = audioAnalyzerService.getBassEnergy();

  if (position === 'circular') {
    drawCircularBars(ctx, width, height, frequencyData, settings, chromaticSettings, bassEnergy);
    return;
  }

  // 采样频率数据
  const step = Math.floor(frequencyData.length / barCount);
  const sampledData: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const index = i * step;
    sampledData.push(frequencyData[index] || 0);
  }

  const barWidth = isVertical
    ? height / barCount - gap
    : width / barCount - gap;

  const maxBarHeight = isVertical ? width : height;
  const sensitivityFactor = sensitivity / 100;

  // 色差效果参数 - 偏移量要小，让三色紧贴形成撕裂效果
  const chromaticEnabled = chromaticSettings.enabled && chromaticSettings.intensity > 0;
  const normalizedBass = bassEnergy / 255;
  // 最大偏移 2-3 像素，让三色紧贴
  const maxOffset = (chromaticSettings.intensity / 100) * 3;
  const chromaticOffset = chromaticEnabled ? normalizedBass * maxOffset + 0.5 : 0;
  const { colors } = chromaticSettings;

  // 创建渐变（仅在非色差模式下使用）
  let gradient: CanvasGradient | null = null;
  if (!chromaticEnabled && barGradient && barGradient.length > 1) {
    gradient = isVertical
      ? ctx.createLinearGradient(0, 0, maxBarHeight, 0)
      : ctx.createLinearGradient(0, height, 0, 0);
    barGradient.forEach((color, i) => {
      gradient!.addColorStop(i / (barGradient.length - 1), color);
    });
  }

  for (let i = 0; i < barCount; i++) {
    const value = sampledData[mirror && i >= barCount / 2 ? barCount - 1 - i : i];
    const normalizedValue = (value / 255) * sensitivityFactor;
    const barHeight = Math.max(3, normalizedValue * maxBarHeight * 0.8);

    // 每个柱子的动态偏移（基于该柱子的振幅，但保持紧贴）
    const barAmplitude = value / 255;
    const dynamicOffset = chromaticEnabled ? chromaticOffset * (0.7 + barAmplitude * 0.3) : 0;

    if (isVertical) {
      const x = position === 'left' ? 0 : width - barHeight;
      const y = i * (barWidth + gap);
      
      if (chromaticEnabled && dynamicOffset > 0.5) {
        // RGB分离效果 - 使用 lighter 混合模式产生颜色叠加
        ctx.globalCompositeOperation = 'lighter';
        
        // 红色通道 - 向左偏移
        ctx.fillStyle = colors.red;
        roundRect(ctx, x - dynamicOffset, y - dynamicOffset * 0.3, barHeight, barWidth, borderRadius);
        
        // 白/绿色通道 - 中心
        ctx.fillStyle = colors.green;
        roundRect(ctx, x, y, barHeight, barWidth, borderRadius);
        
        // 蓝色通道 - 向右偏移
        ctx.fillStyle = colors.blue;
        roundRect(ctx, x + dynamicOffset, y + dynamicOffset * 0.3, barHeight, barWidth, borderRadius);
        
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.fillStyle = gradient || barColor;
        roundRect(ctx, x, y, barHeight, barWidth, borderRadius);
      }
    } else {
      const x = i * (barWidth + gap);
      const y = height - barHeight;
      
      if (chromaticEnabled && dynamicOffset > 0.5) {
        // RGB分离效果 - 水平方向的撕裂
        ctx.globalCompositeOperation = 'lighter';
        
        // 红色通道 - 向左偏移
        ctx.fillStyle = colors.red;
        roundRect(ctx, x - dynamicOffset, y, barWidth, barHeight, borderRadius);
        
        // 白/绿色通道 - 中心
        ctx.fillStyle = colors.green;
        roundRect(ctx, x, y, barWidth, barHeight, borderRadius);
        
        // 蓝色通道 - 向右偏移
        ctx.fillStyle = colors.blue;
        roundRect(ctx, x + dynamicOffset, y, barWidth, barHeight, borderRadius);
        
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.fillStyle = gradient || barColor;
        roundRect(ctx, x, y, barWidth, barHeight, borderRadius);
      }
    }
  }
}


// 绘制环绕式频谱（带色差效果）
function drawCircularBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frequencyData: Uint8Array,
  settings: ReturnType<typeof useSpectrumSettings>,
  chromaticSettings: ReturnType<typeof useChromaticSettings>,
  bassEnergy: number
) {
  const { barCount, barColor, barGradient, sensitivity } = settings;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  const maxBarLength = Math.min(width, height) * 0.15;

  // 采样频率数据
  const step = Math.floor(frequencyData.length / barCount);
  const sampledData: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const index = i * step;
    sampledData.push(frequencyData[index] || 0);
  }

  const sensitivityFactor = sensitivity / 100;

  // 色差效果参数 - 环绕模式使用角度偏移，保持紧贴
  const chromaticEnabled = chromaticSettings.enabled && chromaticSettings.intensity > 0;
  const normalizedBass = bassEnergy / 255;
  // 角度偏移很小，让三色紧贴
  const maxAngleOffset = (chromaticSettings.intensity / 100) * 0.015;
  const chromaticAngleOffset = chromaticEnabled ? normalizedBass * maxAngleOffset + 0.002 : 0;
  const { colors } = chromaticSettings;

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const value = sampledData[i];
    const normalizedValue = (value / 255) * sensitivityFactor;
    const barLength = Math.max(5, normalizedValue * maxBarLength);

    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barLength);
    const y2 = centerY + Math.sin(angle) * (radius + barLength);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (chromaticEnabled && chromaticAngleOffset > 0.001) {
      // RGB分离效果 - 微小角度偏移，三色紧贴
      ctx.globalCompositeOperation = 'lighter';
      
      // 红色通道 - 逆时针微小偏移
      const angleR = angle - chromaticAngleOffset;
      ctx.strokeStyle = colors.red;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angleR) * radius, centerY + Math.sin(angleR) * radius);
      ctx.lineTo(centerX + Math.cos(angleR) * (radius + barLength), centerY + Math.sin(angleR) * (radius + barLength));
      ctx.stroke();
      
      // 白/绿色通道 - 中心
      ctx.strokeStyle = colors.green;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // 蓝色通道 - 顺时针微小偏移
      const angleB = angle + chromaticAngleOffset;
      ctx.strokeStyle = colors.blue;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angleB) * radius, centerY + Math.sin(angleB) * radius);
      ctx.lineTo(centerX + Math.cos(angleB) * (radius + barLength), centerY + Math.sin(angleB) * (radius + barLength));
      ctx.stroke();
      
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // 渐变色
      if (barGradient && barGradient.length > 1) {
        const colorIndex = Math.floor((i / barCount) * (barGradient.length - 1));
        ctx.strokeStyle = barGradient[colorIndex];
      } else {
        ctx.strokeStyle = barColor;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

// 绘制圆角矩形
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
