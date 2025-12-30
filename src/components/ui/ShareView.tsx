/**
 * 分享查看组件
 * 处理分享加载、密码验证和错误状态
 * 包含详细的加载进度显示
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { Loader2, AlertCircle, Clock, FileQuestion, Home, Check, Image, Settings, Sparkles } from 'lucide-react';
import { useShareStore, usePasswordState } from '@/stores/shareStore';
import PasswordPrompt from './PasswordPrompt';
import { navigateToHome } from '@/hooks/useShareRoute';

interface ShareViewProps {
  /** 分享 ID */
  shareId: string;
  /** 加载成功后的回调 */
  onLoadSuccess?: () => void;
}

/** 加载阶段 */
type LoadingPhase = 
  | 'init'           // 初始化
  | 'fetch_meta'     // 获取元数据
  | 'password'       // 等待密码验证
  | 'fetch_data'     // 获取完整数据
  | 'load_photos'    // 加载照片
  | 'apply_config'   // 应用配置
  | 'ready'          // 准备完成
  | 'error';         // 错误

/** 加载步骤配置 */
const LOADING_STEPS = [
  { phase: 'fetch_meta', label: '获取分享信息', icon: Settings, weight: 15 },
  { phase: 'fetch_data', label: '加载分享数据', icon: Sparkles, weight: 25 },
  { phase: 'load_photos', label: '加载照片资源', icon: Image, weight: 40 },
  { phase: 'apply_config', label: '应用场景配置', icon: Settings, weight: 15 },
  { phase: 'ready', label: '准备就绪', icon: Check, weight: 5 },
];

