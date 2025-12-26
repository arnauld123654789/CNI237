import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ label, error, className, id, ...props }, ref) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input
                id={id}
                ref={ref}
                className={cn(
                    "w-full rounded-lg border border-gray-300 px-4 py-3 placeholder:text-gray-400 focus:border-brand-500 focus:ring-brand-500 focus:outline-none focus:ring-1",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
