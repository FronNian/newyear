// ============================================
// 应用设置类型
// ============================================

/** 颜色主题 */
export type ColorTheme = 'classic-green' | 'ice-blue' | 'romantic-pink' | 'golden' | 'rainbow';

/** 粒子形状 */
export type ParticleShape = 'tree' | 'cake' | 'firework' | 'heart';

/** 字体样式 */
export type FontStyle = 'modern' | 'classic' | 'handwritten' | 'pixel';

/** 倒计时显示模式 */
export type CountdownDisplayMode = 'text' | 'particle';

/** 倒计时显示模式名称映射 */
export const COUNTDOWN_DISPLAY_MODE_NAMES: Record<CountdownDisplayMode, string> = {
  text: '文字模式',
  particle: '粒子模式',
};

/** 故事线/场景类型 */
export type SceneType = 'new-year' | 'birthday' | 'christmas' | 'valentine' | 'wedding' | 'graduation';

/** 场景配置 */
export interface SceneConfig {
  id: SceneType;
  name: string;
  description: string;
  defaultShape: ParticleShape;
  defaultTheme: ColorTheme;
  defaultMessage: string;
  snowEnabled: boolean;
  starFieldEnabled: boolean;
}

/** 预设场景配置 */
export const SCENE_PRESETS: Record<SceneType, SceneConfig> = {
  'new-year': {
    id: 'new-year',
    name: '新年倒计时',
    description: '迎接新的一年',
    defaultShape: 'firework',
    defaultTheme: 'golden',
    defaultMessage: '新年快乐！',
    snowEnabled: true,
    starFieldEnabled: true,
  },
  'birthday': {
    id: 'birthday',
    name: '生日派对',
    description: '庆祝生日快乐',
    defaultShape: 'cake',
    defaultTheme: 'romantic-pink',
    defaultMessage: '生日快乐！',
    snowEnabled: false,
    starFieldEnabled: true,
  },
  'christmas': {
    id: 'christmas',
    name: '圣诞节',
    description: '圣诞快乐',
    defaultShape: 'tree',
    defaultTheme: 'classic-green',
    defaultMessage: '圣诞快乐！',
    snowEnabled: true,
    starFieldEnabled: true,
  },
  'valentine': {
    id: 'valentine',
    name: '情人节',
    description: '浪漫情人节',
    defaultShape: 'heart',
    defaultTheme: 'romantic-pink',
    defaultMessage: '我爱你！',
    snowEnabled: false,
    starFieldEnabled: true,
  },
  'wedding': {
    id: 'wedding',
    name: '婚礼庆典',
    description: '新婚快乐',
    defaultShape: 'heart',
    defaultTheme: 'golden',
    defaultMessage: '百年好合！',
    snowEnabled: false,
    starFieldEnabled: true,
  },
  'graduation': {
    id: 'graduation',
    name: '毕业典礼',
    description: '毕业快乐',
    defaultShape: 'firework',
    defaultTheme: 'ice-blue',
    defaultMessage: '前程似锦！',
    snowEnabled: false,
    starFieldEnabled: true,
  },
};

/** 倒计时音乐触发时机 */
export type CountdownMusicTrigger = 'none' | 'start' | 'end';

/** 倒计时音乐触发时机名称映射 */
export const COUNTDOWN_MUSIC_TRIGGER_NAMES: Record<CountdownMusicTrigger, string> = {
  none: '不播放',
  start: '倒计时开始时',
  end: '倒计时结束时',
};

/** 应用设置 */
export interface AppSettings {
  sceneType: SceneType;            // 场景类型
  particleCount: number;           // 粒子数量 1000-10000
  particleShape: ParticleShape;    // 粒子形状
  colorTheme: ColorTheme;          // 颜色主题
  bloomIntensity: number;          // Bloom 强度 0-2
  snowEnabled: boolean;            // 雪花开关
  starFieldEnabled: boolean;       // 星空开关
  customMessage: string;           // 自定义祝福语
  fontStyle: FontStyle;            // 字体样式
  countdownFontSize: number;       // 倒计时字体大小 0.3-1.5
  countdownDisplayMode: CountdownDisplayMode;  // 倒计时显示模式
  countdownParticleCount: number;  // 倒计时粒子数量 5000-30000
  countdownParticleSize: number;   // 倒计时粒子大小 0.5-3.0
  volume: number;                  // 音量 0-1
  targetYear: number;              // 目标年份
  countdownDuration: number;       // 手动倒计时秒数 (3-10)
  particleTextEnabled: boolean;    // 3D粒子文字开关
  particleSize: number;            // 粒子大小 0.02-0.2
  shapeScale: number;              // 形状缩放 1.0-3.0
  rotationSpeed: number;           // 旋转速度 0-1 (0=停止, 1=最快)
  countdownMusicTrigger: CountdownMusicTrigger;  // 倒计时音乐触发时机
  countdownMusicId: string | null; // 倒计时播放的音乐ID（null表示当前选中的音乐）
}

/** 默认设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  sceneType: 'new-year',
  particleCount: 5000,
  particleShape: 'firework',
  colorTheme: 'golden',
  bloomIntensity: 0, // 默认关闭光辉效果，避免照片过亮
  snowEnabled: true,
  starFieldEnabled: true,
  customMessage: '新年快乐！',
  fontStyle: 'modern',
  countdownFontSize: 0.5,
  countdownDisplayMode: 'text',  // 默认文字模式
  countdownParticleCount: 15000,  // 倒计时粒子数量默认值
  countdownParticleSize: 1.5,     // 倒计时粒子大小默认值
  volume: 0.7,
  targetYear: 2026,
  countdownDuration: 5,
  particleTextEnabled: true,
  particleSize: 0.08,
  shapeScale: 1.5,               // 默认中等大小
  rotationSpeed: 0.5,            // 默认中等旋转速度
  countdownMusicTrigger: 'end',  // 默认倒计时结束时播放
  countdownMusicId: null,        // 默认使用当前选中的音乐
};

// ============================================
// 照片相关类型
// ============================================

/** 照片数据 */
export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number];  // 在树上的位置
  rotation: number;
}

