import { useState, useEffect } from 'react';
import { useAppStore, useSettings, useDecorSettings, useFireworkConfig, useBlessingMessages, useScreenshotConfig, useOnboardingState, useMusicPlayMode, useLyricsPosition, useAutoTriggerConfig } from '@/stores/appStore';
import { useShareStore, useLocalShareInfo } from '@/stores/shareStore';
import type { ColorTheme, FontStyle, ParticleShape, SceneType, DecorCategory, FireworkColorTheme, PlayMode, LyricsPosition, TimezoneOption, CountdownDisplayMode, CountdownMusicTrigger } from '@/types';
import { COLOR_THEME_MAP, SCENE_PRESETS, DECOR_CATEGORY_NAMES, DECOR_TYPES_BY_CATEGORY, DECOR_TYPE_CONFIGS, COMMON_TIMEZONES, COUNTDOWN_DISPLAY_MODE_NAMES, COUNTDOWN_MUSIC_TRIGGER_NAMES } from '@/types';
import { copyToClipboard } from '@/services/shareService';
import {
  X,
  Sparkles,
  TreePine,
  Cake,
  Heart,
  PartyPopper,
  Gift,
  TreeDeciduous,
  GraduationCap,
  Gem,
  Snowflake,
  Star,
  Palette,
  Type,
  Sun,
  Timer,
  Calendar,
  Circle,
  Flame,
  ChevronDown,
  ChevronRight,
  Camera,
  MessageSquare,
  HelpCircle,
  Plus,
  Trash2,
  BookOpen,
  Repeat,
  Repeat1,
  Shuffle,
  ListOrdered,
  Globe,
  Clock,
  Music,
  Zap,
  BarChart3,
  Share2,
  Link,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useStorylineStore } from '@/stores/storylineStore';
import { StorylineEditor } from './storyline';
import VisualizerSettings from './VisualizerSettings';
import PhotoWallSettingsPanel from './PhotoWallSettingsPanel';
import { Image } from 'lucide-react';
import { toast } from './Toast';

// 配置选项
const COLOR_THEMES: { value: ColorTheme; label: string }[] = [
  { value: 'classic-green', label: '经典绿' },
  { value: 'ice-blue', label: '冰雪蓝' },
  { value: 'romantic-pink', label: '浪漫粉' },
  { value: 'golden', label: '金色' },
  { value: 'rainbow', label: '彩虹' },
];

const FONT_STYLES: { value: FontStyle; label: string }[] = [
  { value: 'modern', label: '现代' },
  { value: 'classic', label: '经典' },
  { value: 'handwritten', label: '手写' },
  { value: 'pixel', label: '像素' },
];

const FIREWORK_COLOR_THEME_OPTIONS: { value: FireworkColorTheme; label: string; colors: string[] }[] = [
  { value: 'classic', label: '经典', colors: ['#FF0000', '#00FF00', '#0000FF', '#FFD700'] },
  { value: 'warm', label: '暖色', colors: ['#FF0000', '#FF4500', '#FFD700', '#FF69B4'] },
  { value: 'cool', label: '冷色', colors: ['#00FFFF', '#4169E1', '#00BFFF', '#87CEEB'] },
  { value: 'mono', label: '银白', colors: ['#FFFFFF', '#E0E0E0', '#C0C0C0', '#A0A0A0'] },
];

const PARTICLE_SHAPES: { value: ParticleShape; label: string; icon: React.ReactNode }[] = [
  { value: 'firework', label: '烟花', icon: <Sparkles className="w-5 h-5" /> },
  { value: 'tree', label: '圣诞树', icon: <TreePine className="w-5 h-5" /> },
  { value: 'cake', label: '蛋糕', icon: <Cake className="w-5 h-5" /> },
  { value: 'heart', label: '爱心', icon: <Heart className="w-5 h-5" /> },
];

const SCENE_TYPES: { value: SceneType; label: string; icon: React.ReactNode }[] = [
  { value: 'new-year', label: '新年', icon: <PartyPopper className="w-4 h-4" /> },
  { value: 'birthday', label: '生日', icon: <Gift className="w-4 h-4" /> },
  { value: 'christmas', label: '圣诞', icon: <TreeDeciduous className="w-4 h-4" /> },
  { value: 'valentine', label: '情人节', icon: <Heart className="w-4 h-4" /> },
  { value: 'wedding', label: '婚礼', icon: <Gem className="w-4 h-4" /> },
  { value: 'graduation', label: '毕业', icon: <GraduationCap className="w-4 h-4" /> },
];

