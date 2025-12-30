/**
 * 分享配置适配器
 * 负责从 appStore 收集配置和将配置应用到 appStore
 */

import { useAppStore } from '@/stores/appStore';
import { useStorylineStore } from '@/stores/storylineStore';
import type {
  AppSettings,
  PhotoData,
  DecorSettings,
  FireworkConfig,
  VisualizerSettings,
  PlayMode,
  LyricsPosition,
  AutoTriggerConfig,
  PhotoWallSettings,
  StorylineConfig,
  TunnelConfig,
} from '@/types';
import { 
  DEFAULT_PHOTO_WALL_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_DECOR_SETTINGS,
  DEFAULT_FIREWORK_CONFIG,
  DEFAULT_VISUALIZER_SETTINGS,
  DEFAULT_AUTO_TRIGGER_CONFIG,
  DEFAULT_TUNNEL_CONFIG,
  createDefaultStorylineConfig,
} from '@/types';

/**
 * 分享配置接口
 * 包含所有需要保存和恢复的场景配置
 */
export interface ShareConfig {
  // 基础设置
  settings: AppSettings;
  
  // 照片数据
  photos: PhotoData[];
  
  // 装饰设置
  decorSettings: DecorSettings;
  
  // 烟花配置
  fireworkConfig: FireworkConfig;
  
  // 祝福语相关
  blessingMessages: string[];
  blessingColorStart: string;
  blessingColorEnd: string;
  
  // 截图水印
  screenshotWatermark: string;
  screenshotWatermarkEnabled: boolean;
  
  // 音乐相关
  musicPlayMode: PlayMode;
  lyricsPosition: LyricsPosition;
  currentSongId?: string;
  
  // 音频可视化设置
  visualizerSettings: VisualizerSettings;
  
  // 自动触发配置
  autoTriggerConfig: AutoTriggerConfig;
  
  // 照片墙设置
  photoWallSettings: PhotoWallSettings;
  
  // 故事线配置
  storylineConfig: StorylineConfig;
  tunnelConfig: TunnelConfig;
}

/**
 * 从 appStore 收集当前配置
 * @returns 当前场景的完整配置
 */
export function collectShareConfig(): ShareConfig {
  const state = useAppStore.getState();
  const storylineState = useStorylineStore.getState();
  
  return {
    settings: { ...state.settings },
    photos: state.photos.map(photo => ({ ...photo })),
    decorSettings: { ...state.decorSettings },
    fireworkConfig: { ...state.fireworkConfig },
    blessingMessages: [...state.blessingMessages],
    blessingColorStart: state.blessingColorStart,
    blessingColorEnd: state.blessingColorEnd,
    screenshotWatermark: state.screenshotWatermark,
    screenshotWatermarkEnabled: state.screenshotWatermarkEnabled,
    musicPlayMode: state.musicPlayMode,
    lyricsPosition: state.lyricsPosition,
    currentSongId: state.currentSong?.id,
    visualizerSettings: {
      enabled: state.visualizerSettings.enabled,
      spectrum: { ...state.visualizerSettings.spectrum },
      chromatic: {
        ...state.visualizerSettings.chromatic,
        colors: { ...state.visualizerSettings.chromatic.colors },
        audioSync: { ...state.visualizerSettings.chromatic.audioSync },
      },
    },
    autoTriggerConfig: {
      enabled: state.autoTriggerConfig.enabled,
      timezone: state.autoTriggerConfig.timezone,
      hasTriggered: state.autoTriggerConfig.hasTriggered,
      effects: { ...state.autoTriggerConfig.effects },
    },
    photoWallSettings: {
      ...state.photoWallSettings,
      text: { ...state.photoWallSettings.text },
      selectedPhotoIds: [...state.photoWallSettings.selectedPhotoIds],
      backgroundGradient: state.photoWallSettings.backgroundGradient 
        ? [...state.photoWallSettings.backgroundGradient] 
        : null,
    },
    // 故事线配置
    storylineConfig: JSON.parse(JSON.stringify(storylineState.storyline)),
    tunnelConfig: JSON.parse(JSON.stringify(storylineState.tunnelConfig)),
  };
}

/**
 * 将分享配置应用到 appStore
 * @param config 要应用的配置
 */
