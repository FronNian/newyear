import { useEffect, useState, useCallback, useMemo } from 'react';
import { Scene } from '@/components/3d';
import { SettingsPanel, ShareModal, MusicPlayer, PhotoUploader, GestureIndicator, OnboardingGuide, TimelineControls, GlobalChromaticAberration, ShareView, ToastContainer, toast, KeyboardShortcuts } from '@/components/ui';
import ManualTriggerButton from '@/components/ui/ManualTriggerButton';
import AutoTriggerIndicator from '@/components/ui/AutoTriggerIndicator';
import { useAppStore, useSettings, useAutoTriggerConfig } from '@/stores/appStore';
import { useStorylineStore, useHasConfiguredMonths } from '@/stores/storylineStore';
import { useShareStore } from '@/stores/shareStore';
import { loadShareDataFromUrl, isShareLink } from '@/services/shareService';
import { useAutoCountdownTrigger, setupAutoTriggerDebugCommands } from '@/hooks/useAutoCountdownTrigger';
import { useShareRoute } from '@/hooks/useShareRoute';
import { calculateTargetTime, getSecondsToTarget, formatCountdown, calculateCountdown } from '@/utils/countdown';
import { Sparkles, Settings, Share2, Play, Maximize2, Minimize2, Camera, Clock, X, Maximize, Minimize, Keyboard } from 'lucide-react';

// 全屏 Hook
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);
  
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  }, []);
  
  return { isFullscreen, toggleFullscreen };
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <Sparkles className="w-12 h-12 text-yellow-400 mb-8 animate-pulse" />
      <h1 className="text-2xl font-bold text-white mb-4">2026 跨年倒计时</h1>
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-400 mt-2 text-sm">加载中...</p>
    </div>
  );
}