/** 照片验证结果 */
export interface PhotoValidationResult {
  valid: boolean;
  error?: 'invalid_format' | 'file_too_large';
  message?: string;
}

/** 支持的照片格式 */
export const SUPPORTED_PHOTO_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/** 最大照片大小 (50MB) */
export const MAX_PHOTO_SIZE = 50 * 1024 * 1024;

/** 最大照片数量 */
export const MAX_PHOTO_COUNT = 100;

// ============================================
// 音乐相关类型
// ============================================

/** 歌曲数据 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  src: string;
  lrcSrc?: string;
  duration?: number;
}

/** 播放模式 */
export type PlayMode = 'single-repeat' | 'list-repeat' | 'sequential' | 'shuffle';

/** 歌词显示位置 */
export type LyricsPosition = 'player' | 'center';

/** 播放模式名称映射 */
export const PLAY_MODE_NAMES: Record<PlayMode, string> = {
  'single-repeat': '单曲循环',
  'list-repeat': '列表循环',
  'sequential': '顺序播放',
  'shuffle': '随机播放',
};

/** 歌词位置名称映射 */
export const LYRICS_POSITION_NAMES: Record<LyricsPosition, string> = {
  'player': '播放器内',
  'center': '屏幕中央',
};

/** 播放模式循环顺序 */
export const PLAY_MODE_ORDER: PlayMode[] = ['list-repeat', 'single-repeat', 'shuffle', 'sequential'];

/** 默认播放模式 */
export const DEFAULT_PLAY_MODE: PlayMode = 'list-repeat';

/** 默认歌词位置 */
export const DEFAULT_LYRICS_POSITION: LyricsPosition = 'player';

/** 歌词行 */
export interface LyricLine {
  time: number;      // 时间戳（秒）
  text: string;      // 歌词文本
}

// ============================================
// 手势相关类型
// ============================================

/** 手势类型 */
export type GestureType = 
  | 'wave'           // 挥手 - 切歌
  | 'fist'           // 握拳 - 聚合粒子
  | 'palm'           // 张开手掌 - 移动视角
  | 'thumbs-up'      // 竖大拇指 - 截图
  | 'pinch'          // 捏合 - 选中图片
  | 'heart'          // 比心 - 爱心特效
  | 'none';

/** 手势动作映射 */
export type GestureAction = 
  | 'next_song'
  | 'particle_gather'
  | 'particle_spread'
  | 'camera_move'    // 新增：移动相机
  | 'take_screenshot'
  | 'select_photo'
  | 'trigger_heart'
  | 'none';

/** 手势到动作的映射 */
export const GESTURE_ACTION_MAP: Record<GestureType, GestureAction> = {
  'wave': 'next_song',
  'fist': 'particle_gather',
  'palm': 'camera_move',       // 改为移动相机
  'thumbs-up': 'take_screenshot',
  'pinch': 'select_photo',
  'heart': 'trigger_heart',
  'none': 'none',
};

/** 手势状态 */
export interface GestureState {
  isActive: boolean;
  currentGesture: GestureType;
  confidence: number;
}

// ============================================
// 分享相关类型
// ============================================

/** 分享数据 */
export interface ShareData {
  settings: Partial<AppSettings>;
  message: string;
  timestamp: number;
}

/** 分享链接参数 */
export interface ShareParams {
  v: number;           // 版本
  t: ColorTheme;       // 主题
  p: number;           // 粒子数量
  b: number;           // Bloom 强度
  m: string;           // 祝福语（Base64）
}

// ============================================
// 设备相关类型
// ============================================

/** 性能级别 */
export type PerformanceLevel = 'low' | 'medium' | 'high';

/** 设备信息 */
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  hasWebGL2: boolean;
  performanceLevel: PerformanceLevel;
  screenOrientation: 'portrait' | 'landscape';
}

// ============================================
// 倒计时相关类型
// ============================================

/** 倒计时数据 */
export interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isFinished: boolean;
  isLastTenSeconds: boolean;
}

/** 倒计时模式 */
export type CountdownMode = 'full' | 'final';

// ============================================
// 特效相关类型
// ============================================

/** 特效类型 */
export type EffectType = 'snow' | 'firework' | 'heart' | 'star';

/** 特效音效映射 */
export const EFFECT_SOUND_MAP: Record<EffectType, string> = {
  'snow': '/sounds/snow.mp3',
  'firework': '/sounds/firework.mp3',
  'heart': '/sounds/heart.mp3',
  'star': '/sounds/star.mp3',
};

// ============================================
// 颜色主题配置
// ============================================

/** 主题颜色配置 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

/** 颜色主题映射 */
export const COLOR_THEME_MAP: Record<ColorTheme, ThemeColors> = {
  'classic-green': {
    primary: '#165B33',
    secondary: '#BB2528',
    accent: '#F8B229',
    glow: '#00ff00',
  },
  'ice-blue': {
    primary: '#A5F2F3',
    secondary: '#4FC3F7',
    accent: '#E1F5FE',
    glow: '#00ffff',
  },
  'romantic-pink': {
    primary: '#FFB6C1',
    secondary: '#FF69B4',
    accent: '#FFC0CB',
    glow: '#ff69b4',
  },
  'golden': {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FFEC8B',
    glow: '#ffd700',
  },
  'rainbow': {
    primary: '#FF0000',
    secondary: '#00FF00',
    accent: '#0000FF',
    glow: '#ffffff',
  },
};

/** 获取主题对应的按钮渐变样式 */
export function getThemeButtonStyle(theme: ColorTheme): {
  gradient: string;
  hoverGradient: string;
  shadow: string;
} {
  const colors = COLOR_THEME_MAP[theme];
  return {
    gradient: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
    hoverGradient: `linear-gradient(to right, ${colors.accent}, ${colors.primary})`,
    shadow: `0 10px 15px -3px ${colors.primary}4D`,
  };
}