export default function ShareView({ shareId, onLoadSuccess }: ShareViewProps) {
  const {
    currentShare,
    isLoading,
    error,
    errorMessage,
    loadShareMeta,
    loadShare,
    verifyPassword,
    applyLoadedConfig,
    resetShareState,
  } = useShareStore();

  const { isRequired: isPasswordRequired, isVerified: isPasswordVerified, error: passwordError } = usePasswordState();

  // 加载阶段状态
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('init');
  const [photoLoadProgress, setPhotoLoadProgress] = useState(0);
  const [loadedPhotoCount, setLoadedPhotoCount] = useState(0);
  const [totalPhotoCount, setTotalPhotoCount] = useState(0);
  const [isApplyingConfig, setIsApplyingConfig] = useState(false);

  // 计算总进度
  const progress = useMemo(() => {
    switch (loadingPhase) {
      case 'init':
        return 0;
      case 'fetch_meta':
        return 10;
      case 'password':
        return 15; // 等待密码时停在15%
      case 'fetch_data':
        return 25;
      case 'load_photos':
        // 照片加载占40%的进度 (25-65)
        return 25 + (photoLoadProgress * 0.4);
      case 'apply_config':
        return 75;
      case 'ready':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  }, [loadingPhase, photoLoadProgress]);

  // 获取当前步骤索引
  const currentStepIndex = useMemo(() => {
    const phaseOrder = ['fetch_meta', 'fetch_data', 'load_photos', 'apply_config', 'ready'];
    const idx = phaseOrder.indexOf(loadingPhase);
    return idx >= 0 ? idx : 0;
  }, [loadingPhase]);

  // 加载分享元数据
  useEffect(() => {
    if (shareId) {
      setLoadingPhase('fetch_meta');
      loadShareMeta(shareId);
    }

    return () => {
      resetShareState();
    };
  }, [shareId, loadShareMeta, resetShareState]);

  // 元数据加载完成后的处理
  useEffect(() => {
    if (loadingPhase === 'fetch_meta' && !isLoading && !error) {
      if (isPasswordRequired && !isPasswordVerified) {
        setLoadingPhase('password');
      } else if (isPasswordVerified) {
        setLoadingPhase('fetch_data');
      }
    }
  }, [loadingPhase, isLoading, error, isPasswordRequired, isPasswordVerified]);

  // 密码验证成功后加载完整数据
  useEffect(() => {
    if (isPasswordVerified && !currentShare && !isLoading && !error && loadingPhase !== 'fetch_data') {
      setLoadingPhase('fetch_data');
      loadShare(shareId);
    }
  }, [isPasswordVerified, currentShare, isLoading, error, shareId, loadShare, loadingPhase]);

  // 数据加载完成后，开始加载照片
  useEffect(() => {
    if (currentShare && isPasswordVerified && loadingPhase === 'fetch_data' && !isLoading) {
      const photos = currentShare.photos || [];
      setTotalPhotoCount(photos.length);
      
      if (photos.length === 0) {
        // 没有照片，直接进入应用配置阶段
        setLoadingPhase('apply_config');
      } else {
        setLoadingPhase('load_photos');
        preloadPhotos(photos);
      }
    }
  }, [currentShare, isPasswordVerified, loadingPhase, isLoading]);

  // 预加载照片
  const preloadPhotos = useCallback(async (photoUrls: string[]) => {
    let loaded = 0;
    
    const loadPromises = photoUrls.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          loaded++;
          setLoadedPhotoCount(loaded);
          setPhotoLoadProgress((loaded / photoUrls.length) * 100);
          resolve();
        };
        img.onerror = () => {
          // 即使加载失败也继续
          loaded++;
          setLoadedPhotoCount(loaded);
          setPhotoLoadProgress((loaded / photoUrls.length) * 100);
          resolve();
        };
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
    setLoadingPhase('apply_config');
  }, []);

  // 应用配置
  useEffect(() => {
    if (loadingPhase === 'apply_config' && currentShare && !isApplyingConfig) {
      setIsApplyingConfig(true);
      
      // 模拟配置应用的延迟，让用户看到进度
      setTimeout(() => {
        applyLoadedConfig();
        setLoadingPhase('ready');
        
        // 短暂显示完成状态后回调
        setTimeout(() => {
          onLoadSuccess?.();
        }, 500);
      }, 300);
    }
  }, [loadingPhase, currentShare, isApplyingConfig, applyLoadedConfig, onLoadSuccess]);

  // 错误处理
  useEffect(() => {
    if (error) {
      setLoadingPhase('error');
    }
  }, [error]);

  // 密码验证处理
  const handlePasswordVerify = useCallback(async (password: string): Promise<boolean> => {
    const result = await verifyPassword(shareId, password);
    if (result) {
      setLoadingPhase('fetch_data');
    }
    return result;
  }, [shareId, verifyPassword]);

  // 返回主页
  const handleGoHome = useCallback(() => {
    navigateToHome();
  }, []);

  // 错误状态
  if (loadingPhase === 'error' || error) {
    return <ErrorView error={error} message={errorMessage} onGoHome={handleGoHome} />;
  }

  // 需要密码验证
  if (loadingPhase === 'password' || (isPasswordRequired && !isPasswordVerified)) {
    return (
      <PasswordPrompt
        onVerify={handlePasswordVerify}
        onCancel={handleGoHome}
        error={passwordError}
        isLoading={isLoading}
      />
    );
  }

  // 加载完成
  if (loadingPhase === 'ready') {
    return null;
  }

  // 加载中状态 - 显示详细进度
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="w-full max-w-md mx-4">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">加载分享</h1>
          <p className="text-gray-400 text-sm">正在为您准备精彩内容</p>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">加载进度</span>
            <span className="text-amber-400 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 加载步骤 */}
        <div className="space-y-3">
          {LOADING_STEPS.map((step, index) => {
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;
            const isPending = currentStepIndex < index;
            const Icon = step.icon;

            return (
              <div
                key={step.phase}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                  ${isActive ? 'bg-amber-500/10 border border-amber-500/30' : ''}
                  ${isCompleted ? 'opacity-60' : ''}
                  ${isPending ? 'opacity-30' : ''}
                `}
              >
                {/* 图标 */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${isCompleted ? 'bg-green-500/20 text-green-400' : ''}
                  ${isActive ? 'bg-amber-500/20 text-amber-400' : ''}
                  ${isPending ? 'bg-gray-700 text-gray-500' : ''}
                `}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* 文字 */}
                <div className="flex-1">
                  <p className={`
                    text-sm font-medium
                    ${isCompleted ? 'text-green-400' : ''}
                    ${isActive ? 'text-amber-400' : ''}
                    ${isPending ? 'text-gray-500' : ''}
                  `}>
                    {step.label}
                  </p>
                  
                  {/* 照片加载详情 */}
                  {isActive && step.phase === 'load_photos' && totalPhotoCount > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {loadedPhotoCount} / {totalPhotoCount} 张照片
                    </p>
                  )}
                </div>

                {/* 完成标记 */}
                {isCompleted && (
                  <span className="text-xs text-green-400">完成</span>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="text-center text-gray-500 text-xs mt-6">
          首次加载可能需要一些时间，请耐心等待
        </p>
      </div>
    </div>
  );
}


// ============================================
// 错误视图组件
// ============================================

interface ErrorViewProps {
  error: 'not_found' | 'expired' | 'network' | null;
  message: string | null;
  onGoHome: () => void;
}

function ErrorView({ error, message, onGoHome }: ErrorViewProps) {
  const getErrorContent = () => {
    switch (error) {
      case 'not_found':
        return {
          icon: <FileQuestion className="w-16 h-16 text-gray-400" />,
          title: '分享不存在',
          description: '该分享链接无效或已被删除',
          color: 'gray',
        };
      case 'expired':
        return {
          icon: <Clock className="w-16 h-16 text-amber-400" />,
          title: '分享已过期',
          description: '该分享已超过有效期，无法查看',
          color: 'amber',
        };
      case 'network':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-400" />,
          title: '加载失败',
          description: message || '网络连接失败，请检查网络后重试',
          color: 'red',
        };
      default:
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-400" />,
          title: '出错了',
          description: message || '发生未知错误',
          color: 'red',
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md mx-4">
        {/* 图标 */}
        <div className="mb-6">{content.icon}</div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white mb-3">{content.title}</h1>

        {/* 描述 */}
        <p className="text-gray-400 mb-8">{content.description}</p>

        {/* 操作按钮 */}
        <div className="space-y-3">
          {error === 'network' && (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
            >
              重试
            </button>
          )}
          <button
            onClick={onGoHome}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            返回主页
          </button>
        </div>

        {/* 提示 */}
        <p className="text-gray-500 text-xs mt-6">
          {error === 'not_found' && '请确认链接是否正确，或联系分享者获取新链接'}
          {error === 'expired' && '分享者可以续期或创建新的分享'}
          {error === 'network' && '如果问题持续，请稍后再试'}
        </p>
      </div>
    </div>
  );
}
