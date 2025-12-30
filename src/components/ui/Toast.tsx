import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

// 全局 Toast 状态管理
let toastId = 0;
let addToastFn: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null;

// 全局 Toast 调用函数
export const toast = {
  show: (message: string, type: ToastType = 'info', duration = 3000) => {
    if (addToastFn) {
      addToastFn({ message, type, duration });
    }
  },
  info: (message: string, duration = 3000) => toast.show(message, 'info', duration),
  success: (message: string, duration = 3000) => toast.show(message, 'success', duration),
  error: (message: string, duration = 5000) => toast.show(message, 'error', duration),
  warning: (message: string, duration = 4000) => toast.show(message, 'warning', duration),
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    default:
      return <Info className="w-5 h-5 text-blue-400" />;
  }
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'border-green-500/30 bg-green-500/10';
    case 'error':
      return 'border-red-500/30 bg-red-500/10';
    case 'warning':
      return 'border-yellow-500/30 bg-yellow-500/10';
    default:
      return 'border-blue-500/30 bg-blue-500/10';
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { ...toast, id }]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2 sm:max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg animate-slide-in-right ${getToastStyles(t.type)}`}
        >
          <ToastIcon type={t.type} />
          <p className="flex-1 text-sm text-white/90 whitespace-pre-wrap">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