// ============================================
// 3D 装饰物品类型
// ============================================

/** 装饰物品类别 */
export type DecorCategory = 'gem' | 'festive' | 'nature' | 'geometric' | 'other';

/** 装饰物品类型 */
export type DecorType = 
  // 宝石类
  | 'gem' | 'crystal' | 'diamond'
  // 节日类
  | 'star' | 'bell' | 'giftbox' | 'ribbon' | 'candy'
  // 自然类
  | 'flower' | 'leaf' | 'butterfly' | 'firefly'
  // 几何类
  | 'sphere' | 'cube' | 'pyramid' | 'torus'
  // 其他类
  | 'heart-decor' | 'moon' | 'cloud' | 'balloon';

/** 装饰物品配置 */
export interface DecorTypeConfig {
  type: DecorType;
  category: DecorCategory;
  name: string;
  defaultColor: string;
  emissiveIntensity: number;
  scale: [number, number, number];
  hasAnimation: boolean;
}

/** 装饰物品实例数据 */
export interface DecorItemData {
  id: string;
  type: DecorType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  shimmerOffset: number;
}

/** 装饰系统设置 */
export interface DecorSettings {
  enabled: boolean;
  totalCount: number;
  shimmerIntensity: number;
  enabledCategories: DecorCategory[];
  enabledTypes: DecorType[];
  customColors: Partial<Record<DecorType, string>>;
}

/** 默认装饰设置 */
export const DEFAULT_DECOR_SETTINGS: DecorSettings = {
  enabled: true,
  totalCount: 30,
  shimmerIntensity: 1.0,
  enabledCategories: ['gem'],
  enabledTypes: ['gem', 'crystal', 'diamond'],
  customColors: {
    gem: '#FF4444',
    crystal: '#44AAFF',
    diamond: '#FFD700',
  },
};

/** 装饰类型配置映射 */
export const DECOR_TYPE_CONFIGS: Record<DecorType, DecorTypeConfig> = {
  // 宝石类
  gem: {
    type: 'gem',
    category: 'gem',
    name: '宝石',
    defaultColor: '#FF4444',
    emissiveIntensity: 0.5,
    scale: [0.15, 0.15, 0.15],
    hasAnimation: false,
  },
  crystal: {
    type: 'crystal',
    category: 'gem',
    name: '水晶',
    defaultColor: '#44AAFF',
    emissiveIntensity: 0.6,
    scale: [0.1, 0.2, 0.1],
    hasAnimation: false,
  },
  diamond: {
    type: 'diamond',
    category: 'gem',
    name: '钻石',
    defaultColor: '#FFD700',
    emissiveIntensity: 0.7,
    scale: [0.12, 0.12, 0.12],
    hasAnimation: false,
  },
  // 节日类
  star: {
    type: 'star',
    category: 'festive',
    name: '星星',
    defaultColor: '#FFD700',
    emissiveIntensity: 0.8,
    scale: [0.15, 0.15, 0.15],
    hasAnimation: false,
  },
  bell: {
    type: 'bell',
    category: 'festive',
    name: '铃铛',
    defaultColor: '#CD7F32',
    emissiveIntensity: 0.4,
    scale: [0.12, 0.15, 0.12],
    hasAnimation: false,
  },
  giftbox: {
    type: 'giftbox',
    category: 'festive',
    name: '礼物盒',
    defaultColor: '#FF0000',
    emissiveIntensity: 0.3,
    scale: [0.15, 0.15, 0.15],
    hasAnimation: false,
  },
  ribbon: {
    type: 'ribbon',
    category: 'festive',
    name: '蝴蝶结',
    defaultColor: '#FF69B4',
    emissiveIntensity: 0.4,
    scale: [0.18, 0.12, 0.08],
    hasAnimation: false,
  },
  candy: {
    type: 'candy',
    category: 'festive',
    name: '糖果',
    defaultColor: '#FF0000',
    emissiveIntensity: 0.3,
    scale: [0.08, 0.2, 0.08],
    hasAnimation: false,
  },
  // 自然类
  flower: {
    type: 'flower',
    category: 'nature',
    name: '花朵',
    defaultColor: '#FF69B4',
    emissiveIntensity: 0.3,
    scale: [0.15, 0.15, 0.15],
    hasAnimation: false,
  },
  leaf: {
    type: 'leaf',
    category: 'nature',
    name: '叶子',
    defaultColor: '#228B22',
    emissiveIntensity: 0.2,
    scale: [0.12, 0.15, 0.02],
    hasAnimation: false,
  },
  butterfly: {
    type: 'butterfly',
    category: 'nature',
    name: '蝴蝶',
    defaultColor: '#FF6347',
    emissiveIntensity: 0.4,
    scale: [0.15, 0.1, 0.02],
    hasAnimation: true,
  },
  firefly: {
    type: 'firefly',
    category: 'nature',
    name: '萤火虫',
    defaultColor: '#ADFF2F',
    emissiveIntensity: 1.0,
    scale: [0.05, 0.05, 0.05],
    hasAnimation: true,
  },
  // 几何类
  sphere: {
    type: 'sphere',
    category: 'geometric',
    name: '球体',
    defaultColor: '#9370DB',
    emissiveIntensity: 0.5,
    scale: [0.1, 0.1, 0.1],
    hasAnimation: false,
  },
  cube: {
    type: 'cube',
    category: 'geometric',
    name: '立方体',
    defaultColor: '#20B2AA',
    emissiveIntensity: 0.4,
    scale: [0.1, 0.1, 0.1],
    hasAnimation: false,
  },
  pyramid: {
    type: 'pyramid',
    category: 'geometric',
    name: '金字塔',
    defaultColor: '#DAA520',
    emissiveIntensity: 0.5,
    scale: [0.12, 0.15, 0.12],
    hasAnimation: false,
  },
  torus: {
    type: 'torus',
    category: 'geometric',
    name: '环形',
    defaultColor: '#FF4500',
    emissiveIntensity: 0.5,
    scale: [0.12, 0.12, 0.12],
    hasAnimation: false,
  },
  // 其他类
  'heart-decor': {
    type: 'heart-decor',
    category: 'other',
    name: '爱心',
    defaultColor: '#FF1493',
    emissiveIntensity: 0.6,
    scale: [0.12, 0.12, 0.06],
    hasAnimation: true,
  },
  moon: {
    type: 'moon',
    category: 'other',
    name: '月亮',
    defaultColor: '#FFFACD',
    emissiveIntensity: 0.7,
    scale: [0.15, 0.15, 0.05],
    hasAnimation: false,
  },
  cloud: {
    type: 'cloud',
    category: 'other',
    name: '云朵',
    defaultColor: '#F0F8FF',
    emissiveIntensity: 0.3,
    scale: [0.2, 0.1, 0.1],
    hasAnimation: false,
  },
  balloon: {
    type: 'balloon',
    category: 'other',
    name: '气球',
    defaultColor: '#FF6347',
    emissiveIntensity: 0.3,
    scale: [0.1, 0.15, 0.1],
    hasAnimation: true,
  },
};

