import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm mb-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <p className="text-xs font-medium">{message}</p>
      </div>
      <div className="flex items-center space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-1.5 px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
        <button
          onClick={onDismiss}
          className="p-1 text-red-400 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
