import type {
  StorylineConfig,
  MonthSlideConfig,
  SlideElement,
  SlideImageElement,
  SlideParticleTextElement,
  SlideDecorationElement,
  BackgroundEffectConfig,
  EntranceAnimation,
  TransitionType,
  BackgroundEffectType,
  ImageFrameStyle,
  DecorType,
} from '@/types';
import {
  createDefaultStorylineConfig,
  createDefaultMonthSlide,
  DEFAULT_BACKGROUND_EFFECT,
  DEFAULT_STORYLINE_GLOBAL_SETTINGS,
  MAX_IMAGES_PER_SLIDE,
  MONTH_NAMES,
} from '@/types';

// ============================================
// 月份配置验证函数（新增）
// ============================================

/**
 * 检查单个元素是否有效（有实际内容）
 * @param element 幻灯片元素
 * @returns 是否有效
 */
export function isElementValid(element: SlideElement): boolean {
  switch (element.type) {
    case 'image':
      // 图片元素必须有有效的 imageUrl
      const imageElement = element as SlideImageElement;
      return !!(imageElement.imageUrl && imageElement.imageUrl.trim() !== '');
    
    case 'particle_text':
      // 粒子文字必须有非空文本
      const textElement = element as SlideParticleTextElement;
      return !!(textElement.text && textElement.text.trim() !== '');
    
    case 'decoration':
      // 装饰元素总是有效
      return true;
    
    default:
      return false;
  }
}

/**
 * 检查月份是否已配置（有有效内容）
 * 月份被认为"已配置"当且仅当它包含至少一个有效元素
 * @param slide 月份幻灯片配置
 * @returns 是否已配置
 */
export function isMonthConfigured(slide: MonthSlideConfig): boolean {
  // 必须有至少一个有效元素
  return slide.elements.some(element => isElementValid(element));
}

/**
 * 获取所有已配置的月份索引
 * @param storyline 故事线配置
 * @returns 已配置月份的索引数组 [0, 2, 5, 11] 等
 */
export function getConfiguredMonths(storyline: StorylineConfig): number[] {
  return storyline.slides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => isMonthConfigured(slide))
    .map(({ index }) => index);
}

/**
 * 获取月份的有效元素数量
 * @param slide 月份幻灯片配置
 * @returns 有效元素数量
 */
export function getValidElementCount(slide: MonthSlideConfig): number {
  return slide.elements.filter(element => isElementValid(element)).length;
}

/**
 * 检查故事线是否有任何已配置的月份
 * @param storyline 故事线配置
 * @returns 是否有已配置的月份
 */
export function hasConfiguredMonths(storyline: StorylineConfig): boolean {
  return storyline.slides.some(slide => isMonthConfigured(slide));
}

/**
 * 获取已配置月份的统计信息
 * @param storyline 故事线配置
 * @returns 统计信息
 */
export function getConfigurationStats(storyline: StorylineConfig): {
  configuredCount: number;
  totalCount: number;
  configuredMonths: number[];
} {
  const configuredMonths = getConfiguredMonths(storyline);
  return {
    configuredCount: configuredMonths.length,
    totalCount: 12,
    configuredMonths,
  };
}

// ============================================
// 验证函数
// ============================================

/** 验证月份索引 */
export function isValidMonthIndex(month: number): boolean {
  return Number.isInteger(month) && month >= 0 && month <= 11;
}

/** 验证入场动画类型 */
export function isValidEntranceAnimation(animation: string): animation is EntranceAnimation {
  const validAnimations: EntranceAnimation[] = [
    'none', 'fade', 'zoom_in', 'zoom_out',
    'slide_left', 'slide_right', 'slide_up', 'slide_down',
    'bounce', 'rotate',
  ];
  return validAnimations.includes(animation as EntranceAnimation);
}

/** 验证过渡效果类型 */
export function isValidTransitionType(transition: string): transition is TransitionType {
  const validTransitions: TransitionType[] = [
    'fade', 'slide_left', 'slide_right', 'zoom', 'flip', 'dissolve',
  ];
  return validTransitions.includes(transition as TransitionType);
}

