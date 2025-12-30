import { useState } from 'react';
import { useAppStore, usePhotoWallSettings } from '@/stores/appStore';
import {
  PHOTO_WALL_SHAPE_NAMES,
  SCROLL_DIRECTION_NAMES,
  PHOTO_WALL_DISPLAY_MODE_NAMES,
  PHOTO_WALL_BACKGROUND_MODE_NAMES,
  WALL_TEXT_POSITION_NAMES,
  PHOTO_WALL_SETTINGS_RANGES,
} from '@/types';
import type { PhotoWallShape, ScrollDirection, PhotoWallDisplayMode, PhotoWallBackgroundMode, WallTextPosition } from '@/types';
import PhotoSelector from './PhotoSelector';

interface PhotoWallSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'layout' | 'scroll' | 'visual' | 'display' | 'text';

export default function PhotoWallSettingsPanel({ isOpen, onClose }: PhotoWallSettingsPanelProps) {
  const settings = usePhotoWallSettings();
  const updateSettings = useAppStore((state) => state.updatePhotoWallSettings);
  const updateTextSettings = useAppStore((state) => state.updateWallTextSettings);
  const resetSettings = useAppStore((state) => state.resetPhotoWallSettings);
  const setWallPhotoSelection = useAppStore((state) => state.setWallPhotoSelection);
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('layout');
  
  if (!isOpen) return null;
  
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'layout', label: '布局' },
    { id: 'scroll', label: '滚动' },
    { id: 'visual', label: '视觉' },
    { id: 'display', label: '显示' },
    { id: 'text', label: '文字' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-gray-900/95 rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">🖼️ 照片墙设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* 启用开关 */}
        <div className="px-4 py-3 border-b border-gray-700">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white">启用照片墙</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSettings({ enabled: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </div>
          </label>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b border-gray-700 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'layout' && (
            <LayoutSettings settings={settings} updateSettings={updateSettings} setWallPhotoSelection={setWallPhotoSelection} />
          )}
          {activeTab === 'scroll' && (
            <ScrollSettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'visual' && (
            <VisualSettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'display' && (
            <DisplaySettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'text' && (
            <TextSettings settings={settings} updateTextSettings={updateTextSettings} />
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            重置默认
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}


// 布局设置
function LayoutSettings({ settings, updateSettings, setWallPhotoSelection }: any) {
  return (
    <div className="space-y-4">
      {/* 照片选择 */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">选择照片</h3>
        <PhotoSelector
          selectedIds={settings.selectedPhotoIds}
          onSelectionChange={setWallPhotoSelection}
        />
      </div>
      
      {/* 列数 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>列数</span>
          <span className="text-gray-500">{settings.columns}</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.columns.min}
          max={PHOTO_WALL_SETTINGS_RANGES.columns.max}
          value={settings.columns}
          onChange={(e) => updateSettings({ columns: parseInt(e.target.value) })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 行数 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>行数</span>
          <span className="text-gray-500">{settings.rows}</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.rows.min}
          max={PHOTO_WALL_SETTINGS_RANGES.rows.max}
          value={settings.rows}
          onChange={(e) => updateSettings({ rows: parseInt(e.target.value) })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 间距 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>间距</span>
          <span className="text-gray-500">{settings.gap}px</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.gap.min}
          max={PHOTO_WALL_SETTINGS_RANGES.gap.max}
          value={settings.gap}
          onChange={(e) => updateSettings({ gap: parseInt(e.target.value) })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 照片大小 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>照片大小</span>
          <span className="text-gray-500">{settings.photoScale.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.photoScale.min * 10}
          max={PHOTO_WALL_SETTINGS_RANGES.photoScale.max * 10}
          value={settings.photoScale * 10}
          onChange={(e) => updateSettings({ photoScale: parseInt(e.target.value) / 10 })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 照片形状 */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block">照片形状</label>
        <div className="flex gap-2">
          {(Object.keys(PHOTO_WALL_SHAPE_NAMES) as PhotoWallShape[]).map((shape) => (
            <button
              key={shape}
              onClick={() => updateSettings({ photoShape: shape })}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                settings.photoShape === shape
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {PHOTO_WALL_SHAPE_NAMES[shape]}
            </button>
          ))}
        </div>
      </div>
      
      {/* 圆角（仅圆角矩形） */}
      {settings.photoShape === 'rounded' && (
        <div>
          <label className="text-sm text-gray-300 flex justify-between">
            <span>圆角大小</span>
            <span className="text-gray-500">{settings.borderRadius}%</span>
          </label>
          <input
            type="range"
            min={PHOTO_WALL_SETTINGS_RANGES.borderRadius.min}
            max={PHOTO_WALL_SETTINGS_RANGES.borderRadius.max}
            value={settings.borderRadius}
            onChange={(e) => updateSettings({ borderRadius: parseInt(e.target.value) })}
            className="w-full mt-1"
          />
        </div>
      )}
    </div>
  );
}

// 滚动设置
function ScrollSettings({ settings, updateSettings }: any) {
  return (
    <div className="space-y-4">
      {/* 滚动速度 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>滚动速度</span>
          <span className="text-gray-500">{settings.scrollSpeed === 0 ? '静止' : settings.scrollSpeed}</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.scrollSpeed.min}
          max={PHOTO_WALL_SETTINGS_RANGES.scrollSpeed.max}
          value={settings.scrollSpeed}
          onChange={(e) => updateSettings({ scrollSpeed: parseInt(e.target.value) })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 滚动方向 */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block">滚动方向</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SCROLL_DIRECTION_NAMES) as ScrollDirection[]).map((dir) => (
            <button
              key={dir}
              onClick={() => updateSettings({ scrollDirection: dir })}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                settings.scrollDirection === dir
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {SCROLL_DIRECTION_NAMES[dir]}
            </button>
          ))}
        </div>
      </div>
      
      {/* 暂停滚动 */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-gray-300">暂停滚动</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={settings.scrollPaused}
            onChange={(e) => updateSettings({ scrollPaused: e.target.checked })}
            className="sr-only"
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${
            settings.scrollPaused ? 'bg-blue-500' : 'bg-gray-600'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              settings.scrollPaused ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
        </div>
      </label>
    </div>
  );
}


// 视觉设置
function VisualSettings({ settings, updateSettings }: any) {
  return (
    <div className="space-y-4">
      {/* 透明度 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>透明度</span>
          <span className="text-gray-500">{settings.opacity}%</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.opacity.min}
          max={PHOTO_WALL_SETTINGS_RANGES.opacity.max}
          value={settings.opacity}
          onChange={(e) => updateSettings({ opacity: parseInt(e.target.value) })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 阴影 */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-gray-300">照片阴影</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={settings.shadowEnabled}
            onChange={(e) => updateSettings({ shadowEnabled: e.target.checked })}
            className="sr-only"
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${
            settings.shadowEnabled ? 'bg-blue-500' : 'bg-gray-600'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              settings.shadowEnabled ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
        </div>
      </label>
      
      {/* 背景颜色 */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block">背景颜色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={settings.backgroundColor}
            onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
          />
        </div>
      </div>
      
      {/* 模糊强度 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>模糊强度</span>
          <span className="text-gray-500">{settings.blurIntensity}px</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.blurIntensity.min}
          max={PHOTO_WALL_SETTINGS_RANGES.blurIntensity.max}
          value={settings.blurIntensity}
          onChange={(e) => updateSettings({ blurIntensity: parseInt(e.target.value) })}
          className="w-full mt-1"
        />
      </div>
      
      {/* 背景模式 */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block">与星空的关系</label>
        <div className="flex gap-2">
          {(Object.keys(PHOTO_WALL_BACKGROUND_MODE_NAMES) as PhotoWallBackgroundMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ backgroundMode: mode })}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                settings.backgroundMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {PHOTO_WALL_BACKGROUND_MODE_NAMES[mode]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 显示设置
function DisplaySettings({ settings, updateSettings }: any) {
  return (
    <div className="space-y-4">
      {/* 显示模式 */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block">显示时机</label>
        <div className="flex gap-2">
          {(Object.keys(PHOTO_WALL_DISPLAY_MODE_NAMES) as PhotoWallDisplayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ displayMode: mode })}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                settings.displayMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {PHOTO_WALL_DISPLAY_MODE_NAMES[mode]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {settings.displayMode === 'global' 
            ? '照片墙将始终显示' 
            : '照片墙仅在倒计时结束显示年份时出现'}
        </p>
      </div>
      
      {/* 淡入淡出时长 */}
      <div>
        <label className="text-sm text-gray-300 flex justify-between">
          <span>淡入淡出时长</span>
          <span className="text-gray-500">{settings.fadeDuration.toFixed(1)}秒</span>
        </label>
        <input
          type="range"
          min={PHOTO_WALL_SETTINGS_RANGES.fadeDuration.min * 10}
          max={PHOTO_WALL_SETTINGS_RANGES.fadeDuration.max * 10}
          value={settings.fadeDuration * 10}
          onChange={(e) => updateSettings({ fadeDuration: parseInt(e.target.value) / 10 })}
          className="w-full mt-1"
        />
      </div>
    </div>
  );
}

// 文字设置
function TextSettings({ settings, updateTextSettings }: any) {
  const textSettings = settings.text;
  
  return (
    <div className="space-y-4">
      {/* 启用文字 */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-gray-300">显示文字</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={textSettings.enabled}
            onChange={(e) => updateTextSettings({ enabled: e.target.checked })}
            className="sr-only"
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${
            textSettings.enabled ? 'bg-blue-500' : 'bg-gray-600'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              textSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
        </div>
      </label>
      
      {textSettings.enabled && (
        <>
          {/* 文字内容 */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              文字内容 ({textSettings.content.length}/{PHOTO_WALL_SETTINGS_RANGES.textContentMaxLength})
            </label>
            <input
              type="text"
              value={textSettings.content}
              onChange={(e) => {
                if (e.target.value.length <= PHOTO_WALL_SETTINGS_RANGES.textContentMaxLength) {
                  updateTextSettings({ content: e.target.value });
                }
              }}
              placeholder="输入要显示的文字..."
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
            />
          </div>
          
          {/* 文字位置 */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">文字位置</label>
            <div className="flex gap-2">
              {(Object.keys(WALL_TEXT_POSITION_NAMES) as WallTextPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateTextSettings({ position: pos })}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                    textSettings.position === pos
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {WALL_TEXT_POSITION_NAMES[pos]}
                </button>
              ))}
            </div>
          </div>
          
          {/* 字体大小 */}
          <div>
            <label className="text-sm text-gray-300 flex justify-between">
              <span>字体大小</span>
              <span className="text-gray-500">{textSettings.fontSize}px</span>
            </label>
            <input
              type="range"
              min={PHOTO_WALL_SETTINGS_RANGES.textFontSize.min}
              max={PHOTO_WALL_SETTINGS_RANGES.textFontSize.max}
              value={textSettings.fontSize}
              onChange={(e) => updateTextSettings({ fontSize: parseInt(e.target.value) })}
              className="w-full mt-1"
            />
          </div>
          
          {/* 文字颜色 */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">文字颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textSettings.color}
                onChange={(e) => updateTextSettings({ color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={textSettings.color}
                onChange={(e) => updateTextSettings({ color: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
              />
            </div>
          </div>
          
          {/* 发光效果 */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-300">发光效果</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={textSettings.glowEnabled}
                onChange={(e) => updateTextSettings({ glowEnabled: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                textSettings.glowEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  textSettings.glowEnabled ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
            </div>
          </label>
        </>
      )}
    </div>
  );
}