const PLAY_MODE_OPTIONS: { value: PlayMode; label: string; icon: React.ReactNode }[] = [
  { value: 'list-repeat', label: '列表循环', icon: <Repeat className="w-4 h-4" /> },
  { value: 'single-repeat', label: '单曲循环', icon: <Repeat1 className="w-4 h-4" /> },
  { value: 'shuffle', label: '随机播放', icon: <Shuffle className="w-4 h-4" /> },
  { value: 'sequential', label: '顺序播放', icon: <ListOrdered className="w-4 h-4" /> },
];

const LYRICS_POSITION_OPTIONS: { value: LyricsPosition; label: string }[] = [
  { value: 'player', label: '播放器内' },
  { value: 'center', label: '屏幕中央' },
];

// 可折叠分组组件
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
          {icon}
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 py-3 space-y-3 bg-gray-900/30">
          {children}
        </div>
      )}
    </div>
  );
}

// 滑块组件
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, unit = '', minLabel, maxLabel, onChange }: SliderProps) {
  const displayValue = step < 1 ? value.toFixed(1) : value;
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">
        {label}: {displayValue}{unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
          <span>{minLabel || min}</span>
          <span>{maxLabel || max}</span>
        </div>
      )}
    </div>
  );
}

export default function SettingsPanel() {
  const settings = useSettings();
  const decorSettings = useDecorSettings();
  const fireworkConfig = useFireworkConfig();
  const blessingMessages = useBlessingMessages();
  const screenshotConfig = useScreenshotConfig();
  const onboardingState = useOnboardingState();
  const musicPlayMode = useMusicPlayMode();
  const lyricsPosition = useLyricsPosition();
  const autoTriggerConfig = useAutoTriggerConfig();
  const blessingColorStart = useAppStore((state) => state.blessingColorStart);
  const blessingColorEnd = useAppStore((state) => state.blessingColorEnd);
  const playlist = useAppStore((state) => state.playlist);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const updateDecorSettings = useAppStore((state) => state.updateDecorSettings);
  const setMusicPlayMode = useAppStore((state) => state.setMusicPlayMode);
  const setLyricsPosition = useAppStore((state) => state.setLyricsPosition);
  const updateFireworkConfig = useAppStore((state) => state.updateFireworkConfig);
  const setBlessingMessages = useAppStore((state) => state.setBlessingMessages);
  const setBlessingColors = useAppStore((state) => state.setBlessingColors);
  const setScreenshotWatermark = useAppStore((state) => state.setScreenshotWatermark);
  const setScreenshotWatermarkEnabled = useAppStore((state) => state.setScreenshotWatermarkEnabled);
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);
  const setAutoTriggerEnabled = useAppStore((state) => state.setAutoTriggerEnabled);
  const setAutoTriggerTimezone = useAppStore((state) => state.setAutoTriggerTimezone);
  const setAutoTriggerEffects = useAppStore((state) => state.setAutoTriggerEffects);
  const isOpen = useAppStore((state) => state.isSettingsOpen);
  const setOpen = useAppStore((state) => state.setSettingsOpen);
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  
  const [newBlessing, setNewBlessing] = useState('');
  const [isStorylineEditorOpen, setIsStorylineEditorOpen] = useState(false);
  const [isPhotoWallSettingsOpen, setIsPhotoWallSettingsOpen] = useState(false);
  
  const { enterStorylineMode, play: playStoryline } = useStorylineStore();
  
  if (!isOpen) return null;
  
  // 切换场景
  const handleSceneChange = (sceneType: SceneType) => {
    const preset = SCENE_PRESETS[sceneType];
    const store = useAppStore.getState();
    
    if (settings.particleShape !== preset.defaultShape) {
      if (!isParticleSpread) store.toggleParticleSpread();
      setTimeout(() => {
        updateSettings({
          sceneType,
          particleShape: preset.defaultShape,
          colorTheme: preset.defaultTheme,
          customMessage: preset.defaultMessage,
          snowEnabled: preset.snowEnabled,
          starFieldEnabled: preset.starFieldEnabled,
        });
        setTimeout(() => {
          if (useAppStore.getState().isParticleSpread) store.toggleParticleSpread();
        }, 300);
      }, 500);
    } else {
      updateSettings({
        sceneType,
        particleShape: preset.defaultShape,
        colorTheme: preset.defaultTheme,
        customMessage: preset.defaultMessage,
        snowEnabled: preset.snowEnabled,
        starFieldEnabled: preset.starFieldEnabled,
      });
    }
  };
  
  // 切换形状
  const handleShapeChange = (shape: ParticleShape) => {
    if (settings.particleShape === shape) return;
    const store = useAppStore.getState();
    if (!isParticleSpread) store.toggleParticleSpread();
    setTimeout(() => {
      updateSettings({ particleShape: shape });
      setTimeout(() => {
        if (useAppStore.getState().isParticleSpread) store.toggleParticleSpread();
      }, 300);
    }, 500);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* 设置面板 - 移动端从底部弹出，固定高度 */}
      <div className="relative bg-gray-900/95 w-full sm:w-[400px] sm:max-w-[90vw] h-[75vh] sm:h-[70vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4" />
            设置
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* 场景选择 */}
          <CollapsibleSection title="场景选择" icon={<Sun className="w-4 h-4" />} defaultOpen={true}>
            <div className="grid grid-cols-3 gap-1.5">
              {SCENE_TYPES.map((scene) => (
                <button
                  key={scene.value}
                  onClick={() => handleSceneChange(scene.value)}
                  className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                    settings.sceneType === scene.value
                      ? 'border-white bg-white/10'
                      : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700'
                  }`}
                >
                  {scene.icon}
                  <span className="text-[10px] text-gray-300">{scene.label}</span>
                </button>
              ))}
            </div>
          </CollapsibleSection>
          
          {/* 故事线模式 */}
          <CollapsibleSection title="故事线模式" icon={<BookOpen className="w-4 h-4" />}>
            <p className="text-xs text-gray-400 mb-3">
              创建从1月到12月的年度回顾故事线，每月可配置图片、粒子文字和背景效果。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsStorylineEditorOpen(true)}
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> 编辑故事线
              </button>
              <button
                onClick={() => {
                  const configuredMonths = useStorylineStore.getState().getConfiguredMonths();
                  if (configuredMonths.length === 0) {
                    toast.warning('还没有配置故事线内容，请先编辑故事线添加月份内容。');
                    return;
                  }
                  setOpen(false);
                  enterStorylineMode();
                  playStoryline();
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors flex items-center gap-1.5"
              >
                <PartyPopper className="w-4 h-4" /> 播放
              </button>
            </div>
          </CollapsibleSection>
          
          {/* 粒子设置 */}
          <CollapsibleSection title="粒子效果" icon={<Sparkles className="w-4 h-4" />} defaultOpen={true}>
            <Slider
              label="粒子数量"
              value={settings.particleCount}
              min={1000}
              max={10000}
              step={500}
              onChange={(v) => updateSettings({ particleCount: v })}
              minLabel="1000"
              maxLabel="10000"
            />
            <Slider
              label="粒子大小"
              value={settings.particleSize}
              min={0.02}
              max={0.2}
              step={0.01}
              onChange={(v) => updateSettings({ particleSize: v })}
              minLabel="小"
              maxLabel="大"
            />
            <Slider
              label="形状大小"
              value={settings.shapeScale}
              min={1.0}
              max={3.0}
              step={0.1}
              unit="x"
              onChange={(v) => updateSettings({ shapeScale: v })}
            />
            <Slider
              label="旋转速度"
              value={settings.rotationSpeed}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => updateSettings({ rotationSpeed: v })}
              minLabel="停止"
              maxLabel="快"
            />
            
            {/* 粒子形状 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">粒子形状</label>
              <div className="grid grid-cols-2 gap-2">
                {PARTICLE_SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    onClick={() => handleShapeChange(shape.value)}
                    className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 ${
                      settings.particleShape === shape.value
                        ? 'bg-yellow-500 text-black font-bold'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {shape.icon}
                    <span>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>
          
          {/* 视觉效果 */}
          <CollapsibleSection title="视觉效果" icon={<Circle className="w-4 h-4" />}>
            {/* 颜色主题 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">颜色主题</label>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updateSettings({ colorTheme: theme.value })}
                    className={`p-1.5 rounded-lg border transition-all ${
                      settings.colorTheme === theme.value ? 'border-white' : 'border-transparent'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full mx-auto"
                      style={{ backgroundColor: COLOR_THEME_MAP[theme.value].primary }}
                    />
                    <span className="text-[9px] text-gray-400 mt-0.5 block text-center">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <Slider
              label="光晕强度"
              value={settings.bloomIntensity}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => updateSettings({ bloomIntensity: v })}
              minLabel="无"
              maxLabel="强"
            />
            
            {/* 开关选项 */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={settings.snowEnabled}
                  onChange={(e) => updateSettings({ snowEnabled: e.target.checked })}
                  className="w-4 h-4 rounded accent-white"
                />
                <span className="text-xs text-gray-300 flex items-center gap-1">
                  <Snowflake className="w-3 h-3" /> 雪花
                </span>
              </label>
              <label className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={settings.starFieldEnabled}
                  onChange={(e) => updateSettings({ starFieldEnabled: e.target.checked })}
                  className="w-4 h-4 rounded accent-white"
                />
                <span className="text-xs text-gray-300 flex items-center gap-1">
                  <Star className="w-3 h-3" /> 星空
                </span>
              </label>
            </div>
          </CollapsibleSection>
          
          {/* 文字与音频 */}
          <CollapsibleSection title="文字与音频" icon={<Type className="w-4 h-4" />}>
            {/* 字体样式 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">字体样式</label>
              <div className="grid grid-cols-4 gap-1.5">
                {FONT_STYLES.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => updateSettings({ fontStyle: font.value })}
                    className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
                      settings.fontStyle === font.value
                        ? 'bg-white text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 祝福语 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">自定义祝福语</label>
              <input
                type="text"
                value={settings.customMessage}
                onChange={(e) => updateSettings({ customMessage: e.target.value })}
                placeholder="新年快乐！"
                maxLength={100}
                className="w-full px-3 py-2 bg-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/50"
              />
            </div>
            
            <Slider
              label="音量"
              value={settings.volume}
              min={0}
              max={1}
              step={0.1}
              unit="%"
              onChange={(v) => updateSettings({ volume: v })}
              minLabel="静音"
              maxLabel="最大"
            />
            
            {/* 播放模式 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">播放模式</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PLAY_MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setMusicPlayMode(mode.value)}
                    className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-0.5 ${
                      musicPlayMode === mode.value
                        ? 'border-white bg-white/10'
                        : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700'
                    }`}
                  >
                    {mode.icon}
                    <span className="text-[9px] text-gray-400">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 歌词显示位置 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">歌词显示位置</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LYRICS_POSITION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLyricsPosition(option.value)}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      lyricsPosition === option.value
                        ? 'bg-white text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* 音频可视化 */}
          <CollapsibleSection title="音频可视化" icon={<BarChart3 className="w-4 h-4" />}>
            <VisualizerSettings />
          </CollapsibleSection>
          
          {/* 照片墙背景 */}
          <CollapsibleSection title="照片墙背景" icon={<Image className="w-4 h-4" />}>
            <p className="text-xs text-gray-400 mb-3">
              将上传的照片作为背景展示，支持自定义布局、滚动效果和文字叠加。
            </p>
            <button
              onClick={() => setIsPhotoWallSettingsOpen(true)}
              className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Image className="w-4 h-4" /> 配置照片墙
            </button>
          </CollapsibleSection>
          
          {/* 3D 装饰 */}
          <CollapsibleSection title="3D 装饰" icon={<Gem className="w-4 h-4" />}>
            <label className="flex items-center justify-between">
              <span className="text-xs text-gray-300">启用装饰</span>
              <input
                type="checkbox"
                checked={decorSettings.enabled}
                onChange={(e) => updateDecorSettings({ enabled: e.target.checked })}
                className="w-4 h-4 rounded accent-white"
              />
            </label>
            
            {decorSettings.enabled && (
              <>
                <Slider
                  label="装饰数量"
                  value={decorSettings.totalCount}
                  min={10}
                  max={100}
                  step={5}
                  onChange={(v) => updateDecorSettings({ totalCount: v })}
                />
                <Slider
                  label="闪烁强度"
                  value={decorSettings.shimmerIntensity}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onChange={(v) => updateDecorSettings({ shimmerIntensity: v })}
                />
                
                {/* 类别选择 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">装饰类别</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(DECOR_CATEGORY_NAMES) as DecorCategory[]).map((category) => (
                      <label key={category} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={decorSettings.enabledCategories.includes(category)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...decorSettings.enabledCategories, category]
                              : decorSettings.enabledCategories.filter(c => c !== category);
                            const newTypes = e.target.checked
                              ? [...decorSettings.enabledTypes, ...DECOR_TYPES_BY_CATEGORY[category]]
                              : decorSettings.enabledTypes.filter(t => !DECOR_TYPES_BY_CATEGORY[category].includes(t));
                            updateDecorSettings({ 
                              enabledCategories: newCategories,
                              enabledTypes: [...new Set(newTypes)]
                            });
                          }}
                          className="w-3 h-3 rounded accent-white"
                        />
                        <span className="text-[11px] text-gray-300">{DECOR_CATEGORY_NAMES[category]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* 具体类型 */}
                {decorSettings.enabledCategories.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">具体类型</label>
                    <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto">
                      {decorSettings.enabledCategories.flatMap(category => 
                        DECOR_TYPES_BY_CATEGORY[category].map((type) => (
                          <label key={type} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={decorSettings.enabledTypes.includes(type)}
                              onChange={(e) => {
                                const newTypes = e.target.checked
                                  ? [...decorSettings.enabledTypes, type]
                                  : decorSettings.enabledTypes.filter(t => t !== type);
                                updateDecorSettings({ enabledTypes: newTypes });
                              }}
                              className="w-3 h-3 rounded accent-white"
                            />
                            <span className="text-[10px] text-gray-400 truncate">{DECOR_TYPE_CONFIGS[type].name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CollapsibleSection>
          
          {/* 烟花效果 */}
          <CollapsibleSection title="烟花效果" icon={<Flame className="w-4 h-4" />}>
            {/* 测试按钮 */}
            <button
              onClick={() => useAppStore.getState().triggerEffect('firework')}
              className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> 测试烟花
            </button>
            
            <label className="flex items-center justify-between">
              <span className="text-xs text-gray-300">启用倒计时烟花</span>
              <input
                type="checkbox"
                checked={fireworkConfig.enabled}
                onChange={(e) => updateFireworkConfig({ enabled: e.target.checked })}
                className="w-4 h-4 rounded accent-white"
              />
            </label>
            
            {fireworkConfig.enabled && (
              <>
                <Slider
                  label="爆炸粒子"
                  value={fireworkConfig.particleCount}
                  min={20}
                  max={200}
                  step={10}
                  unit=" 个"
                  onChange={(v) => updateFireworkConfig({ particleCount: v })}
                />
                
                {/* 颜色主题 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">烟花颜色</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FIREWORK_COLOR_THEME_OPTIONS.map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => updateFireworkConfig({ colorTheme: theme.value })}
                        className={`p-1.5 rounded-lg border transition-all ${
                          fireworkConfig.colorTheme === theme.value
                            ? 'border-white bg-white/10'
                            : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex gap-0.5 justify-center mb-0.5">
                          {theme.colors.slice(0, 3).map((color, i) => (
                            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-400">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <Slider
                  label="爆炸大小"
                  value={fireworkConfig.burstSize}
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  unit="x"
                  onChange={(v) => updateFireworkConfig({ burstSize: v })}
                  minLabel="小"
                  maxLabel="大"
                />
                <Slider
                  label="爆炸范围"
                  value={fireworkConfig.explosionRange}
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  unit="x"
                  onChange={(v) => updateFireworkConfig({ explosionRange: v })}
                  minLabel="紧凑"
                  maxLabel="扩散"
                />
                <Slider
                  label="拖尾长度"
                  value={fireworkConfig.trailLength}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(v) => updateFireworkConfig({ trailLength: v })}
                  minLabel="无"
                  maxLabel="长"
                />
                <Slider
                  label="发射频率"
                  value={fireworkConfig.launchRate}
                  min={1}
                  max={10}
                  step={1}
                  unit="/秒"
                  onChange={(v) => updateFireworkConfig({ launchRate: v })}
                  minLabel="慢"
                  maxLabel="快"
                />
                <Slider
                  label="辉光强度"
                  value={fireworkConfig.glowIntensity}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={(v) => updateFireworkConfig({ glowIntensity: v })}
                  minLabel="无"
                  maxLabel="强"
                />
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fireworkConfig.heartEnabled}
                    onChange={(e) => updateFireworkConfig({ heartEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> 心形烟花
                  </span>
                </label>
                
                <Slider
                  label="庆祝持续时间"
                  value={fireworkConfig.celebrationDuration || 30}
                  min={5}
                  max={120}
                  step={5}
                  unit=" 秒"
                  onChange={(v) => updateFireworkConfig({ celebrationDuration: v })}
                  minLabel="5秒"
                  maxLabel="2分钟"
                />
              </>
            )}
          </CollapsibleSection>
          
          {/* 倒计时配置 */}
          <CollapsibleSection title="倒计时配置" icon={<Timer className="w-4 h-4" />}>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 目标年份 (跨向哪一年？)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="2024"
                  max="2100"
                  value={settings.targetYear}
                  onChange={(e) => updateSettings({ targetYear: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
                <button
                  onClick={() => updateSettings({ targetYear: 2026 })}
                  className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors"
                >
                  2026
                </button>
                <button
                  onClick={() => updateSettings({ targetYear: 2025 })}
                  className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-lg text-xs hover:bg-blue-500/30 transition-colors"
                >
                  2025
                </button>
              </div>
            </div>
            
            {/* 自动开始庆祝 */}
            <label className="flex items-center justify-between py-1 border-t border-gray-800 pt-3">
              <span className="text-xs text-gray-300 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 自动开始庆祝
              </span>
              <input
                type="checkbox"
                checked={autoTriggerConfig.enabled}
                onChange={(e) => setAutoTriggerEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-500"
              />
            </label>
            <p className="text-[10px] text-gray-500 -mt-1 mb-2">
              到达目标时间时自动触发庆祝效果
            </p>
            
            {/* 时区选择 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" /> 时区
              </label>
              <select
                value={autoTriggerConfig.timezone}
                onChange={(e) => setAutoTriggerTimezone(e.target.value as TimezoneOption)}
                className="w-full px-3 py-2 bg-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50 [&>option]:bg-gray-800 [&>option]:text-white"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} {tz.offset && `(${tz.offset})`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 庆祝效果配置 */}
            {autoTriggerConfig.enabled && (
              <div className="space-y-2 pt-2 border-t border-gray-700/50">
                <label className="block text-xs text-gray-400 mb-1.5">庆祝效果</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoTriggerConfig.effects.countdownAnimation}
                    onChange={(e) => setAutoTriggerEffects({ countdownAnimation: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 倒计时动画
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoTriggerConfig.effects.music}
                    onChange={(e) => setAutoTriggerEffects({ music: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <Music className="w-3 h-3" /> 播放音乐
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoTriggerConfig.effects.fireworks}
                    onChange={(e) => setAutoTriggerEffects({ fireworks: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 烟花效果
                  </span>
                </label>
              </div>
            )}
            
            <Slider
              label="倒计时秒数"
              value={settings.countdownDuration}
              min={3}
              max={10}
              step={1}
              unit=" 秒"
              onChange={(v) => updateSettings({ countdownDuration: v })}
            />
            
            {/* 倒计时音乐设置 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">倒计时音乐</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(COUNTDOWN_MUSIC_TRIGGER_NAMES) as CountdownMusicTrigger[]).map((trigger) => (
                  <button
                    key={trigger}
                    onClick={() => updateSettings({ countdownMusicTrigger: trigger })}
                    className={`px-2 py-2 rounded-lg text-xs transition-all ${
                      settings.countdownMusicTrigger === trigger
                        ? 'bg-yellow-500 text-black font-bold'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {COUNTDOWN_MUSIC_TRIGGER_NAMES[trigger]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 选择播放的音乐 - 仅在开启音乐时显示 */}
            {settings.countdownMusicTrigger !== 'none' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">播放音乐</label>
                <select
                  value={settings.countdownMusicId || ''}
                  onChange={(e) => updateSettings({ countdownMusicId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-800 text-white text-xs rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                >
                  <option value="">当前选中的音乐</option>
                  {playlist.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title} - {song.artist}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  选择"当前选中的音乐"将播放音乐播放器中正在选择的歌曲
                </p>
              </div>
            )}
            
            {/* 倒计时显示模式 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">显示模式</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(COUNTDOWN_DISPLAY_MODE_NAMES) as CountdownDisplayMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ countdownDisplayMode: mode })}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      settings.countdownDisplayMode === mode
                        ? 'bg-yellow-500 text-black font-bold'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {COUNTDOWN_DISPLAY_MODE_NAMES[mode]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {settings.countdownDisplayMode === 'particle' ? '使用粒子效果显示倒计时' : '使用普通文字显示倒计时'}
              </p>
            </div>
            
            {/* 倒计时粒子数量 */}
            <Slider
              label="倒计时粒子数量"
              value={settings.countdownParticleCount}
              min={5000}
              max={50000}
              step={1000}
              onChange={(v) => updateSettings({ countdownParticleCount: v })}
              minLabel="稀疏"
              maxLabel="密集"
            />
            
            {/* 倒计时粒子大小 */}
            <Slider
              label="倒计时粒子大小"
              value={settings.countdownParticleSize}
              min={0.5}
              max={3.0}
              step={0.1}
              onChange={(v) => updateSettings({ countdownParticleSize: v })}
              minLabel="小"
              maxLabel="大"
            />
            
            <Slider
              label="倒计时字体大小"
              value={settings.countdownFontSize}
              min={0.3}
              max={1.5}
              step={0.1}
              onChange={(v) => updateSettings({ countdownFontSize: v })}
            />
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.particleTextEnabled}
                onChange={(e) => updateSettings({ particleTextEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-white"
              />
              <span className="text-xs text-gray-300">3D 粒子文字</span>
            </label>
          </CollapsibleSection>
          
          {/* 祝福语设置 */}
          <CollapsibleSection title="祝福语列表" icon={<MessageSquare className="w-4 h-4" />}>
            <div className="space-y-3">
              {/* 渐变颜色配置 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">渐变颜色</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={blessingColorStart}
                      onChange={(e) => setBlessingColors(e.target.value, blessingColorEnd)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <span className="text-[10px] text-gray-500">起始</span>
                  </div>
                  <div className="flex-1 h-4 rounded" style={{
                    background: `linear-gradient(to right, ${blessingColorStart}, ${blessingColorEnd})`
                  }} />
                  <div className="flex-1 flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-gray-500">结束</span>
                    <input
                      type="color"
                      value={blessingColorEnd}
                      onChange={(e) => setBlessingColors(blessingColorStart, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* 祝福语列表 */}
              {blessingMessages.map((msg, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => {
                      const newMessages = [...blessingMessages];
                      newMessages[index] = e.target.value;
                      setBlessingMessages(newMessages);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
                  />
                  <button
                    onClick={() => {
                      const newMessages = blessingMessages.filter((_, i) => i !== index);
                      setBlessingMessages(newMessages.length > 0 ? newMessages : ['新年快乐！']);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* 添加新祝福语 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newBlessing}
                  onChange={(e) => setNewBlessing(e.target.value)}
                  placeholder="添加新祝福语..."
                  className="flex-1 px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBlessing.trim()) {
                      setBlessingMessages([...blessingMessages, newBlessing.trim()]);
                      setNewBlessing('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newBlessing.trim()) {
                      setBlessingMessages([...blessingMessages, newBlessing.trim()]);
                      setNewBlessing('');
                    }
                  }}
                  disabled={!newBlessing.trim()}
                  className="p-1.5 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CollapsibleSection>
          
          {/* 截图设置 */}
          <CollapsibleSection title="截图设置" icon={<Camera className="w-4 h-4" />}>
            <label className="flex items-center justify-between">
              <span className="text-xs text-gray-300">启用水印</span>
              <input
                type="checkbox"
                checked={screenshotConfig.watermarkEnabled}
                onChange={(e) => setScreenshotWatermarkEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-white"
              />
            </label>
            
            {screenshotConfig.watermarkEnabled && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">水印文字</label>
                <input
                  type="text"
                  value={screenshotConfig.watermark}
                  onChange={(e) => setScreenshotWatermark(e.target.value)}
                  placeholder="2026 新年快乐"
                  maxLength={50}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/50"
                />
              </div>
            )}
          </CollapsibleSection>
          
          {/* 分享管理 */}
          <ShareManagementSection onOpenShareModal={() => {
            setOpen(false);
            useAppStore.getState().setShareModalOpen(true);
          }} />
          
          {/* 其他设置 */}
          <CollapsibleSection title="其他设置" icon={<HelpCircle className="w-4 h-4" />}>
            <button
              onClick={() => {
                resetOnboarding();
                setOpen(false);
              }}
              className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              重新显示引导教程
            </button>
            <p className="text-[10px] text-gray-500">
              {onboardingState.hasCompleted ? '引导已完成' : '引导未完成'}
            </p>
          </CollapsibleSection>
        </div>
      </div>
      
      {/* 故事线编辑器 */}
      <StorylineEditor
        isOpen={isStorylineEditorOpen}
        onClose={() => setIsStorylineEditorOpen(false)}
      />
      
      {/* 照片墙设置面板 */}
      <PhotoWallSettingsPanel
        isOpen={isPhotoWallSettingsOpen}
        onClose={() => setIsPhotoWallSettingsOpen(false)}
      />
    </div>
  );
}

// ============================================
// 分享管理组件
// ============================================

interface ShareManagementSectionProps {
  onOpenShareModal: () => void;
}

function ShareManagementSection({ onOpenShareModal }: ShareManagementSectionProps) {
  const localShareInfo = useLocalShareInfo();
  const { loadLocalShareInfo, clearLocalShareInfo, refreshExpiry, deleteCurrentShare, checkLocalShareValid } = useShareStore();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  // 加载本地分享信息
  useEffect(() => {
    loadLocalShareInfo();
  }, [loadLocalShareInfo]);
  
  // 检查分享是否有效
  useEffect(() => {
    if (localShareInfo) {
      checkLocalShareValid().then(setIsValid);
    } else {
      setIsValid(null);
    }
  }, [localShareInfo, checkLocalShareValid]);
  
  const shareUrl = localShareInfo ? `${window.location.origin}/${localShareInfo.shareId}` : null;
  
  const handleCopy = async () => {
    if (!shareUrl) return;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    const result = await refreshExpiry();
    setIsLoading(false);
    if (result.success) {
      alert('续期成功！有效期已延长 7 天。');
    } else {
      alert(result.error || '续期失败');
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('确定要删除这个分享吗？删除后无法恢复。')) return;
    setIsLoading(true);
    const success = await deleteCurrentShare();
    setIsLoading(false);
    if (success) {
      alert('分享已删除');
    } else {
      alert('删除失败，请重试');
    }
  };
  
  const handleClearLocal = () => {
    if (!confirm('确定要清除本地分享记录吗？这不会删除服务器上的分享。')) return;
    clearLocalShareInfo();
  };
  
  return (
    <CollapsibleSection title="分享管理" icon={<Share2 className="w-4 h-4" />}>
      {localShareInfo ? (
        <div className="space-y-3">
          {/* 分享状态 */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">状态:</span>
            {isValid === null ? (
              <span className="text-gray-500">检查中...</span>
            ) : isValid ? (
              <span className="text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> 有效
              </span>
            ) : (
              <span className="text-red-400">已失效或过期</span>
            )}
          </div>
          
          {/* 分享链接 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <Link className="w-3 h-3" /> 分享链接
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl || ''}
                readOnly
                className="flex-1 px-3 py-1.5 bg-gray-800 rounded-lg text-xs text-white truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={shareUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors flex items-center"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenShareModal}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Share2 className="w-3 h-3" /> 编辑分享
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading || !isValid}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> 续期 7 天
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> 删除分享
            </button>
            <button
              onClick={handleClearLocal}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" /> 清除记录
            </button>
          </div>
          
          <p className="text-[10px] text-gray-500">
            创建于: {new Date(localShareInfo.createdAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            还没有创建分享，点击下方按钮创建你的专属分享链接。
          </p>
          <button
            onClick={onOpenShareModal}
            className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> 创建分享
          </button>
        </div>
      )}
    </CollapsibleSection>
  );
}