/** 按类别获取装饰类型 */
export const DECOR_TYPES_BY_CATEGORY: Record<DecorCategory, DecorType[]> = {
  gem: ['gem', 'crystal', 'diamond'],
  festive: ['star', 'bell', 'giftbox', 'ribbon', 'candy'],
  nature: ['flower', 'leaf', 'butterfly', 'firefly'],
  geometric: ['sphere', 'cube', 'pyramid', 'torus'],
  other: ['heart-decor', 'moon', 'cloud', 'balloon'],
};

/** 类别名称映射 */
export const DECOR_CATEGORY_NAMES: Record<DecorCategory, string> = {
  gem: '宝石类',
  festive: '节日类',
  nature: '自然类',
  geometric: '几何类',
  other: '其他类',
};


// ============================================
// 烟花系统类型
// ============================================

/** 烟花颜色主题 */
export type FireworkColorTheme = 'classic' | 'warm' | 'cool' | 'mono';

/** 烟花密度等级 */
export type FireworkDensityLevel = 'low' | 'medium' | 'high';

/** 烟花爆炸形状 */
export type FireworkBurstShape = 'sphere' | 'ring' | 'heart' | 'star';

/** 烟花配置 */
export interface FireworkConfig {
  enabled: boolean;                    // 是否启用烟花
  particleCount: number;               // 粒子数量 100-1000
  burstSize: number;                   // 爆炸大小 0.5-3.0
  explosionRange: number;              // 爆炸范围 0.3-2.0
  trailLength: number;                 // 拖尾长度 0-20
  launchRate: number;                  // 发射频率 1-10
  colorTheme: FireworkColorTheme;      // 颜色主题
  heartEnabled: boolean;               // 是否启用心形烟花
  glowIntensity: number;               // 中心发光强度 0-2
  gradientEnabled: boolean;            // 渐变色开关
  celebrationDuration: number;         // 庆祝烟花持续时间（秒）5-120
}

/** 默认烟花配置 */
export const DEFAULT_FIREWORK_CONFIG: FireworkConfig = {
  enabled: true,
  particleCount: 80,       // 爆炸粒子数 20-200
  burstSize: 1.2,
  explosionRange: 1.0,
  trailLength: 8,
  launchRate: 3,
  colorTheme: 'classic',
  heartEnabled: true,
  glowIntensity: 1.0,
  gradientEnabled: true,
  celebrationDuration: 30, // 默认30秒
};

/** 烟花粒子 - 使用 any 类型避免循环依赖 */
export interface FireworkParticle {
  position: any;                       // THREE.Vector3
  velocity: any;                       // THREE.Vector3
  color: any;                          // THREE.Color
  life: number;                        // 当前生命值 (0-1)
  maxLife: number;                     // 最大生命值
  size: number;                        // 粒子大小
  trail: any[];                        // THREE.Vector3[] 拖尾位置历史
}

/** 烟花火箭（发射阶段） */
export interface FireworkRocket {
  id: number;
  position: any;                       // THREE.Vector3
  targetY: number;                     // 目标高度
  velocity: any;                       // THREE.Vector3
  color: any;                          // THREE.Color
  burstShape: FireworkBurstShape;      // 爆炸形状
  sparkTrail: FireworkParticle[];      // 火花拖尾
}

/** 烟花爆炸 */
export interface FireworkBurst {
  id: number;
  particles: FireworkParticle[];
  origin: any;                         // THREE.Vector3
  shape: FireworkBurstShape;
  createdAt: number;
}

/** 倒计时触发阶段 */
export type FireworkTriggerPhase = 'idle' | 'warmup' | 'accelerate' | 'burst' | 'celebration';

/** 倒计时触发状态 */
export interface FireworkTriggerState {
  phase: FireworkTriggerPhase;
  lastLaunchTime: number;
  burstTriggered: boolean;
}

/** 密度对应的粒子数量 */
export const FIREWORK_DENSITY_PARTICLE_COUNT: Record<FireworkDensityLevel, number> = {
  low: 150,
  medium: 300,
  high: 500,
};

/** 烟花颜色主题配置 */
export const FIREWORK_COLOR_THEMES: Record<FireworkColorTheme, string[]> = {
  classic: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FF69B4'],
  warm: ['#FF0000', '#FF4500', '#FF6347', '#FFD700', '#FFA500', '#FF69B4', '#DC143C', '#FF1493'],
  cool: ['#00FFFF', '#00CED1', '#4169E1', '#1E90FF', '#00BFFF', '#87CEEB', '#ADD8E6', '#E0FFFF'],
  mono: ['#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0', '#B0B0B0', '#A0A0A0', '#909090'],
};

