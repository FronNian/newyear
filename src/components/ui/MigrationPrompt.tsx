/**
 * 迁移提示组件
 * 检测并提示用户将 base64 图片迁移到 R2 存储
 */

import { useState, useCallback } from 'react';
import { 
  HardDrive, 
  X, 
  Check, 
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { 
  checkNeedsMigration, 
  getBase64PhotoCount, 
  migrateSharePhotos 
} from '@/lib/r2';

interface MigrationPromptProps {
  /** 分享 ID */
  shareId: string;
  /** 编辑令牌 */
  editToken: string;
  /** 照片数组 */
  photos: string[];
  /** 关闭回调 */
  onClose: () => void;
  /** 迁移完成回调 */
  onComplete?: () => void;
}

export default function MigrationPrompt({
  shareId,
  editToken,
  photos,
  onClose,
  onComplete,
}: MigrationPromptProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // 检查是否需要迁移
  const needsMigration = checkNeedsMigration(photos);
  const base64Count = getBase64PhotoCount(photos);

  // 开始迁移
  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateSharePhotos(
        shareId,
        editToken,
        (current, total, status) => {
          setProgress({ current, total, status });
        }
      );

      if (migrationResult.success) {
        setResult({
          success: true,
          message: `成功迁移 ${migrationResult.migratedCount} 张图片！`,
        });
        onComplete?.();
      } else {
        setResult({
          success: false,
          message: migrationResult.error || '迁移失败',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '迁移失败',
      });
    } finally {
      setIsMigrating(false);
    }
  }, [shareId, editToken, onComplete]);

  // 不需要迁移
  if (!needsMigration) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isMigrating ? onClose : undefined}
      />

      {/* 提示面板 */}
      <div className="relative bg-gray-900/95 rounded-2xl p-6 w-full max-w-md mx-4">
        {/* 关闭按钮 */}
        {!isMigrating && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* 图标和标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
            <HardDrive className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">优化存储</h2>
          <p className="text-gray-400 text-sm mt-2">
            检测到 {base64Count} 张图片使用旧格式存储
          </p>
        </div>

        {/* 说明 */}
        {!result && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="mb-2">
                  将图片迁移到云存储可以：
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>减少分享数据体积</li>
                  <li>加快加载速度</li>
                  <li>提高稳定性</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 进度显示 */}
        {isMigrating && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{progress.status}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: progress.total > 0 
                    ? `${(progress.current / progress.total) * 100}%` 
                    : '0%' 
                }}
              />
            </div>
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
            result.success 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {result.success ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3">
          {!result ? (
            <>
              <button
                onClick={onClose}
                disabled={isMigrating}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                稍后再说
              </button>
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isMigrating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    迁移中...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    开始迁移
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {result.success ? '完成' : '关闭'}
            </button>
          )}
        </div>

        {/* 提示 */}
        <p className="text-gray-500 text-xs text-center mt-4">
          迁移过程中请勿关闭页面
        </p>
      </div>
    </div>
  );
}
