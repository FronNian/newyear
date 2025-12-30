import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StorylineConfig,
  MonthSlideConfig,
  SlideElement,
  TunnelConfig,
} from '@/types';
import {
  createDefaultStorylineConfig,
  STORYLINE_STORAGE_KEY,
  MAX_IMAGES_PER_SLIDE,
  DEFAULT_TUNNEL_CONFIG,
} from '@/types';
import {
  getConfiguredMonths,
  hasConfiguredMonths,
} from '@/services/storylineService';

// ============================================
// Store 状态接口
// ============================================

interface StorylineState {
  // 故事线配置
  storyline: StorylineConfig;
  
  // 隧道配置
  tunnelConfig: TunnelConfig;
  
  // 播放状态
  currentMonth: number;  // 0-11 实际月份索引
  currentMonthIndex: number;  // 在 configuredMonths 中的索引
  isPlaying: boolean;
  isStorylineMode: boolean;  // 是否处于故事线模式
  transitionState: 'idle' | 'entering' | 'active' | 'exiting';
  
  // 编辑状态
  isEditing: boolean;
  editingMonth: number | null;
  
  // 计算属性 getter
  getConfiguredMonths: () => number[];
  hasConfiguredMonths: () => boolean;
  
  // 故事线配置操作
  setStoryline: (config: StorylineConfig) => void;
  updateStorylineName: (name: string) => void;
  updateGlobalSettings: (settings: Partial<StorylineConfig['globalSettings']>) => void;
  resetStoryline: () => void;
  
  // 隧道配置操作
  updateTunnelConfig: (config: Partial<TunnelConfig>) => void;
  setMonthTunnelColor: (month: number, color: string) => void;
  
  // 月份幻灯片操作
  updateMonthSlide: (month: number, slide: Partial<MonthSlideConfig>) => void;
  addElement: (month: number, element: SlideElement) => boolean;
  updateElement: (month: number, elementId: string, updates: Partial<SlideElement>) => void;
  removeElement: (month: number, elementId: string) => void;
  reorderElement: (month: number, elementId: string, direction: 'up' | 'down') => void;
  
  // 播放控制
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextMonth: () => void;
  prevMonth: () => void;
  setCurrentMonth: (month: number) => void;
  setTransitionState: (state: 'idle' | 'entering' | 'active' | 'exiting') => void;
  
  // 新增：已配置月份导航
  nextConfiguredMonth: () => void;
  prevConfiguredMonth: () => void;
  navigateToConfiguredMonth: (index: number) => void;
  
  // 模式切换
  enterStorylineMode: () => void;
  exitStorylineMode: () => void;
  
  // 编辑操作
  startEditing: (month?: number) => void;
  stopEditing: () => void;
  setEditingMonth: (month: number | null) => void;
}

// ============================================
// 创建 Store
// ============================================