/** 触发配置 */
export const FIREWORK_TRIGGER_CONFIG = {
  warmupStart: 10,              // 10秒开始预热
  accelerateStart: 3,           // 3秒开始加速
  warmupInterval: 2000,         // 预热阶段每2秒发射
  accelerateInterval: 1000,     // 加速阶段每秒发射
  burstCount: 6,                // 大爆发烟花数量
  celebrationDuration: 10000,   // 庆祝持续10秒
  celebrationInterval: 500,     // 庆祝阶段每0.5秒发射
};


// ============================================
// 庆祝序列相关类型
// ============================================

/** 庆祝阶段 */
export type CelebrationPhase = 
  | 'idle'           // 空闲状态
  | 'firework_burst' // 烟花爆发
  | 'year_display'   // 年份显示
  | 'blessing'       // 祝福语动画
  | 'confetti'       // 彩纸效果
  | 'fadeout';       // 淡出

/** 庆祝状态 */
export interface CelebrationState {
  isActive: boolean;
  phase: CelebrationPhase;
  startTime: number | null;
  duration: number;  // 毫秒
}

/** 默认庆祝状态 */
export const DEFAULT_CELEBRATION_STATE: CelebrationState = {
  isActive: false,
  phase: 'idle',
  startTime: null,
  duration: 30000,  // 默认 30 秒
};

// ============================================
// 引导教程相关类型
// ============================================

/** 引导步骤 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;  // 高亮目标元素的 CSS 选择器
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/** 引导状态 */
export interface OnboardingState {
  hasCompleted: boolean;
  currentStep: number;
  skipped: boolean;
}

/** 默认引导状态 */
export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  hasCompleted: false,
  currentStep: 0,
  skipped: false,
};

/** 预设引导步骤 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到 2026 跨年倒计时！',
    description: '让我们一起迎接新的一年，这里有一些快速提示帮助你开始。',
    position: 'center',
  },
  {
    id: 'camera',
    title: '相机控制',
    description: '拖拽旋转视角，滚轮缩放场景。移动端可以双指缩放和旋转。',
    position: 'center',
  },
  {
    id: 'settings',
    title: '设置面板',
    description: '点击右下角的"设置"按钮，自定义主题、粒子效果和祝福语。',
    targetSelector: '[data-onboarding="settings"]',
    position: 'left',
  },
  {
    id: 'gesture',
    title: '手势控制',
    description: '开启摄像头后，可以用手势控制场景：挥手切歌、握拳聚合粒子、比心触发爱心特效。',
    targetSelector: '[data-onboarding="gesture"]',
    position: 'left',
  },
  {
    id: 'photo',
    title: '照片上传',
    description: '上传你的照片，它们会变成漂浮的装饰物，让场景更加个性化。',
    position: 'center',
  },
];

// ============================================
// 触摸手势相关类型
// ============================================

/** 触摸手势状态 */
export interface TouchGestureState {
  isPinching: boolean;
  isRotating: boolean;
  lastTapTime: number;
  pinchScale: number;
  rotationAngle: number;
  swipeDirection: 'left' | 'right' | null;
}

/** 默认触摸手势状态 */
export const DEFAULT_TOUCH_GESTURE_STATE: TouchGestureState = {
  isPinching: false,
  isRotating: false,
  lastTapTime: 0,
  pinchScale: 1,
  rotationAngle: 0,
  swipeDirection: null,
};

// ============================================
// 截图相关类型
// ============================================

/** 截图配置 */
export interface ScreenshotConfig {
  watermarkEnabled: boolean;
  watermarkText: string;
  highResolution: boolean;  // 2x 设备像素比
}

/** 默认截图配置 */
export const DEFAULT_SCREENSHOT_CONFIG: ScreenshotConfig = {
  watermarkEnabled: true,
  watermarkText: '2026 新年快乐',
  highResolution: true,
};

// ============================================
// 扩展 AppSettings
// ============================================

/** 扩展应用设置（新年增强功能） */
export interface AppSettingsExtended extends AppSettings {
  blessingMessages: string[];      // 祝福语列表
  celebrationDuration: number;     // 庆祝持续时间（秒）
  screenshotWatermark: string;     // 截图水印文字
  screenshotWatermarkEnabled: boolean;  // 是否启用水印
}

/** 默认扩展设置 */
export const DEFAULT_SETTINGS_EXTENDED: Partial<AppSettingsExtended> = {
  blessingMessages: ['新年快乐！', '万事如意！', '心想事成！'],
  celebrationDuration: 30,
  screenshotWatermark: '2026 新年快乐',
  screenshotWatermarkEnabled: true,
};


// ============================================
// 故事线模式相关类型
// ============================================

/** 月份名称 */
export const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
] as const;

/** 月份英文名称 */
export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** 入场动画类型 */
export type EntranceAnimation =
  | 'none'
  | 'fade'
  | 'zoom_in'
  | 'zoom_out'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'slide_down'
  | 'bounce'
  | 'rotate';

/** 过渡效果类型 */
export type TransitionType =
  | 'fade'
  | 'slide_left'
  | 'slide_right'
  | 'zoom'
  | 'flip'
  | 'dissolve';

/** 背景效果类型 */
export type BackgroundEffectType = 'snow' | 'stars' | 'fireworks' | 'hearts' | 'leaves' | 'rain' | 'none';

/** 图片边框样式 */
export type ImageFrameStyle = 'none' | 'polaroid' | 'rounded' | 'shadow';

/** 背景效果配置 */
export interface BackgroundEffectConfig {
  type: BackgroundEffectType;
  intensity: number;  // 0-1
  color?: string;
}

/** 基础元素接口 */
export interface BaseSlideElement {
  id: string;
  type: 'image' | 'particle_text' | 'decoration';
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  entranceAnimation: EntranceAnimation;
  entranceDelay: number;  // 毫秒
}

/** 图片元素 */
export interface SlideImageElement extends BaseSlideElement {
  type: 'image';
  imageUrl: string;
  frameStyle: ImageFrameStyle;
  aspectRatio?: number;
}

/** 粒子文字元素 */
export interface SlideParticleTextElement extends BaseSlideElement {
  type: 'particle_text';
  text: string;
  colorTheme: ColorTheme;
  particleCount: number;
  fontSize: number;
}

