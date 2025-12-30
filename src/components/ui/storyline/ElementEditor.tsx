import { useRef, useState, useCallback, useEffect } from 'react';
import { useStorylineStore } from '@/stores/storylineStore';
import { useAppStore } from '@/stores/appStore';
import type { SlideElement, SlideImageElement, SlideParticleTextElement, EntranceAnimation, ColorTheme, ImageFrameStyle } from '@/types';

interface ElementEditorProps {
  month: number;
  element: SlideElement;
  onClose: () => void;
}

const ENTRANCE_ANIMATIONS: { value: EntranceAnimation; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡入' },
  { value: 'slide_up', label: '上滑' },
  { value: 'slide_down', label: '下滑' },
  { value: 'zoom_in', label: '放大' },
  { value: 'bounce', label: '弹跳' },
];

const COLOR_THEMES: { value: ColorTheme; label: string }[] = [
  { value: 'golden', label: '金色' },
  { value: 'classic-green', label: '经典绿' },
  { value: 'ice-blue', label: '冰雪蓝' },
  { value: 'romantic-pink', label: '浪漫粉' },
  { value: 'rainbow', label: '彩虹' },
];

// 预设位置
const PRESET_POSITIONS: { label: string; position: [number, number, number] }[] = [
  { label: '中心', position: [0, 0, 0] },
  { label: '左上', position: [-2, 1.5, 0] },
  { label: '右上', position: [2, 1.5, 0] },
  { label: '左下', position: [-2, -1.5, 0] },
  { label: '右下', position: [2, -1.5, 0] },
  { label: '顶部', position: [0, 2, 0] },
  { label: '底部', position: [0, -2, 0] },
  { label: '左侧', position: [-3, 0, 0] },
  { label: '右侧', position: [3, 0, 0] },
];

/** 图片尺寸状态接口 */
interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  loaded: boolean;
}

/** 默认图片尺寸（4:3 比例） */
const DEFAULT_IMAGE_DIMENSIONS: ImageDimensions = {
  width: 400,
  height: 300,
  aspectRatio: 4 / 3,
  loaded: false,
};