export const useStorylineStore = create<StorylineState>()(
  persist(
    (set, get) => ({
      // ========== 初始状态 ==========
      storyline: createDefaultStorylineConfig(),
      tunnelConfig: { ...DEFAULT_TUNNEL_CONFIG },
      currentMonth: 0,
      currentMonthIndex: 0,
      isPlaying: false,
      isStorylineMode: false,
      transitionState: 'idle',
      isEditing: false,
      editingMonth: null,
      
      // ========== 计算属性 ==========
      getConfiguredMonths: () => {
        const { storyline } = get();
        return getConfiguredMonths(storyline);
      },
      
      hasConfiguredMonths: () => {
        const { storyline } = get();
        return hasConfiguredMonths(storyline);
      },
      
      // ========== 故事线配置操作 ==========
      setStoryline: (config) => {
        set({
          storyline: {
            ...config,
            updatedAt: Date.now(),
          },
        });
      },
      
      updateStorylineName: (name) => {
        set((state) => ({
          storyline: {
            ...state.storyline,
            name,
            updatedAt: Date.now(),
          },
        }));
      },
      
      updateGlobalSettings: (settings) => {
        set((state) => ({
          storyline: {
            ...state.storyline,
            globalSettings: {
              ...state.storyline.globalSettings,
              ...settings,
            },
            updatedAt: Date.now(),
          },
        }));
      },
      
      resetStoryline: () => {
        set({
          storyline: createDefaultStorylineConfig(),
          tunnelConfig: { ...DEFAULT_TUNNEL_CONFIG },
          currentMonth: 0,
          currentMonthIndex: 0,
          isPlaying: false,
        });
      },
      
      // ========== 隧道配置操作 ==========
      updateTunnelConfig: (config) => {
        set((state) => ({
          tunnelConfig: {
            ...state.tunnelConfig,
            ...config,
          },
        }));
      },
      
      setMonthTunnelColor: (month, color) => {
        if (month < 0 || month > 11) return;
        
        set((state) => ({
          tunnelConfig: {
            ...state.tunnelConfig,
            colors: {
              ...state.tunnelConfig.colors,
              monthColors: {
                ...state.tunnelConfig.colors.monthColors,
                [month]: color,
              },
            },
          },
        }));
      },
      
      // ========== 月份幻灯片操作 ==========
      updateMonthSlide: (month, slideUpdates) => {
        if (month < 0 || month > 11) return;
        
        set((state) => {
          const newSlides = [...state.storyline.slides];
          newSlides[month] = {
            ...newSlides[month],
            ...slideUpdates,
          };
          
          return {
            storyline: {
              ...state.storyline,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          };
        });
      },
      
      addElement: (month, element) => {
        if (month < 0 || month > 11) return false;
        
        const state = get();
        const slide = state.storyline.slides[month];
        
        // 检查图片数量限制
        if (element.type === 'image') {
          const imageCount = slide.elements.filter(e => e.type === 'image').length;
          if (imageCount >= MAX_IMAGES_PER_SLIDE) {
            return false;
          }
        }
        
        set((state) => {
          const newSlides = [...state.storyline.slides];
          newSlides[month] = {
            ...newSlides[month],
            elements: [...newSlides[month].elements, element],
          };
          
          return {
            storyline: {
              ...state.storyline,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          };
        });
        
        return true;
      },
      
      updateElement: (month, elementId, updates) => {
        if (month < 0 || month > 11) return;
        
        set((state) => {
          const newSlides = [...state.storyline.slides];
          const slide = newSlides[month];
          const elementIndex = slide.elements.findIndex(e => e.id === elementId);
          
          if (elementIndex === -1) return state;
          
          const newElements = [...slide.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            ...updates,
          } as SlideElement;
          
          newSlides[month] = {
            ...slide,
            elements: newElements,
          };
          
          return {
            storyline: {
              ...state.storyline,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          };
        });
      },
      
      removeElement: (month, elementId) => {
        if (month < 0 || month > 11) return;
        
        set((state) => {
          const newSlides = [...state.storyline.slides];
          newSlides[month] = {
            ...newSlides[month],
            elements: newSlides[month].elements.filter(e => e.id !== elementId),
          };
          
          return {
            storyline: {
              ...state.storyline,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          };
        });
      },
      
      reorderElement: (month, elementId, direction) => {
        if (month < 0 || month > 11) return;
        
        set((state) => {
          const newSlides = [...state.storyline.slides];
          const slide = newSlides[month];
          const elements = [...slide.elements];
          const index = elements.findIndex(e => e.id === elementId);
          
          if (index === -1) return state;
          
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= elements.length) return state;
          
          // Swap elements
          [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
          
          newSlides[month] = {
            ...slide,
            elements,
          };
          
          return {
            storyline: {
              ...state.storyline,
              slides: newSlides,
              updatedAt: Date.now(),
            },
          };
        });
      },
      
      // ========== 播放控制 ==========
      play: () => {
        set({ isPlaying: true });
      },
      
      pause: () => {
        set({ isPlaying: false });
      },
      
      stop: () => {
        set({
          isPlaying: false,
          currentMonth: 0,
          currentMonthIndex: 0,
          transitionState: 'idle',
        });
      },
      
      // 原有的 nextMonth/prevMonth 保留用于兼容
      nextMonth: () => {
        const { currentMonth, storyline } = get();
        const nextMonth = currentMonth + 1;
        
        if (nextMonth < 12) {
          set({ currentMonth: nextMonth });
        } else if (storyline.globalSettings.autoLoop) {
          set({ currentMonth: 0 });
        } else {
          // 到达末尾，停止播放
          set({ isPlaying: false });
        }
      },
      
      prevMonth: () => {
        const { currentMonth, storyline } = get();
        const prevMonth = currentMonth - 1;
        
        if (prevMonth >= 0) {
          set({ currentMonth: prevMonth });
        } else if (storyline.globalSettings.autoLoop) {
          set({ currentMonth: 11 });
        }
      },
      
      setCurrentMonth: (month) => {
        if (month >= 0 && month <= 11) {
          set({ currentMonth: month });
        }
      },
      
      setTransitionState: (transitionState) => {
        set({ transitionState });
      },
      
      // ========== 新增：已配置月份导航 ==========
      nextConfiguredMonth: () => {
        const state = get();
        const configuredMonths = getConfiguredMonths(state.storyline);
        
        if (configuredMonths.length === 0) return;
        
        const { currentMonthIndex } = state;
        const nextIndex = currentMonthIndex + 1;
        
        if (nextIndex < configuredMonths.length) {
          set({
            currentMonthIndex: nextIndex,
            currentMonth: configuredMonths[nextIndex],
          });
        } else if (state.storyline.globalSettings.autoLoop) {
          // 循环到第一个
          set({
            currentMonthIndex: 0,
            currentMonth: configuredMonths[0],
          });
        } else {
          // 到达末尾，停止播放
          set({ isPlaying: false });
        }
      },
      
      prevConfiguredMonth: () => {
        const state = get();
        const configuredMonths = getConfiguredMonths(state.storyline);
        
        if (configuredMonths.length === 0) return;
        
        const { currentMonthIndex } = state;
        const prevIndex = currentMonthIndex - 1;
        
        if (prevIndex >= 0) {
          set({
            currentMonthIndex: prevIndex,
            currentMonth: configuredMonths[prevIndex],
          });
        } else if (state.storyline.globalSettings.autoLoop) {
          // 循环到最后一个
          const lastIndex = configuredMonths.length - 1;
          set({
            currentMonthIndex: lastIndex,
            currentMonth: configuredMonths[lastIndex],
          });
        }
      },
      
      navigateToConfiguredMonth: (index) => {
        const state = get();
        const configuredMonths = getConfiguredMonths(state.storyline);
        
        if (index >= 0 && index < configuredMonths.length) {
          set({
            currentMonthIndex: index,
            currentMonth: configuredMonths[index],
          });
        }
      },
      
      // ========== 模式切换 ==========
      enterStorylineMode: () => {
        const state = get();
        const configuredMonths = getConfiguredMonths(state.storyline);
        
        // 如果没有已配置的月份，不进入故事线模式
        if (configuredMonths.length === 0) {
          console.warn('[StorylineStore] 没有已配置的月份，无法进入故事线模式');
          return;
        }
        
        // 设置到第一个已配置的月份
        set({
          isStorylineMode: true,
          currentMonthIndex: 0,
          currentMonth: configuredMonths[0],
          isPlaying: false,
          transitionState: 'active', // 直接设置为 active，立即显示内容
        });
        
        console.log(`[StorylineStore] 进入故事线模式，已配置月份: ${configuredMonths.join(', ')}`);
      },
      
      exitStorylineMode: () => {
        set({
          isStorylineMode: false,
          isPlaying: false,
          transitionState: 'idle',
        });
        
        // 触发相机重置，平滑过渡回默认位置
        // 延迟一帧确保 OrbitControls 已重新挂载
        setTimeout(() => {
          const { useAppStore } = require('@/stores/appStore');
          useAppStore.getState().requestCameraReset();
        }, 50);
      },
      
      // ========== 编辑操作 ==========
      startEditing: (month) => {
        set({
          isEditing: true,
          editingMonth: month ?? null,
        });
      },
      
      stopEditing: () => {
        set({
          isEditing: false,
          editingMonth: null,
        });
      },
      
      setEditingMonth: (month) => {
        set({ editingMonth: month });
      },
    }),
    {
      name: STORYLINE_STORAGE_KEY,
      partialize: (state) => ({
        storyline: state.storyline,
        tunnelConfig: state.tunnelConfig,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<StorylineState>;
        return {
          ...currentState,
          storyline: persisted.storyline || createDefaultStorylineConfig(),
          tunnelConfig: persisted.tunnelConfig || { ...DEFAULT_TUNNEL_CONFIG },
        };
      },
    }
  )
);

// ============================================
// 选择器 Hooks
// ============================================

export const useStoryline = () => useStorylineStore((state) => state.storyline);
export const useTunnelConfig = () => useStorylineStore((state) => state.tunnelConfig);
export const useCurrentMonth = () => useStorylineStore((state) => state.currentMonth);
export const useCurrentMonthIndex = () => useStorylineStore((state) => state.currentMonthIndex);
export const useIsPlaying = () => useStorylineStore((state) => state.isPlaying);
export const useIsStorylineMode = () => useStorylineStore((state) => state.isStorylineMode);
export const useTransitionState = () => useStorylineStore((state) => state.transitionState);
export const useIsEditing = () => useStorylineStore((state) => state.isEditing);
export const useEditingMonth = () => useStorylineStore((state) => state.editingMonth);

export const useCurrentSlide = () => useStorylineStore((state) => 
  state.storyline.slides[state.currentMonth]
);

export const useSlide = (month: number) => useStorylineStore((state) => 
  state.storyline.slides[month]
);

export const useGlobalSettings = () => useStorylineStore((state) => 
  state.storyline.globalSettings
);

// 新增：获取已配置月份的 hook
export const useConfiguredMonths = () => useStorylineStore((state) => 
  state.getConfiguredMonths()
);

export const useHasConfiguredMonths = () => useStorylineStore((state) => 
  state.hasConfiguredMonths()
);
