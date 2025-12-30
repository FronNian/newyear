/**
 * 颜色选择器组件 - 移动端友好
 * 支持预设颜色和自定义颜色
 */
import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  label?: string;
}

// 默认预设颜色
const DEFAULT_PRESETS = [
  '#ff0040', '#ff4500', '#ff8c00', '#ffd700',
  '#00ff88', '#00ccff', '#0080ff', '#8000ff',
  '#ff00ff', '#ff69b4', '#ffffff', '#808080',
];

export default function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  label,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 同步外部值
  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs text-gray-400 mb-1">{label}</label>
      )}
      
      {/* 当前颜色按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors flex items-center gap-2 px-2"
        style={{ backgroundColor: value + '20' }}
      >
        <div
          className="w-6 h-6 rounded-md border border-white/20"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm text-gray-300 font-mono flex-1 text-left">
          {value.toUpperCase()}
        </span>
      </button>

      {/* 颜色选择面板 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-gray-800 rounded-xl shadow-xl border border-gray-700 w-64">
          {/* 预设颜色网格 */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {presets.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center"
                style={{
                  backgroundColor: color,
                  borderColor: value === color ? '#fff' : 'transparent',
                }}
              >
                {value === color && (
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>

          {/* 自定义颜色输入 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="color"
                value={customColor}
                onChange={handleCustomChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div
                className="w-full h-10 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <span className="text-xs text-gray-400">自定义颜色</span>
              </div>
            </div>
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setCustomColor(val);
                  if (val.length === 7) onChange(val);
                }
              }}
              className="w-20 h-10 bg-gray-700 rounded-lg px-2 text-sm text-white font-mono text-center border border-gray-600 focus:border-blue-500 outline-none"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}
