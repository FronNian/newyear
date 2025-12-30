import { useCallback, useMemo, useRef, useState } from 'react';
import { MONTH_NAMES } from '@/types';

interface TimelineSliderControllerProps {
  configuredMonths: number[];
  currentIndex: number;
  isPlaying: boolean;
  onNavigate: (index: number) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

// 四季颜色配置
const SEASON_COLORS = {
  spring: { start: '#22c55e', end: '#86efac' },  // 春天 - 绿色
  summer: { start: '#f97316', end: '#fbbf24' },  // 夏天 - 橙红色
  autumn: { start: '#eab308', end: '#fde047' },  // 秋天 - 黄色
  winter: { start: '#3b82f6', end: '#93c5fd' },  // 冬天 - 蓝色
};

// 根据月份获取季节
function getSeasonFromMonth(month: number): keyof typeof SEASON_COLORS {
  if (month >= 2 && month <= 4) return 'spring';   // 3-5月 春天
  if (month >= 5 && month <= 7) return 'summer';   // 6-8月 夏天
  if (month >= 8 && month <= 10) return 'autumn';  // 9-11月 秋天
  return 'winter';                                  // 12-2月 冬天
}

// 根据当前月份获取渐变色
function getGradientForMonth(month: number): string {
  const season = getSeasonFromMonth(month);
  const colors = SEASON_COLORS[season];
  return `linear-gradient(90deg, ${colors.start}, ${colors.end})`;
}

// 获取当前季节的主色
function getSeasonMainColor(month: number): string {
  const season = getSeasonFromMonth(month);
  return SEASON_COLORS[season].start;
}

// 获取月份节点的颜色
function getMonthDotColor(month: number, isActive: boolean): string {
  if (!isActive) return '#4b5563'; // gray-600
  const season = getSeasonFromMonth(month);
  return SEASON_COLORS[season].start;
}

export default function TimelineSliderController({
  configuredMonths,
  currentIndex,
  isPlaying,
  onNavigate,
  onTogglePlay,
  onPrev,
  onNext,
  onExit,
}: TimelineSliderControllerProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 当前月份
  const currentMonth = configuredMonths[currentIndex] ?? 0;
  
  // 当前季节主色
  const mainColor = useMemo(() => getSeasonMainColor(currentMonth), [currentMonth]);
  
  // 进度条渐变
  const progressGradient = useMemo(() => getGradientForMonth(currentMonth), [currentMonth]);
  
  // 计算滑块位置百分比
  const sliderPosition = useMemo(() => {
    if (configuredMonths.length <= 1) return 50;
    return (currentIndex / (configuredMonths.length - 1)) * 100;
  }, [currentIndex, configuredMonths.length]);
  
  // 处理滑块点击
  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current || configuredMonths.length <= 1) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const index = Math.round(percentage * (configuredMonths.length - 1));
    const clampedIndex = Math.max(0, Math.min(configuredMonths.length - 1, index));
    
    onNavigate(clampedIndex);
  }, [configuredMonths.length, onNavigate]);
  
  // 处理拖动开始
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  // 处理拖动
  const handleDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !sliderRef.current || configuredMonths.length <= 1) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percentage * (configuredMonths.length - 1));
    
    onNavigate(index);
  }, [isDragging, configuredMonths.length, onNavigate]);
  
  // 处理拖动结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // 如果没有配置月份，不显示
  if (configuredMonths.length === 0) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 to-transparent pb-6 pt-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 月份标记 */}
        <div className="flex justify-between mb-2 px-2">
          {configuredMonths.map((monthIndex, idx) => {
            const isActive = idx === currentIndex;
            const dotColor = getMonthDotColor(monthIndex, isActive);
            
            return (
              <button
                key={monthIndex}
                onClick={() => onNavigate(idx)}
                className={`
                  flex flex-col items-center transition-all duration-300
                  ${isActive 
                    ? 'text-white scale-110' 
                    : 'text-gray-400 hover:text-gray-200'
                  }
                `}
              >
                <div 
                  className="w-3 h-3 rounded-full mb-1 transition-all duration-300"
                  style={{
                    backgroundColor: dotColor,
                    boxShadow: isActive ? `0 0 12px ${dotColor}` : 'none',
                  }}
                />
                <span className="text-xs whitespace-nowrap">
                  {MONTH_NAMES[monthIndex]}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* 滑块轨道 */}
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-700/80 rounded-full cursor-pointer mx-2 backdrop-blur-sm"
          onClick={handleSliderClick}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
        >
          {/* 进度条 - 四季渐变 */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${sliderPosition}%`,
              background: progressGradient,
            }}
          />
          
          {/* 滑块手柄 */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg
              cursor-grab transition-all duration-200 border-2 border-white
              ${isDragging ? 'scale-125 cursor-grabbing' : 'hover:scale-110'}
            `}
            style={{ 
              left: `calc(${sliderPosition}% - 10px)`,
              backgroundColor: mainColor,
              boxShadow: `0 0 12px ${mainColor}`,
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          />
        </div>
        
        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {/* 退出按钮 */}
          <button
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="退出故事线"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* 上一个 */}
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className={`
              p-3 rounded-full transition-all duration-200
              ${currentIndex === 0 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-white hover:bg-white/10'
              }
            `}
            title="上一个月份"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 播放/暂停 - 四季主题色 */}
          <button
            onClick={onTogglePlay}
            className="relative p-4 rounded-full text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${mainColor}, ${mainColor}dd)`,
              boxShadow: `0 4px 20px ${mainColor}50`,
            }}
            title={isPlaying ? '暂停' : '播放'}
          >
            {/* 外圈光晕 */}
            <div 
              className="absolute inset-0 rounded-full animate-pulse opacity-50"
              style={{
                background: `radial-gradient(circle, ${mainColor}40 0%, transparent 70%)`,
              }}
            />
            
            {isPlaying ? (
              <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-8 h-8 relative z-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>
          
          {/* 下一个 */}
          <button
            onClick={onNext}
            disabled={currentIndex === configuredMonths.length - 1}
            className={`
              p-3 rounded-full transition-all duration-200
              ${currentIndex === configuredMonths.length - 1 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-white hover:bg-white/10'
              }
            `}
            title="下一个月份"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* 进度指示 - 带季节色 */}
          <div 
            className="text-sm ml-2 px-3 py-1 rounded-full"
            style={{
              backgroundColor: `${mainColor}20`,
              color: mainColor,
            }}
          >
            {currentIndex + 1} / {configuredMonths.length}
          </div>
        </div>
      </div>
    </div>
  );
}