export function applyShareConfig(config: ShareConfig): void {
  const store = useAppStore.getState();
  
  if (config.settings) {
    store.updateSettings(config.settings);
  }
  
  if (config.photos && Array.isArray(config.photos)) {
    store.clearPhotos();
    config.photos.forEach(photo => {
      store.addPhoto(photo);
    });
  }
  
  if (config.decorSettings) {
    store.updateDecorSettings(config.decorSettings);
  }
  
  if (config.fireworkConfig) {
    store.updateFireworkConfig(config.fireworkConfig);
  }
  
  if (config.blessingMessages && Array.isArray(config.blessingMessages)) {
    store.setBlessingMessages(config.blessingMessages);
  }
  if (config.blessingColorStart || config.blessingColorEnd) {
    store.setBlessingColors(
      config.blessingColorStart || '#FFD700',
      config.blessingColorEnd || '#FF6B6B'
    );
  }
  
  if (config.screenshotWatermark !== undefined) {
    store.setScreenshotWatermark(config.screenshotWatermark);
  }
  if (config.screenshotWatermarkEnabled !== undefined) {
    store.setScreenshotWatermarkEnabled(config.screenshotWatermarkEnabled);
  }
  
  if (config.musicPlayMode) {
    store.setMusicPlayMode(config.musicPlayMode);
  }
  if (config.lyricsPosition) {
    store.setLyricsPosition(config.lyricsPosition);
  }
  
  if (config.visualizerSettings) {
    store.setVisualizerSettings({
      enabled: config.visualizerSettings.enabled,
    });
    if (config.visualizerSettings.spectrum) {
      store.setSpectrumSettings(config.visualizerSettings.spectrum);
    }
    if (config.visualizerSettings.chromatic) {
      store.setChromaticSettings({
        enabled: config.visualizerSettings.chromatic.enabled,
        intensity: config.visualizerSettings.chromatic.intensity,
        colors: config.visualizerSettings.chromatic.colors,
        target: config.visualizerSettings.chromatic.target,
        direction: config.visualizerSettings.chromatic.direction,
        audioSync: config.visualizerSettings.chromatic.audioSync,
      });
    }
  }
  
  if (config.autoTriggerConfig) {
    store.setAutoTriggerConfig({
      enabled: config.autoTriggerConfig.enabled,
      timezone: config.autoTriggerConfig.timezone,
      hasTriggered: config.autoTriggerConfig.hasTriggered,
    });
    if (config.autoTriggerConfig.effects) {
      store.setAutoTriggerEffects(config.autoTriggerConfig.effects);
    }
  }
  
  if (config.photoWallSettings) {
    const { text, ...topLevelSettings } = config.photoWallSettings;
    store.updatePhotoWallSettings(topLevelSettings);
    if (text) {
      store.updateWallTextSettings(text);
    }
  }
  
  // 应用故事线配置
  if (config.storylineConfig) {
    const storylineStore = useStorylineStore.getState();
    storylineStore.setStoryline(config.storylineConfig);
  }
  if (config.tunnelConfig) {
    const storylineStore = useStorylineStore.getState();
    storylineStore.updateTunnelConfig(config.tunnelConfig);
  }
}

/**
 * 将 ShareConfig 转换为 r2.ts 需要的格式
 * @param config 分享配置
 * @returns 适合 r2.ts uploadShare 的配置对象
 */
export function shareConfigToR2Format(config: ShareConfig): {
  photos: string[];
  config: Record<string, unknown>;
} {
  const photos = config.photos.map(photo => photo.url);
  
  // 收集故事线中的图片URL
  const storylineImageUrls: string[] = [];
  const storylineImageMapping: Record<string, number> = {}; // imageUrl -> index in storylineImageUrls
  
  if (config.storylineConfig) {
    config.storylineConfig.slides.forEach(slide => {
      slide.elements.forEach(element => {
        if (element.type === 'image' && element.imageUrl) {
          if (!(element.imageUrl in storylineImageMapping)) {
            storylineImageMapping[element.imageUrl] = storylineImageUrls.length;
            storylineImageUrls.push(element.imageUrl);
          }
        }
      });
    });
  }
  
  // 合并所有图片
  const allPhotos = [...photos, ...storylineImageUrls];
  
  const r2Config: Record<string, unknown> = {
    settings: config.settings,
    photoPositions: config.photos.map(photo => ({
      id: photo.id,
      position: photo.position,
      rotation: photo.rotation,
    })),
    decorSettings: config.decorSettings,
    fireworkConfig: config.fireworkConfig,
    blessingMessages: config.blessingMessages,
    blessingColorStart: config.blessingColorStart,
    blessingColorEnd: config.blessingColorEnd,
    screenshotWatermark: config.screenshotWatermark,
    screenshotWatermarkEnabled: config.screenshotWatermarkEnabled,
    musicPlayMode: config.musicPlayMode,
    lyricsPosition: config.lyricsPosition,
    currentSongId: config.currentSongId,
    visualizerSettings: config.visualizerSettings,
    autoTriggerConfig: config.autoTriggerConfig,
    photoWallSettings: config.photoWallSettings,
    // 故事线配置 - 图片URL替换为索引
    storylineConfig: config.storylineConfig ? {
      ...config.storylineConfig,
      slides: config.storylineConfig.slides.map(slide => ({
        ...slide,
        elements: slide.elements.map(element => {
          if (element.type === 'image' && element.imageUrl) {
            return {
              ...element,
              // 存储图片在 storylineImageUrls 中的索引（加上 photos.length 偏移）
              imageUrlIndex: photos.length + storylineImageMapping[element.imageUrl],
              imageUrl: undefined, // 移除原始URL
            };
          }
          return element;
        }),
      })),
    } : undefined,
    tunnelConfig: config.tunnelConfig,
    // 记录普通照片数量，用于恢复时区分
    mainPhotosCount: photos.length,
  };
  
  return { photos: allPhotos, config: r2Config };
}

