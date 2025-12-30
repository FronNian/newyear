/**
 * 密码输入组件
 * 用于分享密码验证
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Lock, X, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PasswordPromptProps {
  /** 验证密码回调 */
  onVerify: (password: string) => Promise<boolean>;
  /** 取消回调 */
  onCancel: () => void;
  /** 错误信息 */
  error?: string | null;
  /** 是否正在验证 */
  isLoading?: boolean;
}

export default function PasswordPrompt({
  onVerify,
  onCancel,
  error,
  isLoading = false,
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 显示外部错误或本地错误
  const displayError = error || localError;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!password.trim()) {
      setLocalError('请输入密码');
      return;
    }

    const success = await onVerify(password);
    if (!success) {
      // 清空密码输入，方便重试
      setPassword('');
      inputRef.current?.focus();
    }
  }, [password, onVerify]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 密码输入面板 */}
      <div className="relative bg-gray-900/95 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* 图标和标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">需要密码</h2>
          <p className="text-gray-400 text-sm mt-2">
            此分享受密码保护，请输入密码查看
          </p>
        </div>

        {/* 密码表单 */}
        <form onSubmit={handleSubmit}>
          {/* 密码输入框 */}
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoading}
              className={`w-full px-4 py-3 pr-12 bg-gray-800 rounded-lg text-white placeholder-gray-500 
                focus:outline-none focus:ring-2 transition-all
                ${displayError 
                  ? 'ring-2 ring-red-500 focus:ring-red-500' 
                  : 'focus:ring-amber-500'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
              autoComplete="current-password"
            />
            {/* 显示/隐藏密码按钮 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* 错误提示 */}
          {displayError && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
              <AlertCircle size={16} />
              <span>{displayError}</span>
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  验证中...
                </>
              ) : (
                '确认'
              )}
            </button>
          </div>
        </form>

        {/* 提示 */}
        <p className="text-gray-500 text-xs text-center mt-4">
          如果忘记密码，请联系分享者获取
        </p>
      </div>
    </div>
  );
}
