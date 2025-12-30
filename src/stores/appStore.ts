import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppSettings,
  PhotoData,
  Song,
  GestureState,
  CountdownData,
  DeviceInfo,
  EffectType,
  DecorSettings,
  FireworkConfig,
  FireworkTriggerState,
  CelebrationState,
  OnboardingState,
  TouchGestureState,
  CelebrationPhase,
  PlayMode,
  LyricsPosition,
  AutoTriggerConfig,
  CelebrationEffectConfig,
  TimezoneOption,
  VisualizerSettings,
  SpectrumSettings,
  ChromaticSettings,
  PhotoWallSettings,
  WallTextSettings,
} from '@/types';
import {
  DEFAULT_SETTINGS,
  MAX_PHOTO_COUNT,
  DEFAULT_DECOR_SETTINGS,
  DEFAULT_FIREWORK_CONFIG,
  DEFAULT_CELEBRATION_STATE,
  DEFAULT_ONBOARDING_STATE,
  DEFAULT_TOUCH_GESTURE_STATE,
  DEFAULT_SETTINGS_EXTENDED,
  DEFAULT_PLAY_MODE,
  DEFAULT_LYRICS_POSITION,
  DEFAULT_AUTO_TRIGGER_CONFIG,
  DEFAULT_VISUALIZER_SETTINGS,
  DEFAULT_PHOTO_WALL_SETTINGS,
} from '@/types';
import * as photoStorage from '@/services/photoStorageService';

// ============================================
// Store 状态接口
// ============================================

interface AppState {
  // 设置
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // 照片
  photos: PhotoData[];
  addPhoto: (photo: PhotoData) => boolean;
  removePhoto: (id: string) => void;
  updatePhotoPosition: (id: string, position: [number, number, number]) => void;
  clearPhotos: () => void;
  
  // 音乐
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  playlist: Song[];
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  setPlaylist: (songs: Song[]) => void;
  
  // 手势
  gestureState: GestureState;
  setGestureState: (state: Partial<GestureState>) => void;
  
  // 手势移动相机
  palmMove: { x: number; y: number } | null;
  setPalmMove: (move: { x: number; y: number } | null) => void;
  zoomDelta: number;
  setZoomDelta: (delta: number) => void;
  
  // 相机重置
  cameraResetRequested: boolean;
  setCameraResetRequested: (requested: boolean) => void;
  requestCameraReset: () => void;
  
  // 特效
  activeEffects: Set<EffectType>;
  triggerEffect: (effect: EffectType) => void;
  clearEffect: (effect: EffectType) => void;
  
  // 倒计时
  countdown: CountdownData;
  setCountdown: (data: CountdownData) => void;
  
  // 手动倒计时
  isManualCountdownActive: boolean;
  startManualCountdown: () => void;
  stopManualCountdown: () => void;
  
  // 倒计时脉冲效果
  countdownPulse: {
    active: boolean;
    currentNumber: number;  // 当前倒计时数字
    intensity: number;      // 脉冲强度 (0-1)，越接近0越强
    timestamp: number;      // 触发时间戳
  };
  triggerCountdownPulse: (currentNumber: number, totalDuration: number) => void;
  clearCountdownPulse: () => void;
  
  // 粒子散开/聚合
  isParticleSpread: boolean;
  toggleParticleSpread: () => void;
  
  // 设备
  deviceInfo: DeviceInfo | null;
  setDeviceInfo: (info: DeviceInfo) => void;
  
  // UI 状态
  isSettingsOpen: boolean;
  isShareModalOpen: boolean;
  isLoading: boolean;
  loadingProgress: number;
  selectedPhotoId: string | null;
  setSettingsOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setSelectedPhotoId: (id: string | null) => void;
  
  // 装饰设置
  decorSettings: DecorSettings;
  updateDecorSettings: (settings: Partial<DecorSettings>) => void;
  resetDecorSettings: () => void;
  
