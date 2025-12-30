/**
 * 分享模态框组件
 * 支持创建分享、设置有效期、密码保护、上传进度显示
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppStore, useSettings } from '@/stores/appStore';
import { useShareStore, useLocalShareInfo, useUploadProgress } from '@/stores/shareStore';
import { copyToClipboard, shareViaWebAPI } from '@/services/shareService';
import { 
  X, 
  Upload, 
  Check, 
  Copy, 
  Share2, 
  Lock, 
  Clock, 
  Eye, 
  EyeOff,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { ExpiryOption } from '@/lib/r2';

// 有效期选项配置
const EXPIRY_OPTIONS: { value: ExpiryOption; label: string; description: string }[] = [
  { value: '7days', label: '7 天', description: '一周后过期' },
  { value: '30days', label: '30 天', description: '一个月后过期' },
  { value: '90days', label: '90 天', description: '三个月后过期' },
  { value: 'permanent', label: '永久', description: '永不过期' },
];

type ModalView = 'create' | 'success' | 'manage';

export default function ShareModal() {
  const settings = useSettings();
  const isOpen = useAppStore((state) => state.isShareModalOpen);
  const setOpen = useAppStore((state) => state.setShareModalOpen);
  
  const { createShare, deleteCurrentShare, refreshExpiry, loadLocalShareInfo } = useShareStore();
  const localShareInfo = useLocalShareInfo();
  const uploadProgress = useUploadProgress();
  
  // 表单状态
  const [expiry, setExpiry] = useState<ExpiryOption>('7days');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  
  // UI 状态
  const [view, setView] = useState<ModalView>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  // 检查是否已有分享
  useEffect(() => {
    if (isOpen) {
      loadLocalShareInfo();
    }
  }, [isOpen, loadLocalShareInfo]);
  
  // 根据本地分享信息决定显示视图
  useEffect(() => {
    if (isOpen && localShareInfo) {
      setView('manage');
      setShareUrl(`${window.location.origin}/${localShareInfo.shareId}`);
    } else if (isOpen) {
      setView('create');
    }
  }, [isOpen, localShareInfo]);
  
  // 重置状态
  const resetState = useCallback(() => {
    setExpiry('7days');
    setPassword('');
    setShowPassword(false);
    setEnablePassword(false);
    setError(null);
    setCopied(false);
  }, []);
  
  // 关闭模态框
  const handleClose = useCallback(() => {
    setOpen(false);
    // 延迟重置状态，避免闪烁
    setTimeout(resetState, 300);
  }, [setOpen, resetState]);
  
  // 创建分享
  const handleCreate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createShare({
        expiry,
        password: enablePassword && password ? password : undefined,
        message: settings.customMessage,
      });
      
      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl);
        setView('success');
      } else {
        setError(result.error || '创建分享失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建分享失败');
    } finally {
      setIsLoading(false);
    }
  }, [createShare, expiry, enablePassword, password, settings.customMessage]);
  
  // 复制链接
  const handleCopy = useCallback(async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);
  
  // 系统分享
  const handleShare = useCallback(async () => {
    if (!shareUrl) return;
    await shareViaWebAPI({
      title: '2026 跨年倒计时',
      text: settings.customMessage || '来看看我的专属新年场景！',
      url: shareUrl,
    });
  }, [shareUrl, settings.customMessage]);
  
  // 删除分享
  const handleDelete = useCallback(async () => {
    if (!confirm('确定要删除这个分享吗？删除后无法恢复。')) return;
    
    setIsLoading(true);
    const success = await deleteCurrentShare();
    setIsLoading(false);
    
    if (success) {
      setView('create');
      setShareUrl(null);
    } else {
      setError('删除失败，请重试');
    }
  }, [deleteCurrentShare]);
  
  // 续期分享
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    const result = await refreshExpiry();
    setIsLoading(false);
    
    if (result.success) {
      alert('续期成功！有效期已延长 7 天。');
    } else {
      setError(result.error || '续期失败');
    }
  }, [refreshExpiry]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative bg-gray-900/95 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 size={20} />
            {view === 'create' && '创建分享'}
            {view === 'success' && '分享成功'}
            {view === 'manage' && '管理分享'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {/* 创建视图 */}
        {view === 'create' && (
          <CreateView
            expiry={expiry}
            setExpiry={setExpiry}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            enablePassword={enablePassword}
            setEnablePassword={setEnablePassword}
            isLoading={isLoading}
            uploadProgress={uploadProgress}
            customMessage={settings.customMessage}
            onCreate={handleCreate}
          />
        )}
        
        {/* 成功视图 */}
        {view === 'success' && shareUrl && (
          <SuccessView
            shareUrl={shareUrl}
            copied={copied}
            customMessage={settings.customMessage}
            onCopy={handleCopy}
            onShare={handleShare}
            onClose={handleClose}
          />
        )}
        
        {/* 管理视图 */}
        {view === 'manage' && shareUrl && (
          <ManageView
            shareUrl={shareUrl}
            copied={copied}
            isLoading={isLoading}
            onCopy={handleCopy}
            onShare={handleShare}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            onCreateNew={() => {
              // 清除本地记录后切换到创建视图
              useShareStore.getState().clearLocalShareInfo();
              setView('create');
              setShareUrl(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// 创建视图
// ============================================

interface CreateViewProps {
  expiry: ExpiryOption;
  setExpiry: (v: ExpiryOption) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  enablePassword: boolean;
  setEnablePassword: (v: boolean) => void;
  isLoading: boolean;
  uploadProgress: { current: number; total: number; status: string } | null;
  customMessage: string;
  onCreate: () => void;
}

function CreateView({
  expiry,
  setExpiry,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  enablePassword,
  setEnablePassword,
  isLoading,
  uploadProgress,
  customMessage,
  onCreate,
}: CreateViewProps) {
  return (
    <>
      {/* 预览 */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🎄</div>
          <h3 className="text-lg font-bold text-white">2026 跨年倒计时</h3>
          <p className="text-gray-400 text-sm mt-1">
            {customMessage || '新年快乐！'}
          </p>
        </div>
      </div>
      
      {/* 有效期选择 */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
          <Clock size={16} />
          有效期
        </label>
        <div className="grid grid-cols-4 gap-2">
          {EXPIRY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setExpiry(option.value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                expiry === option.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 密码保护 */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
          <Lock size={16} />
          密码保护（可选）
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="enablePassword"
            checked={enablePassword}
            onChange={(e) => setEnablePassword(e.target.checked)}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="enablePassword" className="text-sm text-gray-400">
            启用密码保护
          </label>
        </div>
        {enablePassword && (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置访问密码（4-20字符）"
              maxLength={20}
              className="w-full px-3 py-2 pr-10 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}
      </div>
      
      {/* 上传进度 */}
      {uploadProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>{uploadProgress.status}</span>
            <span>{uploadProgress.current}/{uploadProgress.total}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* 创建按钮 */}
      <button
        onClick={onCreate}
        disabled={isLoading || (enablePassword && password.length < 4)}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            上传中...
          </>
        ) : (
          <>
            <Upload size={18} />
            创建分享
          </>
        )}
      </button>
      
      {/* 提示 */}
      <p className="text-gray-500 text-xs text-center mt-4">
        分享将包含你的所有设置、照片和配置
      </p>
    </>
  );
}

// ============================================
// 成功视图
// ============================================

interface SuccessViewProps {
  shareUrl: string;
  copied: boolean;
  customMessage: string;
  onCopy: (url: string) => void;
  onShare: () => void;
  onClose: () => void;
}

function SuccessView({
  shareUrl,
  copied,
  customMessage,
  onCopy,
  onShare,
  onClose,
}: SuccessViewProps) {
  return (
    <>
      {/* 成功图标 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-gray-400">分享已创建成功！</p>
      </div>
      
      {/* 分享链接 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">分享链接</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white text-sm truncate"
          />
          <button
            onClick={() => onCopy(shareUrl)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      
      {/* 分享按钮 */}
      <div className="space-y-3 mb-6">
        {'share' in navigator && (
          <button
            onClick={onShare}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            分享到...
          </button>
        )}
        
        {/* 社交平台 */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              customMessage || '2026 跨年倒计时'
            )}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg text-center text-sm"
          >
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 bg-[#4267B2] hover:bg-[#365899] text-white rounded-lg text-center text-sm"
          >
            Facebook
          </a>
          <a
            href={`https://service.weibo.com/share/share.php?url=${encodeURIComponent(
              shareUrl
            )}&title=${encodeURIComponent(customMessage || '2026 跨年倒计时')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 bg-[#E6162D] hover:bg-[#cc1428] text-white rounded-lg text-center text-sm"
          >
            微博
          </a>
        </div>
      </div>
      
      {/* 完成按钮 */}
      <button
        onClick={onClose}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        完成
      </button>
      
      {/* 提示 */}
      <p className="text-gray-500 text-xs text-center mt-4">
        编辑令牌已保存到本地，下次可以继续编辑
      </p>
    </>
  );
}

// ============================================
// 管理视图
// ============================================

interface ManageViewProps {
  shareUrl: string;
  copied: boolean;
  isLoading: boolean;
  onCopy: (url: string) => void;
  onShare: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

function ManageView({
  shareUrl,
  copied,
  isLoading,
  onCopy,
  onShare,
  onDelete,
  onRefresh,
  onCreateNew,
}: ManageViewProps) {
  return (
    <>
      {/* 提示 */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
        <p className="text-amber-400 text-sm">
          你已经创建过分享，可以管理现有分享或创建新的。
        </p>
      </div>
      
      {/* 分享链接 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">分享链接</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white text-sm truncate"
          />
          <button
            onClick={() => onCopy(shareUrl)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="space-y-3 mb-6">
        {'share' in navigator && (
          <button
            onClick={onShare}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            分享到...
          </button>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            续期 7 天
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={16} />
            删除分享
          </button>
        </div>
      </div>
      
      {/* 创建新分享 */}
      <button
        onClick={onCreateNew}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Edit3 size={18} />
        创建新分享
      </button>
      
      {/* 提示 */}
      <p className="text-gray-500 text-xs text-center mt-4">
        创建新分享将覆盖现有的本地记录
      </p>
    </>
  );
}