/** 装饰元素 */
export interface SlideDecorationElement extends BaseSlideElement {
  type: 'decoration';
  decorType: DecorType;
  color: string;
}

/** 幻灯片元素联合类型 */
export type SlideElement = SlideImageElement | SlideParticleTextElement | SlideDecorationElement;

/** 月份幻灯片配置 */
export interface MonthSlideConfig {
  month: number;  // 0-11
  title: string;
  subtitle?: string;
  elements: SlideElement[];
  backgroundEffect?: BackgroundEffectConfig;
  customTransition?: TransitionType;
}

/** 故事线全局设置 */
export interface StorylineGlobalSettings {
  slideDuration: number;        // 每张幻灯片持续时间（毫秒）
  transitionType: TransitionType;
  transitionDuration: number;   // 过渡动画时长（毫秒）
  autoLoop: boolean;            // 是否循环播放
  triggerCelebrationOnEnd: boolean;  // 结束时触发庆祝
  // 音乐设置
  musicEnabled: boolean;        // 是否启用背景音乐
  musicId: string | null;       // 选择的音乐ID，null表示使用当前播放的音乐
}

/** 故事线配置 */
export interface StorylineConfig {
  id: string;
  name: string;
  year: number;
  slides: MonthSlideConfig[];
  globalSettings: StorylineGlobalSettings;
  createdAt: number;
  updatedAt: number;
}

/** 故事线模板 */
export interface StorylineTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  slides: Partial<MonthSlideConfig>[];
}

/** 默认背景效果配置 */
export const DEFAULT_BACKGROUND_EFFECT: BackgroundEffectConfig = {
  type: 'stars',
  intensity: 0.5,
};

/** 默认故事线全局设置 */
export const DEFAULT_STORYLINE_GLOBAL_SETTINGS: StorylineGlobalSettings = {
  slideDuration: 5000,          // 5秒
  transitionType: 'fade',
  transitionDuration: 1000,     // 1秒
  autoLoop: false,
  triggerCelebrationOnEnd: true,
  musicEnabled: true,           // 默认启用音乐
  musicId: null,                // 默认使用当前播放的音乐
};

/** 创建默认月份幻灯片 */
export function createDefaultMonthSlide(month: number): MonthSlideConfig {
  return {
    month,
    title: MONTH_NAMES[month],
    subtitle: '',
    elements: [],
    backgroundEffect: { ...DEFAULT_BACKGROUND_EFFECT },
  };
}

