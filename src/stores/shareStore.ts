/**
 * 分享状态 Store
 * 管理分享的创建、加载、更新、删除等操作
 */

import { create } from 'zustand';
import {
  uploadShare,
  updateShare,
  getShare,
  getShareWithError,
  getShareMetaWithError,
  verifySharePassword,
  deleteShare,
  refreshShareExpiry,
  getLocalShare,
  clearLocalShare,
  getShareUrl,
  getEditUrl,
  isShareExpired,
  type ShareData,
  type ShareMeta,
  type ShareErrorType,
  type ExpiryOption,
} from '@/lib/r2';
import {
  collectShareConfig,
  applyShareConfig,
  shareConfigToR2Format,
  r2FormatToShareConfig,
} from '@/lib/shareAdapter';

// ============================================
// 类型定义
// ============================================

/** 本地分享信息 */
export interface LocalShareInfo {
  shareId: string;
  editToken: string;
  createdAt: number;
}

/** 上传进度 */
export interface UploadProgress {
  current: number;
  total: number;
  status: string;
}

/** 分享创建选项 */
export interface ShareCreateOptions {
  expiry: ExpiryOption;
  password?: string;
  message?: string;
}

/** 分享创建结果 */
export interface ShareCreateResult {
  success: boolean;
  shareId?: string;
  editToken?: string;
  shareUrl?: string;
  editUrl?: string;
  expiresAt?: number;
  error?: string;
}

/** 分享更新结果 */
export interface ShareUpdateResult {
  success: boolean;
  expiresAt?: number;
  error?: string;
}

/** 分享状态 */
interface ShareState {
  // 当前分享状态
  currentShare: ShareData | null;
  currentShareMeta: ShareMeta | null;
  isLoading: boolean;
  error: ShareErrorType;
  errorMessage: string | null;
  
  // 本地分享记录
  localShareInfo: LocalShareInfo | null;
  
  // 上传进度
  uploadProgress: UploadProgress | null;
  
  // 密码验证状态
  isPasswordRequired: boolean;
  isPasswordVerified: boolean;
  passwordError: string | null;
  
  // Actions
  createShare: (options: ShareCreateOptions) => Promise<ShareCreateResult>;
  loadShare: (shareId: string) => Promise<void>;
  loadShareMeta: (shareId: string) => Promise<void>;
  verifyPassword: (shareId: string, password: string) => Promise<boolean>;
  updateCurrentShare: (options?: { password?: string | null; expiry?: ExpiryOption; message?: string }) => Promise<ShareUpdateResult>;
  deleteCurrentShare: () => Promise<boolean>;
  refreshExpiry: () => Promise<{ success: boolean; newExpiresAt?: number; error?: string }>;
  applyLoadedConfig: () => void;
  
  // 本地记录管理
  loadLocalShareInfo: () => void;
  clearLocalShareInfo: () => void;
  checkLocalShareValid: () => Promise<boolean>;
  
  // 状态重置
  resetShareState: () => void;
  setUploadProgress: (progress: UploadProgress | null) => void;
  setError: (error: ShareErrorType, message?: string) => void;
  clearError: () => void;
}

// ============================================
// 初始状态
// ============================================

const initialState = {
  currentShare: null,
  currentShareMeta: null,
  isLoading: false,
  error: null as ShareErrorType,
  errorMessage: null,
  localShareInfo: null,
  uploadProgress: null,
  isPasswordRequired: false,
  isPasswordVerified: false,
  passwordError: null,
};

// ============================================
// 创建 Store
// ============================================

