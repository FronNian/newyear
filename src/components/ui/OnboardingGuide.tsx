import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAppStore, useOnboardingState } from '@/stores/appStore';
import { ONBOARDING_STEPS } from '@/types';

export default function OnboardingGuide() {
  const onboardingState = useOnboardingState();
  const setOnboardingStep = useAppStore((state) => state.setOnboardingStep);
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const skipOnboarding = useAppStore((state) => state.skipOnboarding);
  
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  
  const currentStep = ONBOARDING_STEPS[onboardingState.currentStep];
  const isLastStep = onboardingState.currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = onboardingState.currentStep === 0;
  
  // 检查是否应该显示引导
  useEffect(() => {
    if (!onboardingState.hasCompleted && !onboardingState.skipped) {
      // 延迟显示，等待页面加载完成
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingState.hasCompleted, onboardingState.skipped]);
  
  // 更新高亮区域
  useEffect(() => {
    if (!isVisible || !currentStep?.targetSelector) {
      setHighlightRect(null);
      return;
    }
    
    const element = document.querySelector(currentStep.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
    } else {
      setHighlightRect(null);
    }
  }, [isVisible, currentStep]);
  
  const handleNext = () => {
    if (isLastStep) {
      setOnboardingComplete();
      setIsVisible(false);
    } else {
      setOnboardingStep(onboardingState.currentStep + 1);
    }
  };
  
  const handlePrev = () => {
    if (!isFirstStep) {
      setOnboardingStep(onboardingState.currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    skipOnboarding();
    setIsVisible(false);
  };
  
  if (!isVisible || !currentStep) return null;
  
  // 计算提示框位置
  const getTooltipPosition = () => {
    if (!highlightRect || currentStep.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    
    const padding = 20;
    switch (currentStep.position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - highlightRect.top + padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${highlightRect.bottom + padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          right: `${window.innerWidth - highlightRect.left + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100]">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-300"
        onClick={handleSkip}
      />
      
      {/* 聚光灯效果 */}
      {highlightRect && (
        <div
          className="absolute border-2 border-yellow-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-300"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.7)',
          }}
        />
      )}
      
      {/* 提示框 */}
      <div
        className="absolute bg-gray-900/95 backdrop-blur-sm rounded-xl p-6 max-w-sm shadow-2xl border border-yellow-500/30"
        style={getTooltipPosition()}
      >
        {/* 关闭按钮 */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          onClick={handleSkip}
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* 图标 */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-medium">
            {onboardingState.currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>
        </div>
        
        {/* 标题 */}
        <h3 className="text-lg font-bold text-white mb-2">
          {currentStep.title}
        </h3>
        
        {/* 描述 */}
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {currentStep.description}
        </p>
        
        {/* 导航按钮 */}
        <div className="flex items-center justify-between">
          <button
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isFirstStep
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
              onClick={handleSkip}
            >
              跳过
            </button>
            <button
              className="flex items-center gap-1 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg text-sm transition-colors"
              onClick={handleNext}
            >
              {isLastStep ? '开始体验' : '下一步'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