function App() {
  const isLoading = useAppStore((state) => state.isLoading);
  const loadingProgress = useAppStore((state) => state.loadingProgress);
  const setLoadingProgress = useAppStore((state) => state.setLoadingProgress);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const startManualCountdown = useAppStore((state) => state.startManualCountdown);
  const isManualCountdownActive = useAppStore((state) => state.isManualCountdownActive);
  const isParticleSpread = useAppStore((state) => state.isParticleSpread);
  const toggleParticleSpread = useAppStore((state) => state.toggleParticleSpread);
  const startCelebration = useAppStore((state) => state.startCelebration);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const settings = useSettings();
  const autoTriggerConfig = useAutoTriggerConfig();
  const [gestureDebugMode, setGestureDebugMode] = useState(false);
  
  const isStorylineMode = useStorylineStore((state) => state.isStorylineMode);
  const hasConfiguredMonths = useHasConfiguredMonths();
  
  // 全屏控制
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  // 分享路由
  const { isShareView, shareId } = useShareRoute();
  
  // 快捷键帮助弹窗（仅电脑版，首次访问自动显示）
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(() => {
    if (isMobile) return false;
    try {
      return !localStorage.getItem('keyboard_help_seen');
    } catch {
      return true;
    }
  });
  const [shareLoaded, setShareLoaded] = useState(false);
  
  // 分享页面倒计时状态
  const [showShareCountdownPrompt, setShowShareCountdownPrompt] = useState(false);
  const [shareCountdownTriggered, setShareCountdownTriggered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 分享加载成功回调
  const handleShareLoadSuccess = useCallback(() => {
    setShareLoaded(true);
  }, []);
  
  // 自动触发 Hook
  const {
    targetTime,
    timezoneDisplay,
    isAutoEnabled,
    shouldShowManualTrigger,
    triggerCelebration,
  } = useAutoCountdownTrigger();
  
  // 计算分享页面的目标时间和倒计时
  const shareTargetTime = useMemo(() => {
    return calculateTargetTime(settings.targetYear, autoTriggerConfig.timezone);
  }, [settings.targetYear, autoTriggerConfig.timezone]);
  
  const secondsToTarget = useMemo(() => {
    return getSecondsToTarget(shareTargetTime, currentTime);
  }, [shareTargetTime, currentTime]);
  
  const isTimeReached = secondsToTarget <= 0;
  
  const countdownDisplay = useMemo(() => {
    if (isTimeReached) return null;
    return formatCountdown(calculateCountdown(currentTime, shareTargetTime));
  }, [currentTime, shareTargetTime, isTimeReached]);
  
  // 更新当前时间（每秒）
  useEffect(() => {
    if (!isShareView) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isShareView]);
  
  // 分享页面自动触发倒计时（时间到达时弹出提示）
  useEffect(() => {
    if (!isShareView || !shareLoaded || shareCountdownTriggered) return;
    
    if (isTimeReached && !showShareCountdownPrompt) {
      setShowShareCountdownPrompt(true);
    }
  }, [isShareView, shareLoaded, isTimeReached, showShareCountdownPrompt, shareCountdownTriggered]);
  
  // 分享页面播放倒计时
  const handleSharePlayCountdown = useCallback(() => {
    setShareCountdownTriggered(true);
    setShowShareCountdownPrompt(false);
    startManualCountdown();
    setIsPlaying(true);
    startCelebration();
  }, [startManualCountdown, setIsPlaying, startCelebration]);
  
  // 分享页面取消播放
  const handleShareCancelCountdown = useCallback(() => {
    setShowShareCountdownPrompt(false);
    setShareCountdownTriggered(true); // 标记已处理，不再弹出
  }, []);
  
  // 初始化调试命令
  useEffect(() => {
    setupAutoTriggerDebugCommands();
  }, []);
  
  // 初始化时加载本地分享信息
  useEffect(() => {
    useShareStore.getState().loadLocalShareInfo();
  }, []);
  
  // 加载分享数据（旧的 URL 参数方式，保持兼容）
  useEffect(() => {
    if (isShareLink()) {
      const shareData = loadShareDataFromUrl();
      if (shareData?.settings) {
        updateSettings(shareData.settings);
      }
    }
  }, [updateSettings]);
  
  // 模拟加载进度
  useEffect(() => {
    if (isLoading) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 90) {
          clearInterval(interval);
        }
        setLoadingProgress(progress);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLoading, setLoadingProgress]);
  
  // 获取更多 store 状态用于快捷键
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const isShareModalOpen = useAppStore((state) => state.isShareModalOpen);
  const setShareModalOpen = useAppStore((state) => state.setShareModalOpen);
  const triggerEffect = useAppStore((state) => state.triggerEffect);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const nextSong = useAppStore((state) => state.nextSong);
  const prevSong = useAppStore((state) => state.prevSong);
  const requestCameraReset = useAppStore((state) => state.requestCameraReset);
  
  // 通用快捷键（仅电脑版）
  useEffect(() => {
    if (isMobile || isShareView) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 如果正在输入文字，不触发快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // 如果有弹窗打开，只处理 ESC
      if (isSettingsOpen || isShareModalOpen || showKeyboardHelp) {
        if (e.key === 'Escape') {
          setSettingsOpen(false);
          setShareModalOpen(false);
          setShowKeyboardHelp(false);
        }
        return;
      }
      
      // ? 键显示快捷键帮助
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowKeyboardHelp(prev => !prev);
        return;
      }
      
      // 空格键或回车键开始倒计时
      if ((e.key === ' ' || e.key === 'Enter') && !isManualCountdownActive && !isStorylineMode) {
        e.preventDefault();
        startManualCountdown();
        return;
      }
      
      // R 键重置视角
      if (e.key === 'r' || e.key === 'R') {
        requestCameraReset();
        return;
      }
      
      // F 键全屏切换
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
        return;
      }
      
      // V 键切换粒子聚合/散开
      if (e.key === 'v' || e.key === 'V') {
        toggleParticleSpread();
        return;
      }
      
      // M 键切换音乐播放
      if (e.key === 'm' || e.key === 'M') {
        setIsPlaying(!isPlaying);
        return;
      }
      
      // , 键上一首
      if (e.key === ',') {
        prevSong();
        return;
      }
      
      // . 键下一首
      if (e.key === '.') {
        nextSong();
        return;
      }
      
      // H 键爱心特效
      if (e.key === 'h' || e.key === 'H') {
        triggerEffect('heart');
        return;
      }
      
      // W 键烟花特效
      if (e.key === 'w' || e.key === 'W') {
        triggerEffect('firework');
        return;
      }
      
      // N 键雪花特效
      if (e.key === 'n' || e.key === 'N') {
        triggerEffect('snow');
        return;
      }
      
      // S 键打开设置
      if (e.key === 's' || e.key === 'S') {
        setSettingsOpen(true);
        return;
      }
      
      // ESC 键关闭弹窗
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setShareModalOpen(false);
        setShowKeyboardHelp(false);
        return;
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMobile, isShareView, isSettingsOpen, isShareModalOpen, showKeyboardHelp, isManualCountdownActive, isStorylineMode, isPlaying, startManualCountdown, requestCameraReset, toggleFullscreen, toggleParticleSpread, setIsPlaying, prevSong, nextSong, triggerEffect, setSettingsOpen, setShareModalOpen]);
  
  return (
    <div className="w-full h-full relative">
      {/* Toast 通知容器 */}
      <ToastContainer />
      
      {/* 全局色差效果 - SVG滤镜定义必须先渲染 */}
      <GlobalChromaticAberration />
      
      {isLoading && <LoadingScreen progress={loadingProgress} />}
      
      {/* 分享查看模式 */}
      {isShareView && shareId && !shareLoaded && (
        <ShareView shareId={shareId} onLoadSuccess={handleShareLoadSuccess} />
      )}
      
      {/* 3D 场景 */}
      <Scene />
      
      {/* UI 覆盖层 */}
      <div className="absolute top-4 left-4 text-white pointer-events-none" data-chromatic-text>
        <h1 className="text-xl font-bold opacity-80 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {settings.customMessage || '2026 跨年倒计时'}
        </h1>
      </div>
      
      {/* 自动触发状态指示器 - 故事线模式和分享页时隐藏 */}
      {!isStorylineMode && !isShareView && (
        <div className="absolute top-4 right-4 z-20" data-chromatic-text>
          <AutoTriggerIndicator
            isEnabled={isAutoEnabled}
            timezoneName={timezoneDisplay.name}
            timezoneOffset={timezoneDisplay.offset}
            targetTime={targetTime}
          />
        </div>
      )}
      
      {/* 开始倒计时按钮 - 居中显示，不同屏幕尺寸调整位置，故事线模式和分享页时隐藏 */}
      {!isManualCountdownActive && !isStorylineMode && !isShareView && (
        <div className="absolute bottom-40 sm:bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 z-20" data-chromatic-text>
          <button
            className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-full text-white font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105 flex items-center gap-2 sm:gap-3"
            onClick={startManualCountdown}
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="whitespace-nowrap">开始 {settings.targetYear} 倒计时</span>
          </button>
        </div>
      )}
      
      {/* 分享页面播放倒计时按钮 */}
      {isShareView && shareLoaded && !isManualCountdownActive && !shareCountdownTriggered && (
        <div className="absolute bottom-40 sm:bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 z-20" data-chromatic-text>
          <div className="flex flex-col items-center gap-3">
            {/* 倒计时提示 */}
            {!isTimeReached && countdownDisplay && (
              <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span>距离 {settings.targetYear} 年还有 {countdownDisplay}</span>
              </div>
            )}
            
            {/* 播放按钮 */}
            <button
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-full text-white font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105 flex items-center gap-2 sm:gap-3"
              onClick={handleSharePlayCountdown}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="whitespace-nowrap">
                {isTimeReached ? '播放新年庆祝' : '提前播放倒计时'}
              </span>
            </button>
            
            {/* 未到时间提示 */}
            {!isTimeReached && (
              <p className="text-white/60 text-xs">
                到点后将自动提示播放
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* 分享页面自动播放提示弹窗 */}
      {isShareView && showShareCountdownPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-gray-900/95 rounded-2xl p-6 w-full max-w-sm mx-4 text-center">
            <button
              onClick={handleShareCancelCountdown}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {settings.targetYear} 新年到了！
            </h2>
            <p className="text-gray-400 mb-6">
              是否播放新年倒计时庆祝动画？
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleShareCancelCountdown}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                稍后再说
              </button>
              <button
                onClick={handleSharePlayCountdown}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                播放
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 底部工具栏 - 移动端调整位置避免被音乐播放器遮挡 */}
      {!isStorylineMode && (
        <div className="absolute bottom-20 sm:bottom-4 left-4 right-4 flex justify-between items-center z-20" data-chromatic-text>
          {/* 左侧按钮 */}
          <div className="flex gap-2">
            <button
              className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2"
              onClick={toggleParticleSpread}
              title={isParticleSpread ? '聚合粒子' : '散开粒子'}
            >
              {isParticleSpread ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">聚合</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">散开</span>
                </>
              )}
            </button>
            
            {/* 故事线入口按钮 - 分享页只在有配置时显示，非分享页始终显示 */}
            {(!isShareView || hasConfiguredMonths) && (
              <button
                className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2"
                onClick={() => {
                  const store = useStorylineStore.getState();
                  const configuredMonths = store.getConfiguredMonths();
                  
                  if (configuredMonths.length === 0) {
                    toast.warning('还没有配置故事线内容，请先在设置中编辑故事线。');
                    return;
                  }
                  
                  store.enterStorylineMode();
                  store.play();
                }}
                title="进入故事线模式"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="hidden sm:inline">故事线</span>
              </button>
            )}
            
            {/* 全屏按钮 */}
            <button
              className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2"
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4" />
                  <span className="hidden sm:inline">退出全屏</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  <span className="hidden sm:inline">全屏</span>
                </>
              )}
            </button>
          </div>
          
          {/* 右侧按钮 */}
          <div className="flex gap-2">
            {/* 快捷键按钮 - 仅电脑版，分享页时隐藏 */}
            {!isMobile && !isShareView && (
              <button
                className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2"
                onClick={() => setShowKeyboardHelp(true)}
                title="快捷键 (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}
            
            {/* 设置按钮 - 分享页时隐藏 */}
            {!isShareView && (
              <button
                className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2"
                onClick={() => useAppStore.getState().setSettingsOpen(true)}
                data-onboarding="settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">设置</span>
              </button>
            )}
            
            {/* 分享按钮 - 分享页时隐藏 */}
            {!isShareView && (
              <button
                className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2"
                onClick={() => useAppStore.getState().setShareModalOpen(true)}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">分享</span>
              </button>
            )}
            
            {/* 摄像头按钮 */}
            <button
              className={`p-2 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors flex items-center gap-1 sm:gap-2 ${
                gestureDebugMode ? 'bg-yellow-500/80 hover:bg-yellow-500' : 'bg-white/10 hover:bg-white/20'
              }`}
              onClick={() => setGestureDebugMode(!gestureDebugMode)}
              title="显示摄像头"
              data-onboarding="gesture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* 故事线时间线控制 - 分享页时隐藏 */}
      {!isShareView && <TimelineControls />}
      
      {/* 模态框 - 分享页时隐藏 */}
      {!isShareView && (
        <>
          <SettingsPanel />
          <ShareModal />
        </>
      )}
      
      {/* 音乐播放器 */}
      <MusicPlayer />
      
      {/* 照片上传 - 分享页时隐藏 */}
      {!isShareView && <PhotoUploader />}
      
      {/* 手势识别 */}
      <GestureIndicator debugMode={gestureDebugMode} />
      
      {/* 首次加载引导 - 分享页时隐藏 */}
      {!isShareView && <OnboardingGuide />}
      
      {/* 快捷键帮助弹窗 - 仅电脑版 */}
      {showKeyboardHelp && !isMobile && (
        <KeyboardShortcuts onClose={() => setShowKeyboardHelp(false)} />
      )}
      
      {/* 手动触发庆祝按钮 - 时间已过时显示，故事线模式和分享页时隐藏 */}
      {!isStorylineMode && !isShareView && (
        <ManualTriggerButton
          visible={shouldShowManualTrigger}
          onClick={triggerCelebration}
        />
      )}
    </div>
  );
}

export default App;