export const useShareStore = create<ShareState>((set, get) => ({
  ...initialState,

  /**
   * 创建新分享
   */
  createShare: async (options: ShareCreateOptions): Promise<ShareCreateResult> => {
    set({ isLoading: true, error: null, errorMessage: null });
    
    try {
      // 收集当前配置
      const config = collectShareConfig();
      const { photos, config: r2Config } = shareConfigToR2Format(config);
      
      // 设置初始进度
      set({ uploadProgress: { current: 0, total: photos.length, status: '准备上传...' } });
      
      // 调用 r2.ts 的 uploadShare
      const result = await uploadShare(
        photos,
        r2Config,
        options.message,
        options.password,
        options.expiry
      );
      
      if (result.success && result.shareId && result.editToken) {
        const shareUrl = getShareUrl(result.shareId);
        const editUrl = getEditUrl(result.shareId, result.editToken);
        
        // 更新本地分享信息
        const localInfo: LocalShareInfo = {
          shareId: result.shareId,
          editToken: result.editToken,
          createdAt: Date.now(),
        };
        
        set({
          isLoading: false,
          localShareInfo: localInfo,
          uploadProgress: null,
        });
        
        return {
          success: true,
          shareId: result.shareId,
          editToken: result.editToken,
          shareUrl,
          editUrl,
          expiresAt: result.expiresAt,
        };
      } else {
        set({
          isLoading: false,
          error: 'network',
          errorMessage: result.error || '创建分享失败',
          uploadProgress: null,
        });
        
        return {
          success: false,
          error: result.error || '创建分享失败',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建分享失败';
      set({
        isLoading: false,
        error: 'network',
        errorMessage,
        uploadProgress: null,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * 加载分享数据
   */
  loadShare: async (shareId: string): Promise<void> => {
    set({ isLoading: true, error: null, errorMessage: null });
    
    try {
      const result = await getShareWithError(shareId);
      
      if (result.error) {
        set({
          isLoading: false,
          error: result.error,
          errorMessage: getErrorMessage(result.error),
          currentShare: null,
        });
        return;
      }
      
      if (result.data) {
        // 检查是否需要密码
        const hasPassword = !!(result.data.passwordHash && result.data.passwordSalt);
        
        set({
          isLoading: false,
          currentShare: result.data,
          isPasswordRequired: hasPassword,
          isPasswordVerified: !hasPassword, // 无密码则直接验证通过
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: 'network',
        errorMessage: '加载分享失败，请检查网络连接',
        currentShare: null,
      });
    }
  },

  /**
   * 加载分享元数据（用于密码验证前）
   */
  loadShareMeta: async (shareId: string): Promise<void> => {
    set({ isLoading: true, error: null, errorMessage: null });
    
    try {
      const result = await getShareMetaWithError(shareId);
      
      if (result.error) {
        set({
          isLoading: false,
          error: result.error,
          errorMessage: getErrorMessage(result.error),
          currentShareMeta: null,
        });
        return;
      }
      
      if (result.data) {
        set({
          isLoading: false,
          currentShareMeta: result.data,
          isPasswordRequired: result.data.hasPassword,
          isPasswordVerified: !result.data.hasPassword,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: 'network',
        errorMessage: '加载分享失败，请检查网络连接',
        currentShareMeta: null,
      });
    }
  },

  /**
   * 验证密码
   */
  verifyPassword: async (shareId: string, password: string): Promise<boolean> => {
    set({ passwordError: null });
    
    try {
      const result = await verifySharePassword(shareId, password);
      
      if (result.valid) {
        set({ isPasswordVerified: true, passwordError: null });
        
        // 密码验证成功后加载完整数据
        const shareData = await getShare(shareId);
        if (shareData) {
          set({ currentShare: shareData });
        }
        
        return true;
      } else {
        set({ passwordError: result.error || '密码错误' });
        return false;
      }
    } catch (error) {
      set({ passwordError: '验证失败，请重试' });
      return false;
    }
  },

  /**
   * 更新当前分享
   */
  updateCurrentShare: async (options?: { 
    password?: string | null; 
    expiry?: ExpiryOption;
    message?: string;
  }): Promise<ShareUpdateResult> => {
    const { localShareInfo } = get();
    
    if (!localShareInfo) {
      return { success: false, error: '没有本地分享记录' };
    }
    
    set({ isLoading: true, error: null, errorMessage: null });
    
    try {
      // 收集当前配置
      const config = collectShareConfig();
      const { photos, config: r2Config } = shareConfigToR2Format(config);
      
      // 调用 r2.ts 的 updateShare
      const result = await updateShare(
        localShareInfo.shareId,
        localShareInfo.editToken,
        photos,
        r2Config,
        options?.message,
        options?.password,
        options?.expiry
      );
      
      set({ isLoading: false });
      
      if (result.success) {
        return {
          success: true,
          expiresAt: result.expiresAt,
        };
      } else {
        set({
          error: 'network',
          errorMessage: result.error || '更新失败',
        });
        return {
          success: false,
          error: result.error || '更新失败',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新失败';
      set({
        isLoading: false,
        error: 'network',
        errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * 删除当前分享
   */
  deleteCurrentShare: async (): Promise<boolean> => {
    const { localShareInfo } = get();
    
    if (!localShareInfo) {
      return false;
    }
    
    set({ isLoading: true, error: null, errorMessage: null });
    
    try {
      const result = await deleteShare(localShareInfo.shareId, localShareInfo.editToken);
      
      if (result.success) {
        set({
          isLoading: false,
          localShareInfo: null,
          currentShare: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: 'network',
          errorMessage: result.error || '删除失败',
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: 'network',
        errorMessage: '删除失败',
      });
      return false;
    }
  },

  /**
   * 续期分享
   */
  refreshExpiry: async (): Promise<{ success: boolean; newExpiresAt?: number; error?: string }> => {
    const { localShareInfo } = get();
    
    if (!localShareInfo) {
      return { success: false, error: '没有本地分享记录' };
    }
    
    set({ isLoading: true });
    
    try {
      const result = await refreshShareExpiry(localShareInfo.shareId, localShareInfo.editToken);
      
      set({ isLoading: false });
      
      return result;
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : '续期失败',
      };
    }
  },

  /**
   * 应用已加载的配置到 appStore
   */
  applyLoadedConfig: (): void => {
    const { currentShare, isPasswordVerified } = get();
    
    if (!currentShare || !isPasswordVerified) {
      return;
    }
    
    const shareConfig = r2FormatToShareConfig(
      currentShare.photos,
      currentShare.config
    );
    
    applyShareConfig(shareConfig);
  },

  /**
   * 加载本地分享信息
   */
  loadLocalShareInfo: (): void => {
    const localShare = getLocalShare();
    if (localShare) {
      set({
        localShareInfo: {
          shareId: localShare.shareId,
          editToken: localShare.editToken,
          createdAt: localShare.createdAt,
        },
      });
    }
  },

  /**
   * 清除本地分享信息
   */
  clearLocalShareInfo: (): void => {
    clearLocalShare();
    set({ localShareInfo: null });
  },

  /**
   * 检查本地分享是否仍然有效
   */
  checkLocalShareValid: async (): Promise<boolean> => {
    const { localShareInfo } = get();
    
    if (!localShareInfo) {
      return false;
    }
    
    try {
      const share = await getShare(localShareInfo.shareId);
      
      if (!share || share.editToken !== localShareInfo.editToken) {
        // 清除无效的本地记录
        get().clearLocalShareInfo();
        return false;
      }
      
      // 检查是否过期
      if (isShareExpired(share.expiresAt)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 重置分享状态
   */
  resetShareState: (): void => {
    set({
      currentShare: null,
      currentShareMeta: null,
      isLoading: false,
      error: null,
      errorMessage: null,
      uploadProgress: null,
      isPasswordRequired: false,
      isPasswordVerified: false,
      passwordError: null,
    });
  },

  /**
   * 设置上传进度
   */
  setUploadProgress: (progress: UploadProgress | null): void => {
    set({ uploadProgress: progress });
  },

  /**
   * 设置错误
   */
  setError: (error: ShareErrorType, message?: string): void => {
    set({
      error,
      errorMessage: message || getErrorMessage(error),
    });
  },

  /**
   * 清除错误
   */
  clearError: (): void => {
    set({ error: null, errorMessage: null, passwordError: null });
  },
}));

// ============================================
// 辅助函数
// ============================================

/**
 * 获取错误消息
 */
function getErrorMessage(error: ShareErrorType): string {
  switch (error) {
    case 'not_found':
      return '分享不存在或已被删除';
    case 'expired':
      return '分享已过期';
    case 'network':
      return '网络连接失败，请检查网络后重试';
    default:
      return '未知错误';
  }
}

// ============================================
// 选择器 Hooks
// ============================================

export const useCurrentShare = () => useShareStore((state) => state.currentShare);
export const useShareLoading = () => useShareStore((state) => state.isLoading);
export const useShareError = () => useShareStore((state) => ({
  error: state.error,
  message: state.errorMessage,
}));
export const useLocalShareInfo = () => useShareStore((state) => state.localShareInfo);
export const useUploadProgress = () => useShareStore((state) => state.uploadProgress);
export const usePasswordState = () => useShareStore((state) => ({
  isRequired: state.isPasswordRequired,
  isVerified: state.isPasswordVerified,
  error: state.passwordError,
}));
