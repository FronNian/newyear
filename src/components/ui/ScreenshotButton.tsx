import { useState, useCallback } from 'react';
import { Camera, Download, Share2, X, Check } from 'lucide-react';
import { useScreenshotConfig } from '@/stores/appStore';
import { captureAndProcessScreenshot, downloadScreenshot, shareScreenshot } from '@/services/shareService';

interface ScreenshotButtonProps {
  className?: string;
}

export default function ScreenshotButton({ className = '' }: ScreenshotButtonProps) {
  const screenshotConfig = useScreenshotConfig();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    
    // 显示闪光效果
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    
    try {
      // 获取 canvas 元素
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }
      
      // 截图
      const dataUrl = await captureAndProcessScreenshot(canvas, {
        watermark: screenshotConfig.watermark,
        watermarkEnabled: screenshotConfig.watermarkEnabled,
        highResolution: true,
      });
      
      setPreviewUrl(dataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Screenshot failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [screenshotConfig]);
  
  const handleDownload = useCallback(() => {
    if (previewUrl) {
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadScreenshot(previewUrl, `2026-countdown-${timestamp}.png`);
    }
  }, [previewUrl]);
  
  const handleShare = useCallback(async () => {
    if (previewUrl) {
      const success = await shareScreenshot(previewUrl, '2026 新年快乐');
      if (!success) {
        // 如果分享失败，尝试复制到剪贴板
        try {
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // 降级到下载
          handleDownload();
        }
      }
    }
  }, [previewUrl, handleDownload]);
  
  const handleClose = useCallback(() => {
    setShowPreview(false);
    setPreviewUrl(null);
  }, []);
  
  return (
    <>
      {/* 截图按钮 */}
      <button
        className={`px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm backdrop-blur-sm transition-colors flex items-center gap-2 ${className}`}
        onClick={handleCapture}
        disabled={isCapturing}
        title="截图"
      >
        <Camera className={`w-4 h-4 ${isCapturing ? 'animate-pulse' : ''}`} />
      </button>
      
      {/* 闪光效果 */}
      {showFlash && (
        <div className="fixed inset-0 bg-white/50 z-[200] pointer-events-none animate-flash" />
      )}
      
      {/* 预览弹窗 */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* 预览内容 */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden max-w-lg w-full shadow-2xl">
            {/* 关闭按钮 */}
            <button
              className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* 图片预览 */}
            <div className="aspect-video bg-black">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* 操作按钮 */}
            <div className="p-4 flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
                下载
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-black font-medium transition-colors"
                onClick={handleShare}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    分享
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 闪光动画样式 */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