  // 烟花设置
  fireworkConfig: FireworkConfig;
  fireworkTriggerState: FireworkTriggerState;
  celebrationStartTime: number | null;
  updateFireworkConfig: (config: Partial<FireworkConfig>) => void;
  resetFireworkConfig: () => void;
  setFireworkTriggerState: (state: Partial<FireworkTriggerState>) => void;
  setCelebrationStartTime: (time: number | null) => void;
  
  // 庆祝序列状态
  celebrationState: CelebrationState;
  setCelebrationState: (state: Partial<CelebrationState>) => void;
  startCelebration: () => void;
  endCelebration: () => void;
  setCelebrationPhase: (phase: CelebrationPhase) => void;
  
  // 引导教程状态
  onboardingState: OnboardingState;
  setOnboardingStep: (step: number) => void;
  setOnboardingComplete: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  
  // 触摸手势状态
  touchGestureState: TouchGestureState;
  setTouchGestureState: (state: Partial<TouchGestureState>) => void;
  resetTouchGestureState: () => void;
  
  // 扩展设置
  blessingMessages: string[];
  setBlessingMessages: (messages: string[]) => void;
  blessingColorStart: string;
  blessingColorEnd: string;
  setBlessingColors: (start: string, end: string) => void;
  screenshotWatermark: string;
  screenshotWatermarkEnabled: boolean;
  setScreenshotWatermark: (text: string) => void;
  setScreenshotWatermarkEnabled: (enabled: boolean) => void;
  
  // 音乐播放模式
  musicPlayMode: PlayMode;
  setMusicPlayMode: (mode: PlayMode) => void;
  
  // 歌词显示位置
  lyricsPosition: LyricsPosition;
  setLyricsPosition: (position: LyricsPosition) => void;
  
  // 自动触发配置
  autoTriggerConfig: AutoTriggerConfig;
  setAutoTriggerConfig: (config: Partial<AutoTriggerConfig>) => void;
  setAutoTriggerEnabled: (enabled: boolean) => void;
  setAutoTriggerTimezone: (timezone: TimezoneOption) => void;
  setAutoTriggerEffects: (effects: Partial<CelebrationEffectConfig>) => void;
  setAutoTriggerHasTriggered: (hasTriggered: boolean) => void;
  resetAutoTriggerForNewYear: () => void;
  
  // 音频可视化设置
  visualizerSettings: VisualizerSettings;
  setVisualizerSettings: (settings: Partial<VisualizerSettings>) => void;
  setVisualizerEnabled: (enabled: boolean) => void;
  setSpectrumSettings: (settings: Partial<SpectrumSettings>) => void;
  setChromaticSettings: (settings: Partial<ChromaticSettings>) => void;
  resetVisualizerSettings: () => void;
  
  // 照片墙设置
  photoWallSettings: PhotoWallSettings;
  updatePhotoWallSettings: (settings: Partial<PhotoWallSettings>) => void;
  resetPhotoWallSettings: () => void;
  updateWallTextSettings: (settings: Partial<WallTextSettings>) => void;
  toggleWallPhotoSelection: (photoId: string) => void;
  setWallPhotoSelection: (photoIds: string[]) => void;
  selectAllWallPhotos: () => void;
  clearWallPhotoSelection: () => void;
  
