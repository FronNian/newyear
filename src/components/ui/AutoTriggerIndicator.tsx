import { useState } from 'react';
import { Clock } from 'lucide-react';

interface AutoTriggerIndicatorProps {
  isEnabled: boolean;
  timezoneName: string;
  timezoneOffset: string;
  targetTime: Date;
}

/**
 * 自动触发状态指示器
 * 显示在倒计时区域，表示自动触发已启用
 */
export default function AutoTriggerIndicator({
  isEnabled,
  timezoneName,
  timezoneOffset,
  targetTime,
}: AutoTriggerIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!isEnabled) return null;
  
  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
        className="
          p-1.5 rounded-full
          bg-green-500/20 text-green-400
          hover:bg-green-500/30
          transition-colors
          flex items-center gap-1
        "
        title="自动触发已启用"
      >
        <Clock className="w-4 h-4" />
        <span className="text-xs font-medium">自动</span>
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-3 py-2 rounded-lg
            bg-gray-900/95 border border-gray-700
            text-xs text-white
            whitespace-nowrap
            z-50
            shadow-lg
          "
        >
          <div className="font-medium mb-1">自动触发已启用</div>
          <div className="text-gray-400">
            时区: {timezoneName} {timezoneOffset && `(${timezoneOffset})`}
          </div>
          <div className="text-gray-400">
            目标: {targetTime.toLocaleString()}
          </div>
          {/* 小三角 */}
          <div
            className="
              absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent border-t-gray-900
            "
          />
        </div>
      )}
    </div>
  );
}
