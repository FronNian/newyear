import type {
  StorylineTemplate,
  StorylineConfig,
  BackgroundEffectType,
} from '@/types';
import {
  createDefaultStorylineConfig,
  MONTH_NAMES,
} from '@/types';
import { createParticleTextElement } from './storylineService';

// ============================================
// 预设模板定义
// ============================================

/** 年度回顾模板 */
const YEAR_IN_REVIEW_TEMPLATE: StorylineTemplate = {
  id: 'year-in-review',
  name: '年度回顾',
  description: '回顾一年中的精彩时刻，每月一个主题',
  thumbnail: '📅',
  slides: [
    { month: 0, title: '新年新气象', subtitle: '一月 · 新的开始', backgroundEffect: { type: 'snow', intensity: 0.6 } },
    { month: 1, title: '情人节', subtitle: '二月 · 爱的季节', backgroundEffect: { type: 'hearts', intensity: 0.5 } },
    { month: 2, title: '春暖花开', subtitle: '三月 · 万物复苏', backgroundEffect: { type: 'leaves', intensity: 0.4 } },
    { month: 3, title: '清明时节', subtitle: '四月 · 踏青赏花', backgroundEffect: { type: 'rain', intensity: 0.3 } },
    { month: 4, title: '劳动最光荣', subtitle: '五月 · 奋斗的季节', backgroundEffect: { type: 'stars', intensity: 0.5 } },
    { month: 5, title: '仲夏之夜', subtitle: '六月 · 毕业季', backgroundEffect: { type: 'fireworks', intensity: 0.6 } },
    { month: 6, title: '盛夏时光', subtitle: '七月 · 热情似火', backgroundEffect: { type: 'stars', intensity: 0.7 } },
    { month: 7, title: '七夕佳节', subtitle: '八月 · 浪漫时刻', backgroundEffect: { type: 'hearts', intensity: 0.6 } },
    { month: 8, title: '金秋九月', subtitle: '九月 · 开学季', backgroundEffect: { type: 'leaves', intensity: 0.5 } },
    { month: 9, title: '国庆欢歌', subtitle: '十月 · 祖国生日', backgroundEffect: { type: 'fireworks', intensity: 0.7 } },
    { month: 10, title: '深秋落叶', subtitle: '十一月 · 感恩时节', backgroundEffect: { type: 'leaves', intensity: 0.6 } },
    { month: 11, title: '岁末年终', subtitle: '十二月 · 迎接新年', backgroundEffect: { type: 'snow', intensity: 0.8 } },
  ],
};

/** 四季变换模板 */
const SEASONS_TEMPLATE: StorylineTemplate = {
  id: 'seasons',
  name: '四季变换',
  description: '感受四季的变化，春夏秋冬各有风情',
  thumbnail: '🌸',
  slides: [
    { month: 0, title: '冬日暖阳', subtitle: '寒冬腊月', backgroundEffect: { type: 'snow', intensity: 0.7 } },
    { month: 1, title: '冬末春初', subtitle: '冰雪消融', backgroundEffect: { type: 'snow', intensity: 0.5 } },
    { month: 2, title: '春回大地', subtitle: '万物复苏', backgroundEffect: { type: 'leaves', intensity: 0.3 } },
    { month: 3, title: '春意盎然', subtitle: '百花齐放', backgroundEffect: { type: 'leaves', intensity: 0.5 } },
    { month: 4, title: '春末夏初', subtitle: '绿意渐浓', backgroundEffect: { type: 'stars', intensity: 0.4 } },
    { month: 5, title: '初夏时节', subtitle: '阳光明媚', backgroundEffect: { type: 'stars', intensity: 0.6 } },
    { month: 6, title: '盛夏炎炎', subtitle: '热情似火', backgroundEffect: { type: 'fireworks', intensity: 0.5 } },
    { month: 7, title: '夏末秋初', subtitle: '暑气渐消', backgroundEffect: { type: 'stars', intensity: 0.5 } },
    { month: 8, title: '金秋时节', subtitle: '硕果累累', backgroundEffect: { type: 'leaves', intensity: 0.6 } },
    { month: 9, title: '秋高气爽', subtitle: '层林尽染', backgroundEffect: { type: 'leaves', intensity: 0.7 } },
    { month: 10, title: '深秋落叶', subtitle: '秋风萧瑟', backgroundEffect: { type: 'leaves', intensity: 0.8 } },
    { month: 11, title: '初冬来临', subtitle: '银装素裹', backgroundEffect: { type: 'snow', intensity: 0.6 } },
  ],
};