/** 创建默认故事线配置 */
export function createDefaultStorylineConfig(year: number = new Date().getFullYear()): StorylineConfig {
  const slides: MonthSlideConfig[] = [];
  for (let i = 0; i < 12; i++) {
    slides.push(createDefaultMonthSlide(i));
  }
  
  return {
    id: `storyline-${Date.now()}`,
    name: `${year} 年度回顾`,
    year,
    slides,
    globalSettings: { ...DEFAULT_STORYLINE_GLOBAL_SETTINGS },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** 入场动画名称映射 */
export const ENTRANCE_ANIMATION_NAMES: Record<EntranceAnimation, string> = {
  none: '无',
  fade: '淡入',
  zoom_in: '放大',
  zoom_out: '缩小',
  slide_left: '从左滑入',
  slide_right: '从右滑入',
  slide_up: '从下滑入',
  slide_down: '从上滑入',
  bounce: '弹跳',
  rotate: '旋转',
};

/** 过渡效果名称映射 */
export const TRANSITION_TYPE_NAMES: Record<TransitionType, string> = {
  fade: '淡入淡出',
  slide_left: '向左滑动',
  slide_right: '向右滑动',
  zoom: '缩放',
  flip: '翻转',
  dissolve: '溶解',
};

/** 背景效果名称映射 */
export const BACKGROUND_EFFECT_NAMES: Record<BackgroundEffectType, string> = {
  none: '无',
  snow: '雪花',
  stars: '星空',
  fireworks: '烟花',
  hearts: '爱心',
  leaves: '落叶',
  rain: '雨滴',
};

/** 图片边框样式名称映射 */
export const IMAGE_FRAME_STYLE_NAMES: Record<ImageFrameStyle, string> = {
  none: '无边框',
  polaroid: '拍立得',
  rounded: '圆角',
  shadow: '阴影',
};

/** 每月最大图片数量 */
export const MAX_IMAGES_PER_SLIDE = 5;

/** 故事线存储键名 */
export const STORYLINE_STORAGE_KEY = 'nye-storyline-config';


// ============================================
// 自动倒计时触发相关类型
// ============================================

/** 时区选项 - 'auto' 表示跟随系统，其他为 IANA 时区名 */
export type TimezoneOption = 'auto' | string;

/** 庆祝效果配置 */
export interface CelebrationEffectConfig {
  countdownAnimation: boolean;  // 最后10秒倒计时动画
  music: boolean;               // 播放音乐
  fireworks: boolean;           // 烟花效果
}

/** 自动触发配置 */
export interface AutoTriggerConfig {
  enabled: boolean;             // 是否启用自动触发
  timezone: TimezoneOption;     // 时区设置
  effects: CelebrationEffectConfig;  // 庆祝效果配置
  hasTriggered: boolean;        // 本次是否已触发（防止重复触发）
}

/** 时区信息 */
export interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
}

/** 常用时区列表 */
export const COMMON_TIMEZONES: TimezoneInfo[] = [
  { value: 'auto', label: '自动（跟随系统）', offset: '' },
  { value: 'Pacific/Auckland', label: '奥克兰', offset: 'UTC+13' },
  { value: 'Pacific/Fiji', label: '斐济', offset: 'UTC+12' },
  { value: 'Asia/Tokyo', label: '东京', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: '首尔', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: '北京/上海', offset: 'UTC+8' },
  { value: 'Asia/Singapore', label: '新加坡', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: '香港', offset: 'UTC+8' },
  { value: 'Asia/Taipei', label: '台北', offset: 'UTC+8' },
  { value: 'Asia/Bangkok', label: '曼谷', offset: 'UTC+7' },
  { value: 'Asia/Kolkata', label: '孟买', offset: 'UTC+5:30' },
  { value: 'Asia/Dubai', label: '迪拜', offset: 'UTC+4' },
  { value: 'Europe/Moscow', label: '莫斯科', offset: 'UTC+3' },
  { value: 'Europe/Istanbul', label: '伊斯坦布尔', offset: 'UTC+3' },
  { value: 'Europe/Berlin', label: '柏林', offset: 'UTC+1' },
  { value: 'Europe/Paris', label: '巴黎', offset: 'UTC+1' },
  { value: 'Europe/London', label: '伦敦', offset: 'UTC+0' },
  { value: 'America/Sao_Paulo', label: '圣保罗', offset: 'UTC-3' },
  { value: 'America/New_York', label: '纽约', offset: 'UTC-5' },
  { value: 'America/Chicago', label: '芝加哥', offset: 'UTC-6' },
  { value: 'America/Denver', label: '丹佛', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: '洛杉矶', offset: 'UTC-8' },
  { value: 'America/Anchorage', label: '安克雷奇', offset: 'UTC-9' },
  { value: 'Pacific/Honolulu', label: '檀香山', offset: 'UTC-10' },
];

/** 默认庆祝效果配置 */
export const DEFAULT_CELEBRATION_EFFECT_CONFIG: CelebrationEffectConfig = {
  countdownAnimation: true,
  music: true,
  fireworks: true,
};

/** 默认自动触发配置 */
export const DEFAULT_AUTO_TRIGGER_CONFIG: AutoTriggerConfig = {
  enabled: true,
  timezone: 'auto',
  effects: { ...DEFAULT_CELEBRATION_EFFECT_CONFIG },
  hasTriggered: false,
};

/** 时区名称映射（用于显示） */
export const TIMEZONE_LABELS: Record<string, string> = COMMON_TIMEZONES.reduce(
  (acc, tz) => ({ ...acc, [tz.value]: tz.label }),
  {} as Record<string, string>
);


// ============================================
// 音频可视化相关类型
// ============================================

/** 频谱柱状图位置 */
export type SpectrumPosition = 'bottom' | 'left' | 'right' | 'circular';

/** 色差效果目标 */
export type ChromaticTarget = 'global' | 'text' | 'countdown';

/** 色差偏移方向 */
export type OffsetDirection = 'horizontal' | 'vertical' | 'radial' | 'diagonal';

/** 音频同步配置 */
export interface AudioSyncConfig {
  enabled: boolean;
  sensitivity: number;        // 音频灵敏度 0-100
}

/** 频谱柱状图设置 */
export interface SpectrumSettings {
  enabled: boolean;
  position: SpectrumPosition;
  barCount: number;           // 柱状条数量 16-64
  barColor: string;           // 主颜色
  barGradient: string[] | null; // 渐变色数组
  sensitivity: number;        // 灵敏度 0-100
  gap: number;                // 间距
  borderRadius: number;       // 圆角
  mirror: boolean;            // 是否镜像
}

/** 色差效果设置 */
export interface ChromaticSettings {
  enabled: boolean;
  intensity: number;          // 强度 0-100
  colors: {
    red: string;
    green: string;
    blue: string;
  };
  target: ChromaticTarget;
  direction: OffsetDirection; // 偏移方向
  audioSync: AudioSyncConfig; // 音频同步配置
}

/** 可视化设置 */
export interface VisualizerSettings {
  enabled: boolean;
  spectrum: SpectrumSettings;
  chromatic: ChromaticSettings;
}

/** 默认频谱设置 */
export const DEFAULT_SPECTRUM_SETTINGS: SpectrumSettings = {
  enabled: true,
  position: 'bottom',
  barCount: 32,
  barColor: '#00ff88',
  barGradient: ['#00ff88', '#00ccff', '#ff00ff'],
  sensitivity: 70,
  gap: 2,
  borderRadius: 2,
  mirror: false,
};

/** 默认音频同步配置 */
export const DEFAULT_AUDIO_SYNC_CONFIG: AudioSyncConfig = {
  enabled: true,
  sensitivity: 70,
};

/** 默认色差设置 */
export const DEFAULT_CHROMATIC_SETTINGS: ChromaticSettings = {
  enabled: true,
  intensity: 5,
  colors: {
    red: '#ff0040',
    green: '#ffffff',
    blue: '#0080ff',
  },
  target: 'global',
  direction: 'horizontal',
  audioSync: DEFAULT_AUDIO_SYNC_CONFIG,
};

/** 默认可视化设置 */
export const DEFAULT_VISUALIZER_SETTINGS: VisualizerSettings = {
  enabled: true,
  spectrum: DEFAULT_SPECTRUM_SETTINGS,
  chromatic: DEFAULT_CHROMATIC_SETTINGS,
};

/** 频谱位置名称映射 */
export const SPECTRUM_POSITION_NAMES: Record<SpectrumPosition, string> = {
  bottom: '底部',
  left: '左侧',
  right: '右侧',
  circular: '环绕',
};

/** 色差目标名称映射 */
export const CHROMATIC_TARGET_NAMES: Record<ChromaticTarget, string> = {
  global: '全局',
  text: '文字',
  countdown: '倒计时',
};

/** 偏移方向名称映射 */
export const OFFSET_DIRECTION_NAMES: Record<OffsetDirection, string> = {
  horizontal: '水平',
  vertical: '垂直',
  radial: '径向',
  diagonal: '对角线',
};


// ============================================
// 隧道模式相关类型
// ============================================

/** 隧道主题类型 */
export type TunnelTheme = 'neon' | 'galaxy' | 'warm' | 'cool';

/** 隧道主题名称映射 */
export const TUNNEL_THEME_NAMES: Record<TunnelTheme, string> = {
  neon: '霓虹',
  galaxy: '星河',
  warm: '暖色',
  cool: '冷色',
};

/** 隧道颜色配置 */
export interface TunnelColorConfig {
  globalColor: string;           // 全局隧道颜色
  monthColors: Record<number, string>;  // 每月自定义颜色 (0-11)
}

/** 隧道配置 */
export interface TunnelConfig {
  theme: TunnelTheme;            // 主题
  colors: TunnelColorConfig;     // 颜色配置
  wallOpacity: number;           // 墙体透明度 0-1
  glowIntensity: number;         // 发光强度 0-2
  particleSpeed: number;         // 粒子流动速度 0.5-3
  showStationMarkers: boolean;   // 是否显示站点标记环
}

/** 默认隧道颜色配置 */
export const DEFAULT_TUNNEL_COLOR_CONFIG: TunnelColorConfig = {
  globalColor: '#6366f1',
  monthColors: {},
};

/** 默认隧道配置 */
export const DEFAULT_TUNNEL_CONFIG: TunnelConfig = {
  theme: 'galaxy',
  colors: { ...DEFAULT_TUNNEL_COLOR_CONFIG },
  wallOpacity: 0.25,
  glowIntensity: 1.0,
  particleSpeed: 1.0,
  showStationMarkers: true,
};


// ============================================
// 照片墙背景相关类型
// ============================================

/** 照片形状 */
export type PhotoWallShape = 'circle' | 'square' | 'rounded';

/** 照片形状名称映射 */
export const PHOTO_WALL_SHAPE_NAMES: Record<PhotoWallShape, string> = {
  circle: '圆形',
  square: '方形',
  rounded: '圆角矩形',
};

/** 滚动方向 */
export type ScrollDirection = 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down';

/** 滚动方向名称映射 */
export const SCROLL_DIRECTION_NAMES: Record<ScrollDirection, string> = {
  horizontal: '水平',
  vertical: '垂直',
  'diagonal-up': '对角线向上',
  'diagonal-down': '对角线向下',
};

/** 显示模式 */
export type PhotoWallDisplayMode = 'global' | 'celebration' | 'after-countdown';

/** 显示模式名称映射 */
export const PHOTO_WALL_DISPLAY_MODE_NAMES: Record<PhotoWallDisplayMode, string> = {
  global: '全局显示',
  celebration: '仅庆祝时显示',
  'after-countdown': '倒计时结束后显示',
};

/** 背景模式 */
export type PhotoWallBackgroundMode = 'overlay' | 'replace';

/** 背景模式名称映射 */
export const PHOTO_WALL_BACKGROUND_MODE_NAMES: Record<PhotoWallBackgroundMode, string> = {
  overlay: '与星空叠加',
  replace: '替换星空',
};

/** 文字位置 */
export type WallTextPosition = 'top' | 'center' | 'bottom';

/** 文字位置名称映射 */
export const WALL_TEXT_POSITION_NAMES: Record<WallTextPosition, string> = {
  top: '顶部',
  center: '中央',
  bottom: '底部',
};

/** 照片墙文字设置 */
export interface WallTextSettings {
  enabled: boolean;
  content: string;           // 最多50字符
  position: WallTextPosition;
  fontSize: number;          // 12-72px
  color: string;
  glowEnabled: boolean;
}

/** 默认照片墙文字设置 */
export const DEFAULT_WALL_TEXT_SETTINGS: WallTextSettings = {
  enabled: false,
  content: '',
  position: 'bottom',
  fontSize: 24,
  color: '#ffffff',
  glowEnabled: true,
};

/** 照片墙设置 */
export interface PhotoWallSettings {
  // 基础设置
  enabled: boolean;
  displayMode: PhotoWallDisplayMode;
  backgroundMode: PhotoWallBackgroundMode;
  
  // 布局设置
  columns: number;           // 2-8
  rows: number;              // 2-8
  gap: number;               // 0-50px
  photoScale: number;        // 0.5-2.0
  photoShape: PhotoWallShape;
  
  // 滚动设置
  scrollSpeed: number;       // 0-100
  scrollDirection: ScrollDirection;
  scrollPaused: boolean;
  
  // 视觉设置
  opacity: number;           // 0-100
  borderRadius: number;      // 0-50 (仅 rounded 形状)
  shadowEnabled: boolean;
  backgroundColor: string;
  backgroundGradient: string[] | null;
  blurIntensity: number;     // 0-20px
  
  // 显示设置
  fadeDuration: number;      // 0.5-3 秒
  
  // 文字设置
  text: WallTextSettings;
  
  // 选中的照片ID列表
  selectedPhotoIds: string[];
}

/** 默认照片墙设置 */
export const DEFAULT_PHOTO_WALL_SETTINGS: PhotoWallSettings = {
  enabled: false,
  displayMode: 'global',
  backgroundMode: 'overlay',
  
  columns: 4,
  rows: 4,
  gap: 10,
  photoScale: 1.0,
  photoShape: 'circle',
  
  scrollSpeed: 20,
  scrollDirection: 'horizontal',
  scrollPaused: false,
  
  opacity: 80,
  borderRadius: 20,
  shadowEnabled: true,
  backgroundColor: '#1a1a2e',
  backgroundGradient: ['#1a1a2e', '#16213e', '#0f3460'],
  blurIntensity: 0,
  
  fadeDuration: 1.0,
  
  text: { ...DEFAULT_WALL_TEXT_SETTINGS },
  
  selectedPhotoIds: [],
};

/** 照片墙设置验证范围 */
export const PHOTO_WALL_SETTINGS_RANGES = {
  columns: { min: 2, max: 8 },
  rows: { min: 2, max: 8 },
  gap: { min: 0, max: 50 },
  photoScale: { min: 0.5, max: 2.0 },
  scrollSpeed: { min: 0, max: 100 },
  opacity: { min: 0, max: 100 },
  borderRadius: { min: 0, max: 50 },
  blurIntensity: { min: 0, max: 20 },
  fadeDuration: { min: 0.5, max: 3 },
  textFontSize: { min: 12, max: 72 },
  textContentMaxLength: 50,
} as const;