/**
 * 从 r2.ts 格式转换回 ShareConfig
 * @param photos 照片 URL 数组
 * @param config r2 配置对象
 * @returns ShareConfig
 */
export function r2FormatToShareConfig(
  photos: string[],
  config: Record<string, unknown>
): ShareConfig {
  const photoPositions = (config.photoPositions as Array<{
    id: string;
    position: [number, number, number];
    rotation: number;
  }>) || [];
  
  // 获取主照片数量
  const mainPhotosCount = (config.mainPhotosCount as number) || photos.length;
  const mainPhotos = photos.slice(0, mainPhotosCount);
  
  const photoData: PhotoData[] = mainPhotos.map((url, index) => {
    const positionData = photoPositions[index] || {
      id: `photo-${index}`,
      position: [0, 0, 0] as [number, number, number],
      rotation: 0,
    };
    return {
      id: positionData.id,
      url,
      position: positionData.position,
      rotation: positionData.rotation,
    };
  });
  
  // 恢复故事线配置中的图片URL
  let storylineConfig = config.storylineConfig as StorylineConfig | undefined;
  if (storylineConfig) {
    storylineConfig = {
      ...storylineConfig,
      slides: storylineConfig.slides.map(slide => ({
        ...slide,
        elements: slide.elements.map(element => {
          if (element.type === 'image' && 'imageUrlIndex' in element) {
            const imageUrlIndex = (element as unknown as { imageUrlIndex: number }).imageUrlIndex;
            return {
              ...element,
              imageUrl: photos[imageUrlIndex] || '',
              imageUrlIndex: undefined,
            };
          }
          return element;
        }),
      })),
    };
  }
  
  // 合并 settings，确保新字段有默认值
  const mergedSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...((config.settings as Partial<AppSettings>) || {}),
  };
  
  return {
    settings: mergedSettings,
    photos: photoData,
    decorSettings: (config.decorSettings as DecorSettings) || DEFAULT_DECOR_SETTINGS,
    fireworkConfig: (config.fireworkConfig as FireworkConfig) || DEFAULT_FIREWORK_CONFIG,
    blessingMessages: (config.blessingMessages as string[]) || ['新年快乐！', '万事如意！', '心想事成！'],
    blessingColorStart: (config.blessingColorStart as string) || '#FFD700',
    blessingColorEnd: (config.blessingColorEnd as string) || '#FF6B6B',
    screenshotWatermark: (config.screenshotWatermark as string) || '2026 新年快乐',
    screenshotWatermarkEnabled: config.screenshotWatermarkEnabled !== false,
    musicPlayMode: (config.musicPlayMode as PlayMode) || 'list-repeat',
    lyricsPosition: (config.lyricsPosition as LyricsPosition) || 'player',
    currentSongId: config.currentSongId as string | undefined,
    visualizerSettings: (config.visualizerSettings as VisualizerSettings) || DEFAULT_VISUALIZER_SETTINGS,
    autoTriggerConfig: (config.autoTriggerConfig as AutoTriggerConfig) || DEFAULT_AUTO_TRIGGER_CONFIG,
    photoWallSettings: (config.photoWallSettings as PhotoWallSettings) || DEFAULT_PHOTO_WALL_SETTINGS,
    // 故事线配置
    storylineConfig: storylineConfig || createDefaultStorylineConfig(),
    tunnelConfig: (config.tunnelConfig as TunnelConfig) || DEFAULT_TUNNEL_CONFIG,
  };
}
