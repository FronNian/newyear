import { useState } from 'react';
import { useStorylineStore } from '@/stores/storylineStore';
import { MONTH_NAMES, type TransitionType, TUNNEL_THEME_NAMES, type TunnelTheme } from '@/types';
import { isMonthConfigured } from '@/services/storylineService';
import { DEFAULT_SONGS } from '@/services/musicService';
import MonthEditor from './MonthEditor';
import TemplateSelector from './TemplateSelector';

interface StorylineEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditorTab = 'months' | 'templates' | 'settings' | 'tunnel';

/** 故事线编辑器主组件 */
export default function StorylineEditor({ isOpen, onClose }: StorylineEditorProps) {
  const {
    storyline,
    tunnelConfig,
    editingMonth,
    setEditingMonth,
    updateStorylineName,
    updateGlobalSettings,
    updateTunnelConfig,
    setMonthTunnelColor,
    enterStorylineMode,
    play,
    getConfiguredMonths,
    hasConfiguredMonths,
  } = useStorylineStore();
  
  const [activeTab, setActiveTab] = useState<EditorTab>('months');
  
  const configuredMonths = getConfiguredMonths();
  const hasConfig = hasConfiguredMonths();
  
  if (!isOpen) return null;
  
  const handlePreview = () => {
    if (!hasConfig) {
      alert('请至少配置一个月份的内容后再预览');
      return;
    }
    onClose();
    enterStorylineMode();
    play();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-[90vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">故事线编辑器</h2>
            <input
              type="text"
              value={storyline.name}
              onChange={(e) => updateStorylineName(e.target.value)}
              className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="故事线名称"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              预览播放
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'months', label: '月份编辑' },
            { id: 'tunnel', label: '隧道设置' },
            { id: 'templates', label: '模板' },
            { id: 'settings', label: '全局设置' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EditorTab)}
              className={`px-6 py-3 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'months' && (
            <div className="space-y-6">
              {/* 配置状态指示 */}
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">已配置月份:</span>
                  <span className="text-white font-medium">{configuredMonths.length} / 12</span>
                </div>
                {!hasConfig && (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>请至少配置一个月份</span>
                  </div>
                )}
              </div>
              
              {/* 月份网格 */}
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 12 }, (_, i) => {
                  const slide = storyline.slides[i];
                  const isConfigured = isMonthConfigured(slide);
                  return (
                    <button
                      key={i}
                      onClick={() => setEditingMonth(i)}
                      className={`p-4 rounded-xl text-left transition-all relative ${
                        editingMonth === i
                          ? 'bg-blue-600 ring-2 ring-blue-400'
                          : isConfigured
                            ? 'bg-white/10 hover:bg-white/15'
                            : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* 配置状态标记 */}
                      {isConfigured ? (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full" title="已配置" />
                      ) : (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-gray-500 rounded-full" title="将被跳过" />
                      )}
                      
                      <div className="text-xs text-white/60 mb-1">{MONTH_NAMES[i]}</div>
                      <div className="text-white font-medium truncate">
                        {slide.title || MONTH_NAMES[i]}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        {slide.elements.length} 个元素
                        {!isConfigured && slide.elements.length === 0 && (
                          <span className="text-yellow-400/60 ml-1">(将被跳过)</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* 月份详细编辑 */}
              {editingMonth !== null && (
                <MonthEditor
                  month={editingMonth}
                  onClose={() => setEditingMonth(null)}
                />
              )}
            </div>
          )}
          
          {activeTab === 'tunnel' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm text-white/60 mb-2">隧道主题</label>
                <select
                  value={tunnelConfig.theme}
                  onChange={(e) => updateTunnelConfig({ theme: e.target.value as TunnelTheme })}
                  className="w-full bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  {/* Fix: cast Object.entries to [string, string][] to avoid ReactNode error */}
                  {(Object.entries(TUNNEL_THEME_NAMES) as [string, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">全局隧道颜色</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tunnelConfig.colors.globalColor}
                    onChange={(e) => updateTunnelConfig({ 
                      colors: { ...tunnelConfig.colors, globalColor: e.target.value }
                    })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tunnelConfig.colors.globalColor}
                    onChange={(e) => updateTunnelConfig({ 
                      colors: { ...tunnelConfig.colors, globalColor: e.target.value }
                    })}
                    className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">墙体透明度</label>
                <input
                  type="range"
                  value={tunnelConfig.wallOpacity}
                  onChange={(e) => updateTunnelConfig({ wallOpacity: Number(e.target.value) })}
                  className="w-full"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                />
                <div className="text-xs text-white/40 mt-1">{(tunnelConfig.wallOpacity * 100).toFixed(0)}%</div>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">发光强度</label>
                <input
                  type="range"
                  value={tunnelConfig.glowIntensity}
                  onChange={(e) => updateTunnelConfig({ glowIntensity: Number(e.target.value) })}
                  className="w-full"
                  min={0}
                  max={2}
                  step={0.1}
                />
                <div className="text-xs text-white/40 mt-1">{tunnelConfig.glowIntensity.toFixed(1)}</div>
              </div>
              
              {/* 每月颜色配置 */}
              <div>
                <label className="block text-sm text-white/60 mb-3">每月自定义颜色</label>
                <div className="grid grid-cols-4 gap-2">
                  {configuredMonths.map((monthIndex) => (
                    <div key={monthIndex} className="flex flex-col items-center gap-1">
                      <input
                        type="color"
                        value={tunnelConfig.colors.monthColors[monthIndex] || tunnelConfig.colors.globalColor}
                        onChange={(e) => setMonthTunnelColor(monthIndex, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <span className="text-xs text-white/60">{MONTH_NAMES[monthIndex]}</span>
                    </div>
                  ))}
                </div>
                {configuredMonths.length === 0 && (
                  <div className="text-sm text-white/40">请先配置月份内容</div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'templates' && (
            <TemplateSelector onApply={() => setActiveTab('months')} />
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-6 max-md">
              <div>
                <label className="block text-sm text-white/60 mb-2">幻灯片时长 (毫秒)</label>
                <input
                  type="number"
                  value={storyline.globalSettings.slideDuration}
                  onChange={(e) => updateGlobalSettings({ slideDuration: Number(e.target.value) })}
                  className="w-full bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1000}
                  max={30000}
                  step={500}
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">过渡动画时长 (毫秒)</label>
                <input
                  type="number"
                  value={storyline.globalSettings.transitionDuration}
                  onChange={(e) => updateGlobalSettings({ transitionDuration: Number(e.target.value) })}
                  className="w-full bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={200}
                  max={3000}
                  step={100}
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">过渡效果</label>
                <select
                  value={storyline.globalSettings.transitionType}
                  onChange={(e) => updateGlobalSettings({ transitionType: e.target.value as TransitionType })}
                  className="w-full bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value="fade">淡入淡出</option>
                  <option value="slide_left">向左滑动</option>
                  <option value="slide_right">向右滑动</option>
                  <option value="zoom">缩放</option>
                  <option value="flip">翻转</option>
                  <option value="dissolve">溶解</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoLoop"
                  checked={storyline.globalSettings.autoLoop}
                  onChange={(e) => updateGlobalSettings({ autoLoop: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="autoLoop" className="text-white text-sm">
                  自动循环播放
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="triggerCelebration"
                  checked={storyline.globalSettings.triggerCelebrationOnEnd}
                  onChange={(e) => updateGlobalSettings({ triggerCelebrationOnEnd: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="triggerCelebration" className="text-white text-sm">
                  结束时触发庆祝
                </label>
              </div>
              
              {/* 音乐设置 */}
              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="text-white font-medium mb-4">🎵 背景音乐</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="musicEnabled"
                    checked={storyline.globalSettings.musicEnabled}
                    onChange={(e) => updateGlobalSettings({ musicEnabled: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="musicEnabled" className="text-white text-sm">
                    播放背景音乐
                  </label>
                </div>
                
                {storyline.globalSettings.musicEnabled && (
                  <div>
                    <label className="block text-sm text-white/60 mb-2">选择音乐</label>
                    <select
                      value={storyline.globalSettings.musicId || ''}
                      onChange={(e) => updateGlobalSettings({ 
                        musicId: e.target.value || null 
                      })}
                      className="w-full bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
                    >
                      <option value="">使用当前播放的音乐</option>
                      {DEFAULT_SONGS.map((song) => (
                        <option key={song.id} value={song.id}>
                          {song.title} - {song.artist}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-white/40 mt-2">
                      选择"使用当前播放的音乐"将继续播放当前正在播放的歌曲
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
