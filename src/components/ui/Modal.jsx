import React from 'react';
import { cn } from '../../lib/utils';

export const Modal = ({
  isOpen,
  title,
  description,
  onClose,
  actions,
  className,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeLabel = 'Close'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        className={cn(
          'absolute inset-0 flex items-start md:items-center justify-center p-4',
          className
        )}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-full sm:max-w-md md:max-w-lg overflow-hidden max-h-[85vh]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">{title}</h3>
            {showCloseButton && (
              <button
                type="button"
                aria-label={closeLabel}
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              >
                ×
              </button>
            )}
          </div>

          <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
            {typeof description === 'string' ? (
              <p className="text-slate-700 text-sm leading-relaxed">{description}</p>
            ) : (
              description
            )}
          </div>

          {Array.isArray(actions) && actions.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                    action.variant === 'primary'
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : action.variant === 'destructive'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