  // Demo 模式（隐藏按钮）
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

// ============================================
// 创建 Store
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ========== 设置 ==========
      settings: DEFAULT_SETTINGS,
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },
      
      // ========== 照片 ==========
      photos: [],
      
      addPhoto: (photo) => {
        const { photos } = get();
        if (photos.length >= MAX_PHOTO_COUNT) {
          return false;
        }
        // 检查 ID 是否已存在
        if (photos.some((p) => p.id === photo.id)) {
          return false;
        }
        const newPhotos = [...photos, photo];
        set({ photos: newPhotos });
        // 异步保存到 IndexedDB
        photoStorage.savePhotos(newPhotos);
        return true;
      },
      
      removePhoto: (id) => {
        set((state) => {
          const newPhotos = state.photos.filter((p) => p.id !== id);
          // 异步保存到 IndexedDB
          photoStorage.savePhotos(newPhotos);
          return { photos: newPhotos };
        });
      },
      
      updatePhotoPosition: (id, position) => {
        set((state) => {
          const newPhotos = state.photos.map((p) =>
            p.id === id ? { ...p, position } : p
          );
          // 异步保存到 IndexedDB
          photoStorage.savePhotos(newPhotos);
          return { photos: newPhotos };
        });
      },
      
      clearPhotos: () => {
        set({ photos: [] });
        // 异步清空 IndexedDB
        photoStorage.clearPhotos();
      },
      
      // ========== 音乐 ==========
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      playlist: [],
      
      setCurrentSong: (song) => {
        set({ currentSong: song, currentTime: 0 });
      },
      
      setIsPlaying: (playing) => {
        set({ isPlaying: playing });
      },
      
      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },
      
      setCurrentTime: (time) => {
        set({ currentTime: time });
      },
      
      nextSong: () => {
        const { playlist, currentSong } = get();
        if (playlist.length === 0) return;
        
        const currentIndex = currentSong
          ? playlist.findIndex((s) => s.id === currentSong.id)
          : -1;
        const nextIndex = (currentIndex + 1) % playlist.length;
        set({ currentSong: playlist[nextIndex], currentTime: 0 });
      },
      
      prevSong: () => {
        const { playlist, currentSong } = get();
        if (playlist.length === 0) return;
        
        const currentIndex = currentSong
          ? playlist.findIndex((s) => s.id === currentSong.id)
          : 0;
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        set({ currentSong: playlist[prevIndex], currentTime: 0 });
      },
      
      setPlaylist: (songs) => {
        set({ playlist: songs });
        if (songs.length > 0 && !get().currentSong) {
          set({ currentSong: songs[0] });
        }
      },
      
      // ========== 手势 ==========
      gestureState: {
        isActive: false,
        currentGesture: 'none',
        confidence: 0,
      },
      
      setGestureState: (state) => {
        set((prev) => ({
          gestureState: { ...prev.gestureState, ...state },
        }));
      },
      
      // ========== 手势移动相机 ==========
      palmMove: null,
      
      setPalmMove: (move) => {
        set({ palmMove: move });
      },
      
      zoomDelta: 0,
      
      setZoomDelta: (delta) => {
        set({ zoomDelta: delta });
      },
      
      // ========== 相机重置 ==========
      cameraResetRequested: false,
      
      setCameraResetRequested: (requested) => {
        set({ cameraResetRequested: requested });
      },
      
      requestCameraReset: () => {
        set({ cameraResetRequested: true });
      },
      
      // ========== 特效 ==========
      activeEffects: new Set(),
      
      triggerEffect: (effect) => {
        set((state) => {
          const newEffects = new Set(state.activeEffects);
          newEffects.add(effect);
          return { activeEffects: newEffects };
        });
      },
      
      clearEffect: (effect) => {
        set((state) => {
          const newEffects = new Set(state.activeEffects);
          newEffects.delete(effect);
          return { activeEffects: newEffects };
        });
      },
      
      // ========== 倒计时 ==========
      countdown: {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isFinished: false,
        isLastTenSeconds: false,
      },
      
      setCountdown: (data) => {
        set({ countdown: data });
      },
      
      // ========== 手动倒计时 ==========
      isManualCountdownActive: false,
      
      startManualCountdown: () => {
        set({ isManualCountdownActive: true });
        // 开始倒计时时重置相机，确保正对着倒计时
        get().requestCameraReset();
      },
      
      stopManualCountdown: () => {
        set({ isManualCountdownActive: false });
        // 手动倒计时结束后重置相机
        get().requestCameraReset();
        // 清除脉冲效果
        get().clearCountdownPulse();
      },
      
      // ========== 倒计时脉冲效果 ==========
      countdownPulse: {
        active: false,
        currentNumber: 0,
        intensity: 0,
        timestamp: 0,
      },
      
      triggerCountdownPulse: (currentNumber: number, totalDuration: number) => {
        // 计算强度：越接近0，强度越大 (0.3 到 1.0)
        const intensity = 0.3 + (1 - currentNumber / totalDuration) * 0.7;
        set({
          countdownPulse: {
            active: true,
            currentNumber,
            intensity,
            timestamp: Date.now(),
          }
        });
      },
      
      clearCountdownPulse: () => {
        set({
          countdownPulse: {
            active: false,
            currentNumber: 0,
            intensity: 0,
            timestamp: 0,
          }
        });
      },
      
      // ========== 粒子散开/聚合 ==========
      isParticleSpread: false,
      
      toggleParticleSpread: () => {
        set((state) => ({ isParticleSpread: !state.isParticleSpread }));
      },
      
      // ========== 设备 ==========
      deviceInfo: null,
      
      setDeviceInfo: (info) => {
        set({ deviceInfo: info });
      },
      
      // ========== UI 状态 ==========
      isSettingsOpen: false,
      isShareModalOpen: false,
      isLoading: true,
      loadingProgress: 0,
      selectedPhotoId: null,
      
      setSettingsOpen: (open) => {
        set({ isSettingsOpen: open });
      },
      
      setShareModalOpen: (open) => {
        set({ isShareModalOpen: open });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setLoadingProgress: (progress) => {
        set({ loadingProgress: progress });
      },
      
      setSelectedPhotoId: (id) => {
        set({ selectedPhotoId: id });
      },
      
      // ========== 装饰设置 ==========
      decorSettings: DEFAULT_DECOR_SETTINGS,
      
      updateDecorSettings: (newSettings) => {
        set((state) => ({
          decorSettings: { ...state.decorSettings, ...newSettings },
        }));
      },
      
      resetDecorSettings: () => {
        set({ decorSettings: DEFAULT_DECOR_SETTINGS });
      },
      
      // ========== 烟花设置 ==========
      fireworkConfig: DEFAULT_FIREWORK_CONFIG,
      fireworkTriggerState: {
        phase: 'idle',
        lastLaunchTime: 0,
        burstTriggered: false,
      },
      celebrationStartTime: null,
      
      updateFireworkConfig: (newConfig) => {
        set((state) => ({
          fireworkConfig: { ...state.fireworkConfig, ...newConfig },
        }));
      },
      
      resetFireworkConfig: () => {
        set({ fireworkConfig: DEFAULT_FIREWORK_CONFIG });
      },
      
      setFireworkTriggerState: (newState) => {
        set((state) => ({
          fireworkTriggerState: { ...state.fireworkTriggerState, ...newState },
        }));
      },
      
      setCelebrationStartTime: (time) => {
        set({ celebrationStartTime: time });
      },
      
      // ========== 庆祝序列状态 ==========
      celebrationState: DEFAULT_CELEBRATION_STATE,
      
      setCelebrationState: (newState) => {
        set((state) => ({
          celebrationState: { ...state.celebrationState, ...newState },
        }));
      },
      
      startCelebration: () => {
        set({
          celebrationState: {
            isActive: true,
            phase: 'firework_burst',
            startTime: Date.now(),
            duration: (get().settings as any).celebrationDuration 
              ? (get().settings as any).celebrationDuration * 1000 
              : 30000,
          },
        });
      },
      
      endCelebration: () => {
        set({
          celebrationState: DEFAULT_CELEBRATION_STATE,
        });
        // 庆祝结束后重置相机
        get().requestCameraReset();
      },
      
      setCelebrationPhase: (phase) => {
        set((state) => ({
          celebrationState: { ...state.celebrationState, phase },
        }));
      },
      
      // ========== 引导教程状态 ==========
      onboardingState: DEFAULT_ONBOARDING_STATE,
      
      setOnboardingStep: (step) => {
        set((state) => ({
          onboardingState: { ...state.onboardingState, currentStep: step },
        }));
      },
      
      setOnboardingComplete: () => {
        set({
          onboardingState: {
            hasCompleted: true,
            currentStep: 0,
            skipped: false,
          },
        });
      },
      
      skipOnboarding: () => {
        set({
          onboardingState: {
            hasCompleted: true,
            currentStep: 0,
            skipped: true,
          },
        });
      },
      
      resetOnboarding: () => {
        set({
          onboardingState: DEFAULT_ONBOARDING_STATE,
        });
      },
      
      // ========== 触摸手势状态 ==========
      touchGestureState: DEFAULT_TOUCH_GESTURE_STATE,
      
      setTouchGestureState: (newState) => {
        set((state) => ({
          touchGestureState: { ...state.touchGestureState, ...newState },
        }));
      },
      
      resetTouchGestureState: () => {
        set({ touchGestureState: DEFAULT_TOUCH_GESTURE_STATE });
      },
      
      // ========== 扩展设置 ==========
      blessingMessages: DEFAULT_SETTINGS_EXTENDED.blessingMessages || ['新年快乐！', '万事如意！', '心想事成！'],
      
      setBlessingMessages: (messages) => {
        set({ blessingMessages: messages });
      },
      
      blessingColorStart: '#FFD700',
      blessingColorEnd: '#FF6B6B',
      
      setBlessingColors: (start, end) => {
        set({ blessingColorStart: start, blessingColorEnd: end });
      },
      
      screenshotWatermark: DEFAULT_SETTINGS_EXTENDED.screenshotWatermark || '2026 新年快乐',
      screenshotWatermarkEnabled: DEFAULT_SETTINGS_EXTENDED.screenshotWatermarkEnabled ?? true,
      
      setScreenshotWatermark: (text) => {
        set({ screenshotWatermark: text });
      },
      
      setScreenshotWatermarkEnabled: (enabled) => {
        set({ screenshotWatermarkEnabled: enabled });
      },
      
      // ========== 音乐播放模式 ==========
      musicPlayMode: DEFAULT_PLAY_MODE,
      
      setMusicPlayMode: (mode) => {
        set({ musicPlayMode: mode });
      },
      
      // ========== 歌词显示位置 ==========
      lyricsPosition: DEFAULT_LYRICS_POSITION,
      
      setLyricsPosition: (position) => {
        set({ lyricsPosition: position });
      },
      
      // ========== 自动触发配置 ==========
      autoTriggerConfig: DEFAULT_AUTO_TRIGGER_CONFIG,
      
      setAutoTriggerConfig: (config) => {
        set((state) => ({
          autoTriggerConfig: { ...state.autoTriggerConfig, ...config },
        }));
      },
      
      setAutoTriggerEnabled: (enabled) => {
        set((state) => ({
          autoTriggerConfig: { ...state.autoTriggerConfig, enabled },
        }));
      },
      
      setAutoTriggerTimezone: (timezone) => {
        set((state) => ({
          autoTriggerConfig: { ...state.autoTriggerConfig, timezone },
        }));
      },
      
      setAutoTriggerEffects: (effects) => {
        set((state) => ({
          autoTriggerConfig: {
            ...state.autoTriggerConfig,
            effects: { ...state.autoTriggerConfig.effects, ...effects },
          },
        }));
      },
      
      setAutoTriggerHasTriggered: (hasTriggered) => {
        set((state) => ({
          autoTriggerConfig: { ...state.autoTriggerConfig, hasTriggered },
        }));
      },
      
      resetAutoTriggerForNewYear: () => {
        set((state) => ({
          autoTriggerConfig: { ...state.autoTriggerConfig, hasTriggered: false },
        }));
      },
      
      // ========== 音频可视化设置 ==========
      visualizerSettings: DEFAULT_VISUALIZER_SETTINGS,
      
      setVisualizerSettings: (newSettings) => {
        set((state) => ({
          visualizerSettings: { ...state.visualizerSettings, ...newSettings },
        }));
      },
      
      setVisualizerEnabled: (enabled) => {
        set((state) => ({
          visualizerSettings: { ...state.visualizerSettings, enabled },
        }));
      },
      
      setSpectrumSettings: (settings) => {
        set((state) => ({
          visualizerSettings: {
            ...state.visualizerSettings,
            spectrum: { ...state.visualizerSettings.spectrum, ...settings },
          },
        }));
      },
      
      setChromaticSettings: (settings) => {
        set((state) => ({
          visualizerSettings: {
            ...state.visualizerSettings,
            chromatic: { ...state.visualizerSettings.chromatic, ...settings },
          },
        }));
      },
      
      resetVisualizerSettings: () => {
        set({ visualizerSettings: DEFAULT_VISUALIZER_SETTINGS });
      },
      
      // ========== 照片墙设置 ==========
      photoWallSettings: DEFAULT_PHOTO_WALL_SETTINGS,
      
      updatePhotoWallSettings: (newSettings) => {
        set((state) => ({
          photoWallSettings: { ...state.photoWallSettings, ...newSettings },
        }));
      },
      
      resetPhotoWallSettings: () => {
        set({ photoWallSettings: DEFAULT_PHOTO_WALL_SETTINGS });
      },
      
      updateWallTextSettings: (newSettings) => {
        set((state) => ({
          photoWallSettings: {
            ...state.photoWallSettings,
            text: { ...state.photoWallSettings.text, ...newSettings },
          },
        }));
      },
      
      toggleWallPhotoSelection: (photoId) => {
        set((state) => {
          const currentIds = state.photoWallSettings.selectedPhotoIds;
          const isSelected = currentIds.includes(photoId);
          const newIds = isSelected
            ? currentIds.filter((id) => id !== photoId)
            : [...currentIds, photoId];
          return {
            photoWallSettings: {
              ...state.photoWallSettings,
              selectedPhotoIds: newIds,
            },
          };
        });
      },
      
      setWallPhotoSelection: (photoIds) => {
        set((state) => ({
          photoWallSettings: {
            ...state.photoWallSettings,
            selectedPhotoIds: photoIds,
          },
        }));
      },
      
      selectAllWallPhotos: () => {
        const { photos } = get();
        set((state) => ({
          photoWallSettings: {
            ...state.photoWallSettings,
            selectedPhotoIds: photos.map((p) => p.id),
          },
        }));
      },
      
      clearWallPhotoSelection: () => {
        set((state) => ({
          photoWallSettings: {
            ...state.photoWallSettings,
            selectedPhotoIds: [],
          },
        }));
      },
      
      // ========== Demo 模式 ==========
      isDemoMode: false,
      toggleDemoMode: () => {
        set((state) => ({ isDemoMode: !state.isDemoMode }));
      },
    }),
    {
      name: 'nye-countdown-storage',
      partialize: (state) => ({
        settings: state.settings,
        // photos 不再存储在 localStorage，改用 IndexedDB
        decorSettings: state.decorSettings,
        fireworkConfig: state.fireworkConfig,
        onboardingState: state.onboardingState,
        blessingMessages: state.blessingMessages,
        blessingColorStart: state.blessingColorStart,
        blessingColorEnd: state.blessingColorEnd,
        screenshotWatermark: state.screenshotWatermark,
        screenshotWatermarkEnabled: state.screenshotWatermarkEnabled,
        musicPlayMode: state.musicPlayMode,
        lyricsPosition: state.lyricsPosition,
        visualizerSettings: state.visualizerSettings,
        autoTriggerConfig: state.autoTriggerConfig,
        photoWallSettings: state.photoWallSettings,
      }),
      // 合并存储的数据与默认值，确保新字段有默认值
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>;
        return {
          ...currentState,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(persisted.settings || {}),
          },
          // photos 从 IndexedDB 加载，这里保持空数组
          photos: [],
          decorSettings: {
            ...DEFAULT_DECOR_SETTINGS,
            ...(persisted.decorSettings || {}),
          },
          fireworkConfig: {
            ...DEFAULT_FIREWORK_CONFIG,
            ...(persisted.fireworkConfig || {}),
          },
          onboardingState: {
            ...DEFAULT_ONBOARDING_STATE,
            ...(persisted.onboardingState || {}),
          },
          blessingMessages: persisted.blessingMessages || DEFAULT_SETTINGS_EXTENDED.blessingMessages || ['新年快乐！', '万事如意！', '心想事成！'],
          blessingColorStart: (persisted as any).blessingColorStart || '#FFD700',
          blessingColorEnd: (persisted as any).blessingColorEnd || '#FF6B6B',
          screenshotWatermark: persisted.screenshotWatermark || DEFAULT_SETTINGS_EXTENDED.screenshotWatermark || '2026 新年快乐',
          screenshotWatermarkEnabled: persisted.screenshotWatermarkEnabled ?? DEFAULT_SETTINGS_EXTENDED.screenshotWatermarkEnabled ?? true,
          musicPlayMode: persisted.musicPlayMode || DEFAULT_PLAY_MODE,
          lyricsPosition: persisted.lyricsPosition || DEFAULT_LYRICS_POSITION,
          autoTriggerConfig: {
            ...DEFAULT_AUTO_TRIGGER_CONFIG,
            ...((persisted as any).autoTriggerConfig || {}),
            effects: {
              ...DEFAULT_AUTO_TRIGGER_CONFIG.effects,
              ...((persisted as any).autoTriggerConfig?.effects || {}),
            },
          },
          visualizerSettings: {
            ...DEFAULT_VISUALIZER_SETTINGS,
            ...((persisted as any).visualizerSettings || {}),
            spectrum: {
              ...DEFAULT_VISUALIZER_SETTINGS.spectrum,
              ...((persisted as any).visualizerSettings?.spectrum || {}),
            },
            chromatic: {
              ...DEFAULT_VISUALIZER_SETTINGS.chromatic,
              ...((persisted as any).visualizerSettings?.chromatic || {}),
              colors: {
                ...DEFAULT_VISUALIZER_SETTINGS.chromatic.colors,
                ...((persisted as any).visualizerSettings?.chromatic?.colors || {}),
              },
              audioSync: {
                ...DEFAULT_VISUALIZER_SETTINGS.chromatic.audioSync,
                ...((persisted as any).visualizerSettings?.chromatic?.audioSync || {}),
              },
            },
          },
          photoWallSettings: {
            ...DEFAULT_PHOTO_WALL_SETTINGS,
            ...((persisted as any).photoWallSettings || {}),
            text: {
              ...DEFAULT_PHOTO_WALL_SETTINGS.text,
              ...((persisted as any).photoWallSettings?.text || {}),
            },
          },
        };
      },
    }
  )
);

