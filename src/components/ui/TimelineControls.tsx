import { useStorylineStore } from '@/stores/storylineStore';
import { TimelineSliderController } from './storyline';

interface TimelineControlsProps {
  className?: string;
}

/** 故事线播放控制组件 - 使用新的时间轴滑块控制器 */
export default function TimelineControls({ className = '' }: TimelineControlsProps) {
  const {
    currentMonthIndex,
    isPlaying,
    isStorylineMode,
    play,
    pause,
    nextConfiguredMonth,
    prevConfiguredMonth,
    navigateToConfiguredMonth,
    exitStorylineMode,
    getConfiguredMonths,
  } = useStorylineStore();
  
  const configuredMonths = getConfiguredMonths();
  
  if (!isStorylineMode) return null;
  
  return (
    <div className={className}>
      <TimelineSliderController
        configuredMonths={configuredMonths}
        currentIndex={currentMonthIndex}
        isPlaying={isPlaying}
        onNavigate={navigateToConfiguredMonth}
        onTogglePlay={() => isPlaying ? pause() : play()}
        onPrev={prevConfiguredMonth}
        onNext={nextConfiguredMonth}
        onExit={exitStorylineMode}
      />
    </div>
  );
}
