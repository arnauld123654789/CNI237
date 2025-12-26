import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    isLoading = false,
    className,
    ...props
}) => {
    const variants = {
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md",
        secondary: "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 shadow-sm",
        outline: "border-2 border-brand-600 text-brand-600 hover:bg-brand-50",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    };

    return (
        <button
            disabled={isLoading}
            className={cn(
                "inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
