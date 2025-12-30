import { PartyPopper } from 'lucide-react';

interface ManualTriggerButtonProps {
  onClick: () => void;
  visible: boolean;
}

/**
 * 手动触发庆祝按钮
 * 当错过自动触发时间后显示，允许用户手动开始庆祝
 */
export default function ManualTriggerButton({ onClick, visible }: ManualTriggerButtonProps) {
  if (!visible) return null;
  
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-24 left-1/2 -translate-x-1/2 z-40
        px-6 py-3 
        bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500
        hover:from-yellow-400 hover:via-red-400 hover:to-pink-400
        text-white font-bold text-sm
        rounded-full shadow-lg
        flex items-center gap-2
        animate-bounce
        transition-all duration-300
        hover:scale-105 hover:shadow-xl
        min-w-[200px] justify-center
        touch-manipulation
      "
      style={{
        boxShadow: '0 0 20px rgba(255, 100, 100, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      <PartyPopper className="w-5 h-5" />
      <span>已过新年，点击开始庆祝 🎉</span>
    </button>
  );
}