/** 验证背景效果类型 */
export function isValidBackgroundEffectType(type: string): type is BackgroundEffectType {
  const validTypes: BackgroundEffectType[] = [
    'none', 'snow', 'stars', 'fireworks', 'hearts', 'leaves', 'rain',
  ];
  return validTypes.includes(type as BackgroundEffectType);
}

/** 验证图片边框样式 */
export function isValidImageFrameStyle(style: string): style is ImageFrameStyle {
  const validStyles: ImageFrameStyle[] = ['none', 'polaroid', 'rounded', 'shadow'];
  return validStyles.includes(style as ImageFrameStyle);
}

/** 验证强度值 (0-1) */
export function isValidIntensity(intensity: number): boolean {
  return typeof intensity === 'number' && intensity >= 0 && intensity <= 1;
}

/** 验证过渡时长 (500-2000ms) */
export function isValidTransitionDuration(duration: number): boolean {
  return typeof duration === 'number' && duration >= 500 && duration <= 2000;
}

/** 验证幻灯片时长 (1000-30000ms) */
export function isValidSlideDuration(duration: number): boolean {
  return typeof duration === 'number' && duration >= 1000 && duration <= 30000;
}

/** 验证背景效果配置 */
export function validateBackgroundEffect(config: BackgroundEffectConfig): BackgroundEffectConfig {
  return {
    type: isValidBackgroundEffectType(config.type) ? config.type : 'stars',
    intensity: isValidIntensity(config.intensity) ? config.intensity : 0.5,
    color: config.color,
  };
}

/** 验证元素基础属性 */
export function validateBaseElement(element: Partial<SlideElement>): boolean {
  if (!element.id || typeof element.id !== 'string') return false;
  if (!element.type || !['image', 'particle_text', 'decoration'].includes(element.type)) return false;
  if (!Array.isArray(element.position) || element.position.length !== 3) return false;
  if (typeof element.scale !== 'number' || element.scale <= 0) return false;
  if (!Array.isArray(element.rotation) || element.rotation.length !== 3) return false;
  return true;
}

/** 验证图片元素 */
export function validateImageElement(element: SlideImageElement): boolean {
  if (!validateBaseElement(element)) return false;
  if (element.type !== 'image') return false;
  if (!element.imageUrl || typeof element.imageUrl !== 'string') return false;
  if (!isValidImageFrameStyle(element.frameStyle)) return false;
  return true;
}

/** 验证粒子文字元素 */
export function validateParticleTextElement(element: SlideParticleTextElement): boolean {
  if (!validateBaseElement(element)) return false;
  if (element.type !== 'particle_text') return false;
  if (!element.text || typeof element.text !== 'string') return false;
  if (typeof element.particleCount !== 'number' || element.particleCount <= 0) return false;
  if (typeof element.fontSize !== 'number' || element.fontSize <= 0) return false;
  return true;
}

/** 验证月份幻灯片配置 */
export function validateMonthSlide(slide: MonthSlideConfig): MonthSlideConfig {
  const validatedSlide: MonthSlideConfig = {
    month: isValidMonthIndex(slide.month) ? slide.month : 0,
    title: slide.title || MONTH_NAMES[slide.month] || '未知月份',
    subtitle: slide.subtitle,
    elements: Array.isArray(slide.elements) ? slide.elements : [],
    backgroundEffect: slide.backgroundEffect 
      ? validateBackgroundEffect(slide.backgroundEffect)
      : { ...DEFAULT_BACKGROUND_EFFECT },
  };
  
  if (slide.customTransition && isValidTransitionType(slide.customTransition)) {
    validatedSlide.customTransition = slide.customTransition;
  }
  
  return validatedSlide;
}