/** 节日庆典模板 */
const CELEBRATIONS_TEMPLATE: StorylineTemplate = {
  id: 'celebrations',
  name: '节日庆典',
  description: '一年中的重要节日和庆典时刻',
  thumbnail: '🎉',
  slides: [
    { month: 0, title: '元旦快乐', subtitle: '新年第一天', backgroundEffect: { type: 'fireworks', intensity: 0.8 } },
    { month: 1, title: '春节团圆', subtitle: '阖家欢乐', backgroundEffect: { type: 'fireworks', intensity: 0.9 } },
    { month: 2, title: '元宵佳节', subtitle: '花灯璀璨', backgroundEffect: { type: 'stars', intensity: 0.7 } },
    { month: 3, title: '清明踏青', subtitle: '缅怀先人', backgroundEffect: { type: 'rain', intensity: 0.4 } },
    { month: 4, title: '劳动节', subtitle: '致敬劳动者', backgroundEffect: { type: 'stars', intensity: 0.5 } },
    { month: 5, title: '端午安康', subtitle: '龙舟竞渡', backgroundEffect: { type: 'rain', intensity: 0.3 } },
    { month: 6, title: '建党节', subtitle: '红色记忆', backgroundEffect: { type: 'fireworks', intensity: 0.6 } },
    { month: 7, title: '七夕情人节', subtitle: '鹊桥相会', backgroundEffect: { type: 'hearts', intensity: 0.8 } },
    { month: 8, title: '中秋团圆', subtitle: '月圆人团圆', backgroundEffect: { type: 'stars', intensity: 0.8 } },
    { month: 9, title: '国庆华诞', subtitle: '祖国万岁', backgroundEffect: { type: 'fireworks', intensity: 0.9 } },
    { month: 10, title: '感恩节', subtitle: '感恩有你', backgroundEffect: { type: 'hearts', intensity: 0.5 } },
    { month: 11, title: '圣诞元旦', subtitle: '双节同庆', backgroundEffect: { type: 'snow', intensity: 0.8 } },
  ],
};

/** 所有预设模板 */
export const STORYLINE_TEMPLATES: StorylineTemplate[] = [
  YEAR_IN_REVIEW_TEMPLATE,
  SEASONS_TEMPLATE,
  CELEBRATIONS_TEMPLATE,
];

// ============================================
// 模板操作函数
// ============================================

/** 获取所有模板 */
export function getAllTemplates(): StorylineTemplate[] {
  return STORYLINE_TEMPLATES;
}

/** 根据ID获取模板 */
export function getTemplateById(id: string): StorylineTemplate | undefined {
  return STORYLINE_TEMPLATES.find(t => t.id === id);
}

/** 应用模板到故事线配置 */
export function applyTemplate(
  templateId: string,
  year: number = new Date().getFullYear()
): StorylineConfig {
  const template = getTemplateById(templateId);
  const config = createDefaultStorylineConfig(year);
  
  if (!template) {
    return config;
  }
  
  // 更新配置名称
  config.name = `${year} ${template.name}`;
  
  // 应用模板到每个月份
  for (let i = 0; i < 12; i++) {
    const templateSlide = template.slides[i];
    if (templateSlide) {
      config.slides[i] = {
        ...config.slides[i],
        title: templateSlide.title || MONTH_NAMES[i],
        subtitle: templateSlide.subtitle,
        backgroundEffect: templateSlide.backgroundEffect || config.slides[i].backgroundEffect,
        elements: templateSlide.elements || [],
      };
      
      // 如果模板有自定义过渡效果
      if (templateSlide.customTransition) {
        config.slides[i].customTransition = templateSlide.customTransition;
      }
    }
  }
  
  config.updatedAt = Date.now();
  return config;
}

/** 为模板添加默认粒子文字 */
export function addDefaultParticleTexts(config: StorylineConfig): StorylineConfig {
  const newConfig = { ...config, slides: [...config.slides] };
  
  for (let i = 0; i < 12; i++) {
    const slide = newConfig.slides[i];
    // 如果幻灯片没有元素，添加一个默认的粒子文字
    if (slide.elements.length === 0) {
      const particleText = createParticleTextElement(slide.title, {
        position: [0, 0, 0],
        scale: 1,
        colorTheme: 'golden',
        particleCount: 2000,
        fontSize: 1,
        entranceAnimation: 'fade',
        entranceDelay: 500,
      });
      
      newConfig.slides[i] = {
        ...slide,
        elements: [particleText],
      };
    }
  }
  
  newConfig.updatedAt = Date.now();
  return newConfig;
}

/** 获取模板预览信息 */
export function getTemplatePreview(templateId: string): {
  name: string;
  description: string;
  thumbnail: string;
  monthPreviews: { month: number; title: string; background: BackgroundEffectType }[];
} | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  
  return {
    name: template.name,
    description: template.description,
    thumbnail: template.thumbnail,
    monthPreviews: template.slides.map((slide, index) => ({
      month: index,
      title: slide.title || MONTH_NAMES[index],
      background: slide.backgroundEffect?.type || 'stars',
    })),
  };
}