/** 可视化位置和大小选择器 */
function PositionPicker({ 
  position, 
  scale,
  onChange,
  onScaleChange,
  elementType,
  imageUrl,
  text,
}: { 
  position: [number, number, number];
  scale: number;
  onChange: (pos: [number, number, number]) => void;
  onScaleChange: (scale: number) => void;
  elementType: 'image' | 'particle_text' | 'decoration';
  imageUrl?: string;
  text?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [localPos, setLocalPos] = useState({ left: 50, top: 50 });
  
  // 图片尺寸状态 - 用于保持原始比例
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>(DEFAULT_IMAGE_DIMENSIONS);
  
  // 加载图片获取原始尺寸
  useEffect(() => {
    if (elementType !== 'image' || !imageUrl) {
      setImageDimensions(DEFAULT_IMAGE_DIMENSIONS);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      setImageDimensions({
        width: img.width,
        height: img.height,
        aspectRatio,
        loaded: true,
      });
    };
    img.onerror = () => {
      console.warn('[PositionPicker] 图片加载失败，使用默认比例');
      setImageDimensions(DEFAULT_IMAGE_DIMENSIONS);
    };
    img.src = imageUrl;
  }, [imageUrl, elementType]);
  
  // 3D坐标范围映射到2D预览区域
  const xRange = 4;
  const yRange = 3;
  
  const posToPercent = useCallback((x: number, y: number) => ({
    left: ((x + xRange) / (xRange * 2)) * 100,
    top: ((yRange - y) / (yRange * 2)) * 100,
  }), []);
  
  const percentToPos = useCallback((leftPercent: number, topPercent: number): [number, number, number] => {
    const x = (leftPercent / 100) * (xRange * 2) - xRange;
    const y = yRange - (topPercent / 100) * (yRange * 2);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10, 0];
  }, []);
  
  // 同步外部位置到本地状态
  useEffect(() => {
    if (!isDraggingRef.current) {
      const { left, top } = posToPercent(position[0], position[1]);
      setLocalPos({ left, top });
    }
  }, [position, posToPercent]);
  
  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const leftPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const topPercent = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    setLocalPos({ left: leftPercent, top: topPercent });
    onChange(percentToPos(leftPercent, topPercent));
  }, [onChange, percentToPos]);
  
  // 使用全局事件监听实现流畅拖动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      e.preventDefault();
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };
    
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [updatePosition]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
  }, []);
  
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // 只有点击容器本身（不是拖动元素）时才更新位置
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('grid-overlay')) {
      updatePosition(e.clientX, e.clientY);
    }
  }, [updatePosition]);
  
  // 计算预览中的元素大小（基于缩放值和图片原始比例）
  const baseSize = 50;
  const previewWidth = baseSize * scale;
  // 使用图片原始比例计算高度，而非固定 4:3
  const previewHeight = previewWidth / imageDimensions.aspectRatio;
  
  return (
    <div className="space-y-3">
      <label className="block text-xs text-white/60">点击或拖动设置位置，滑动调整大小</label>
      
      {/* 可视化预览区域 */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden cursor-crosshair select-none"
        onClick={handleContainerClick}
      >
        {/* 网格线 */}
        <div className="grid-overlay absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/5" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/5" />
          <div className="absolute top-1/4 left-0 right-0 h-px bg-white/5" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-white/5" />
        </div>
        
        {/* 标题区域指示 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/30 pointer-events-none">
          标题区域
        </div>
        
        {/* 元素预览 - 可拖动，大小随缩放变化，图片使用原始比例 */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${localPos.left}%`, top: `${localPos.top}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {elementType === 'image' && imageUrl ? (
            <div 
              className="rounded border-2 border-blue-500 shadow-lg overflow-hidden bg-white/10 pointer-events-none transition-all duration-150"
              style={{ 
                width: previewWidth, 
                height: previewHeight, // 使用原始比例计算的高度
              }}
            >
              <img src={imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
          ) : elementType === 'image' ? (
            <div 
              className="rounded border-2 border-blue-500 border-dashed flex items-center justify-center bg-white/5 pointer-events-none transition-all duration-150"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <span className="text-[10px] text-white/40">图片</span>
            </div>
          ) : (
            <div 
              className="px-2 py-1 rounded border-2 border-blue-500 bg-white/10 pointer-events-none transition-all duration-150"
              style={{ transform: `scale(${Math.max(0.5, Math.min(2, scale))})` }}
            >
              <span className="text-xs text-white font-medium whitespace-nowrap">{text || '文字'}</span>
            </div>
          )}
        </div>
        
        {/* 坐标和缩放显示 */}
        <div className="absolute bottom-1 right-1 text-[10px] text-white/40 bg-black/30 px-1 rounded pointer-events-none">
          X: {position[0].toFixed(1)}, Y: {position[1].toFixed(1)}, 缩放: {scale.toFixed(1)}x
          {elementType === 'image' && imageDimensions.loaded && (
            <span className="ml-1">({imageDimensions.width}×{imageDimensions.height})</span>
          )}
        </div>
      </div>
      
      {/* 缩放滑块 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/60">元素大小</label>
          <span className="text-xs text-white/40">{scale.toFixed(1)}x</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onScaleChange(Math.max(0.2, scale - 0.1))}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
          >
            -
          </button>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.1}
            value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <button
            onClick={() => onScaleChange(Math.min(3, scale + 0.1))}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
          >
            +
          </button>
        </div>
        {/* 预设大小快捷按钮 */}
        <div className="flex gap-1">
          {[0.5, 1, 1.5, 2, 2.5].map((s) => (
            <button
              key={s}
              onClick={() => onScaleChange(s)}
              className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                Math.abs(scale - s) < 0.05
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      
      {/* 预设位置快捷按钮 */}
      <div>
        <label className="block text-xs text-white/60 mb-1">快捷位置</label>
        <div className="flex flex-wrap gap-1">
          {PRESET_POSITIONS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange(preset.position)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                position[0] === preset.position[0] && position[1] === preset.position[1]
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 元素编辑器组件 */
export default function ElementEditor({ month, element, onClose }: ElementEditorProps) {
  const { updateElement } = useStorylineStore();
  const photos = useAppStore((state) => state.photos);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  
  const handleUpdate = (updates: Partial<SlideElement>) => {
    updateElement(month, element.id, updates);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdate({ imageUrl: dataUrl } as Partial<SlideImageElement>);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSelectPhoto = (photoUrl: string) => {
    handleUpdate({ imageUrl: photoUrl } as Partial<SlideImageElement>);
    setShowPhotoSelector(false);
  };
  
  const handlePositionChange = (pos: [number, number, number]) => {
    handleUpdate({ position: pos });
  };
  
  const position = (element.position || [0, 0, 0]) as [number, number, number];
  
  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">编辑元素</h4>
        <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
          完成
        </button>
      </div>
      
      {/* 可视化位置和大小选择器 */}
      <PositionPicker
        position={position}
        scale={element.scale || 1}
        onChange={handlePositionChange}
        onScaleChange={(s) => handleUpdate({ scale: s })}
        elementType={element.type}
        imageUrl={element.type === 'image' ? (element as SlideImageElement).imageUrl : undefined}
        text={element.type === 'particle_text' ? (element as SlideParticleTextElement).text : undefined}
      />
      
      {/* 动画设置 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">入场动画</label>
          <select
            value={element.entranceAnimation || 'none'}
            onChange={(e) => handleUpdate({ entranceAnimation: e.target.value as EntranceAnimation })}
            className="w-full bg-white/10 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
          >
            {ENTRANCE_ANIMATIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">延迟(ms)</label>
          <input
            type="number"
            value={element.entranceDelay || 0}
            onChange={(e) => handleUpdate({ entranceDelay: Number(e.target.value) })}
            className="w-full bg-white/10 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            step={100}
            min={0}
            max={5000}
          />
        </div>
      </div>
      
      {/* 图片特有属性 */}
      {element.type === 'image' && (
        <>
          <div>
            <label className="block text-xs text-white/60 mb-1">图片</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                上传新图片
              </button>
              {photos.length > 0 && (
                <button
                  onClick={() => setShowPhotoSelector(!showPhotoSelector)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  从相册选择
                </button>
              )}
            </div>
            
            {/* 已上传照片选择器 */}
            {showPhotoSelector && photos.length > 0 && (
              <div className="mt-2 p-2 bg-white/5 rounded-lg">
                <div className="text-xs text-white/60 mb-2">选择已上传的照片：</div>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectPhoto(photo.url)}
                      className="aspect-square rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img
                        src={photo.url}
                        alt="照片"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">边框样式</label>
            <select
              value={(element as SlideImageElement).frameStyle || 'none'}
              onChange={(e) => handleUpdate({ frameStyle: e.target.value as ImageFrameStyle } as Partial<SlideImageElement>)}
              className="w-full bg-white/10 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
            >
              <option value="none">无边框</option>
              <option value="polaroid">拍立得</option>
              <option value="rounded">圆角</option>
              <option value="shadow">阴影</option>
            </select>
          </div>
        </>
      )}
      
      {/* 粒子文字特有属性 */}
      {element.type === 'particle_text' && (
        <>
          <div>
            <label className="block text-xs text-white/60 mb-1">文字内容</label>
            <input
              type="text"
              value={(element as SlideParticleTextElement).text}
              onChange={(e) => handleUpdate({ text: e.target.value } as Partial<SlideParticleTextElement>)}
              className="w-full bg-white/10 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">颜色主题</label>
              <select
                value={(element as SlideParticleTextElement).colorTheme || 'golden'}
                onChange={(e) => handleUpdate({ colorTheme: e.target.value as ColorTheme } as Partial<SlideParticleTextElement>)}
                className="w-full bg-white/10 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
              >
                {COLOR_THEMES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">粒子数量</label>
              <input
                type="number"
                value={(element as SlideParticleTextElement).particleCount || 2000}
                onChange={(e) => handleUpdate({ particleCount: Number(e.target.value) } as Partial<SlideParticleTextElement>)}
                className="w-full bg-white/10 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                step={500}
                min={500}
                max={10000}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