/** 验证故事线配置 */
export function validateStorylineConfig(config: Partial<StorylineConfig>): StorylineConfig {
  const defaultConfig = createDefaultStorylineConfig();
  
  // 验证基础字段
  const validated: StorylineConfig = {
    id: config.id || defaultConfig.id,
    name: config.name || defaultConfig.name,
    year: typeof config.year === 'number' ? config.year : defaultConfig.year,
    slides: [],
    globalSettings: {
      ...DEFAULT_STORYLINE_GLOBAL_SETTINGS,
      ...(config.globalSettings || {}),
    },
    createdAt: config.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  
  // 验证全局设置
  if (!isValidSlideDuration(validated.globalSettings.slideDuration)) {
    validated.globalSettings.slideDuration = DEFAULT_STORYLINE_GLOBAL_SETTINGS.slideDuration;
  }
  if (!isValidTransitionType(validated.globalSettings.transitionType)) {
    validated.globalSettings.transitionType = DEFAULT_STORYLINE_GLOBAL_SETTINGS.transitionType;
  }
  if (!isValidTransitionDuration(validated.globalSettings.transitionDuration)) {
    validated.globalSettings.transitionDuration = DEFAULT_STORYLINE_GLOBAL_SETTINGS.transitionDuration;
  }
  
  // 验证幻灯片（确保有12个）
  for (let i = 0; i < 12; i++) {
    const slide = config.slides?.[i];
    if (slide) {
      validated.slides.push(validateMonthSlide({ ...slide, month: i }));
    } else {
      validated.slides.push(createDefaultMonthSlide(i));
    }
  }
  
  return validated;
}

// ============================================
// 元素创建函数
// ============================================

/** 生成唯一ID */
export function generateElementId(): string {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** 创建图片元素 */
export function createImageElement(
  imageUrl: string,
  options: Partial<Omit<SlideImageElement, 'id' | 'type' | 'imageUrl'>> = {}
): SlideImageElement {
  return {
    id: generateElementId(),
    type: 'image',
    imageUrl,
    position: options.position || [0, 0, 0],
    scale: options.scale || 1,
    rotation: options.rotation || [0, 0, 0],
    entranceAnimation: options.entranceAnimation || 'fade',
    entranceDelay: options.entranceDelay || 0,
    frameStyle: options.frameStyle || 'none',
    aspectRatio: options.aspectRatio,
  };
}

/** 创建粒子文字元素 */
export function createParticleTextElement(
  text: string,
  options: Partial<Omit<SlideParticleTextElement, 'id' | 'type' | 'text'>> = {}
): SlideParticleTextElement {
  return {
    id: generateElementId(),
    type: 'particle_text',
    text,
    position: options.position || [0, 0, 0],
    scale: options.scale || 1,
    rotation: options.rotation || [0, 0, 0],
    entranceAnimation: options.entranceAnimation || 'fade',
    entranceDelay: options.entranceDelay || 0,
    colorTheme: options.colorTheme || 'golden',
    particleCount: options.particleCount || 2000,
    fontSize: options.fontSize || 1,
  };
}

/** 创建装饰元素 */
export function createDecorationElement(
  decorType: DecorType,
  options: Partial<Omit<SlideDecorationElement, 'id' | 'type' | 'decorType'>> = {}
): SlideDecorationElement {
  return {
    id: generateElementId(),
    type: 'decoration',
    decorType,
    position: options.position || [0, 0, 0],
    scale: options.scale || 1,
    rotation: options.rotation || [0, 0, 0],
    entranceAnimation: options.entranceAnimation || 'fade',
    entranceDelay: options.entranceDelay || 0,
    color: options.color || '#FFD700',
  };
}

// ============================================
// 辅助函数
// ============================================

/** 获取幻灯片中的图片数量 */
export function getImageCount(slide: MonthSlideConfig): number {
  return slide.elements.filter(e => e.type === 'image').length;
}

/** 检查是否可以添加图片 */
export function canAddImage(slide: MonthSlideConfig): boolean {
  return getImageCount(slide) < MAX_IMAGES_PER_SLIDE;
}

/** 获取幻灯片的过渡效果 */
export function getSlideTransition(
  slide: MonthSlideConfig,
  globalTransition: TransitionType
): TransitionType {
  return slide.customTransition || globalTransition;
}

/** 计算故事线总时长（毫秒） */
export function calculateTotalDuration(config: StorylineConfig): number {
  const { slideDuration, transitionDuration } = config.globalSettings;
  // 12个幻灯片 + 11个过渡
  return slideDuration * 12 + transitionDuration * 11;
}

/** 格式化时长显示 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${seconds}秒`;
}