// ============================================
// 选择器 Hooks
// ============================================

export const useSettings = () => useAppStore((state) => state.settings);
export const usePhotos = () => useAppStore((state) => state.photos);
export const useMusic = () => useAppStore((state) => ({
  currentSong: state.currentSong,
  isPlaying: state.isPlaying,
  currentTime: state.currentTime,
  playlist: state.playlist,
}));
export const useCountdown = () => useAppStore((state) => state.countdown);
export const useGesture = () => useAppStore((state) => state.gestureState);
export const useActiveEffects = () => useAppStore((state) => state.activeEffects);
export const useDecorSettings = () => useAppStore((state) => state.decorSettings);
export const useFireworkConfig = () => useAppStore((state) => state.fireworkConfig);
export const useFireworkTriggerState = () => useAppStore((state) => state.fireworkTriggerState);
export const useCelebrationState = () => useAppStore((state) => state.celebrationState);
export const useOnboardingState = () => useAppStore((state) => state.onboardingState);
export const useTouchGestureState = () => useAppStore((state) => state.touchGestureState);
export const useBlessingMessages = () => useAppStore((state) => state.blessingMessages);
export const useBlessingColors = () => useAppStore((state) => ({
  start: state.blessingColorStart,
  end: state.blessingColorEnd,
}));
export const useScreenshotConfig = () => useAppStore((state) => ({
  watermark: state.screenshotWatermark,
  watermarkEnabled: state.screenshotWatermarkEnabled,
}));
export const useMusicPlayMode = () => useAppStore((state) => state.musicPlayMode);
export const useLyricsPosition = () => useAppStore((state) => state.lyricsPosition);
export const useAutoTriggerConfig = () => useAppStore((state) => state.autoTriggerConfig);
export const useVisualizerSettings = () => useAppStore((state) => state.visualizerSettings);
export const useSpectrumSettings = () => useAppStore((state) => state.visualizerSettings.spectrum);
export const useChromaticSettings = () => useAppStore((state) => state.visualizerSettings.chromatic);
export const usePhotoWallSettings = () => useAppStore((state) => state.photoWallSettings);
