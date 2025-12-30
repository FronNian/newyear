/**
 * 可视化设置面板组件
 * 包含频谱和色差效果的所有设置
 */
import { useAppStore, useVisualizerSettings } from '@/stores/appStore';
import { SPECTRUM_POSITION_NAMES, CHROMATIC_TARGET_NAMES, OFFSET_DIRECTION_NAMES } from '@/types';
import type { SpectrumPosition, ChromaticTarget, OffsetDirection } from '@/types';
import ColorPicker from './ColorPicker';
import { BarChart3, Eye, EyeOff, Music } from 'lucide-react';

export default function VisualizerSettings() {
  const settings = useVisualizerSettings();
  const setVisualizerEnabled = useAppStore((s) => s.setVisualizerEnabled);
  const setSpectrumSettings = useAppStore((s) => s.setSpectrumSettings);
  const setChromaticSettings = useAppStore((s) => s.setChromaticSettings);

  return (
    <div className="space-y-4">
      {/* 总开关 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-green-400" />
          <span className="text-sm text-white">音频可视化</span>
        </div>
        <button
          onClick={() => setVisualizerEnabled(!settings.enabled)}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-green-500' : 'bg-gray-600'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* 频谱设置 */}
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wide">频谱柱状图</span>
              <button
                onClick={() => setSpectrumSettings({ enabled: !settings.spectrum.enabled })}
                className="text-gray-400 hover:text-white"
              >
                {settings.spectrum.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {settings.spectrum.enabled && (
              <>
                {/* 位置选择 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">位置</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(Object.keys(SPECTRUM_POSITION_NAMES) as SpectrumPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setSpectrumSettings({ position: pos })}
                        className={`px-2 py-1.5 text-xs rounded transition-colors ${
                          settings.spectrum.position === pos
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {SPECTRUM_POSITION_NAMES[pos]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 灵敏度 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    灵敏度: {settings.spectrum.sensitivity}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.spectrum.sensitivity}
                    onChange={(e) => setSpectrumSettings({ sensitivity: Number(e.target.value) })}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 柱状条数量 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    柱状条数量: {settings.spectrum.barCount}
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="64"
                    step="8"
                    value={settings.spectrum.barCount}
                    onChange={(e) => setSpectrumSettings({ barCount: Number(e.target.value) })}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 颜色 */}
                <ColorPicker
                  label="主颜色"
                  value={settings.spectrum.barColor}
                  onChange={(color) => setSpectrumSettings({ barColor: color })}
                />
              </>
            )}
          </div>

          {/* 色差效果设置 */}
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wide">色差效果</span>
              <button
                onClick={() => setChromaticSettings({ enabled: !settings.chromatic.enabled })}
                className="text-gray-400 hover:text-white"
              >
                {settings.chromatic.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {settings.chromatic.enabled && (
              <>
                {/* 应用范围 + 强度 - 同一行 */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {(Object.keys(CHROMATIC_TARGET_NAMES) as ChromaticTarget[]).map((target) => (
                      <button
                        key={target}
                        onClick={() => setChromaticSettings({ target })}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          settings.chromatic.target === target
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {CHROMATIC_TARGET_NAMES[target]}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.chromatic.intensity}
                      onChange={(e) => setChromaticSettings({ intensity: Number(e.target.value) })}
                      className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-8">{settings.chromatic.intensity}%</span>
                  </div>
                </div>

                {/* 偏移方向 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-12">方向</span>
                  <div className="flex gap-1 flex-1">
                    {(Object.keys(OFFSET_DIRECTION_NAMES) as OffsetDirection[]).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setChromaticSettings({ direction: dir })}
                        className={`flex-1 px-1 py-1 text-xs rounded transition-colors ${
                          settings.chromatic.direction === dir
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {OFFSET_DIRECTION_NAMES[dir]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 音频同步 - 紧凑布局 */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Music className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-gray-500">音频</span>
                  </div>
                  <button
                    onClick={() => setChromaticSettings({ 
                      audioSync: { 
                        ...settings.chromatic.audioSync, 
                        enabled: !settings.chromatic.audioSync.enabled 
                      } 
                    })}
                    className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
                      settings.chromatic.audioSync.enabled ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full transition-transform ${
                        settings.chromatic.audioSync.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  {settings.chromatic.audioSync.enabled && (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.chromatic.audioSync.sensitivity}
                        onChange={(e) => setChromaticSettings({ 
                          audioSync: { 
                            ...settings.chromatic.audioSync, 
                            sensitivity: Number(e.target.value) 
                          } 
                        })}
                        className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-400 w-8">{settings.chromatic.audioSync.sensitivity}%</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
