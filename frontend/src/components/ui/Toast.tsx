'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  details?: {
    currentCount?: number;
    maxCount?: number;
    planName?: string;
  };
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  type, 
  title, 
  message, 
  details,
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const colors = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900',
      subtext: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      subtext: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-900',
      subtext: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      subtext: 'text-blue-700'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className={`${colors[type].bg} border-2 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`text-4xl ${colors[type].icon}`}>
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${colors[type].text} mb-2`}>
              {title}
            </h3>
            {message && (
              <p className={`text-sm ${colors[type].subtext} mb-3`}>
                {message}
              </p>
            )}

            {/* Limit Details */}
            {details && (
              <div className={`mt-4 p-4 bg-white bg-opacity-50 rounded-lg border ${colors[type].bg.replace('bg-', 'border-')}`}>
                <p className={`text-xs font-semibold ${colors[type].text} mb-2`}>
                  📊 Limit Bilgileri
                </p>
                <div className="space-y-1">
                  {details.currentCount !== undefined && details.maxCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className={colors[type].subtext}>Kullanılan:</span>
                      <span className={`font-bold ${colors[type].text}`}>
                        {details.currentCount}/{details.maxCount}
                      </span>
                    </div>
                  )}
                  {details.planName && (
                    <div className="flex justify-between text-sm">
                      <span className={colors[type].subtext}>Plan:</span>
                      <span className={`font-bold ${colors[type].text}`}>
                        {details.planName}
                      </span>
                    </div>
                  )}
                </div>
                {type === 'warning' && (
                  <p className={`mt-3 text-xs ${colors[type].subtext}`}>
                    💡 Daha fazla eklemek için planınızı yükseltin.
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`${colors[type].icon} hover:opacity-70 transition`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              type === 'success' 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : type === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : type === 'warning'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Tamam
          </button>
          {type === 'warning' && details && (
            <button
              onClick={() => {
                onClose();
                window.location.href = '/dashboard/subscription';
              }}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Planı Yükselt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast Container Hook
export const useToast = (): {
  toast: {
    type: ToastType;
    title: string;
    message?: string;
    details?: any;
  } | null;
  showToast: (type: ToastType, title: string, message?: string, details?: any) => void;
  closeToast: () => void;
} => {
  const [toast, setToast] = useState<{
    type: ToastType;
    title: string;
    message?: string;
    details?: any;
  } | null>(null);

  const showToast = (
    type: ToastType, 
    title: string, 
    message?: string, 
    details?: any
  ) => {
    setToast({ type, title, message, details });
  };

  const closeToast = () => {
    setToast(null);
  };

  return { toast, showToast, closeToast };
};
