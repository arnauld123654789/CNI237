import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className, ...props }) => (
    <div className={cn("px-6 py-4 border-b border-gray-100", className)} {...props}>
        {children}
    </div>
);

export const CardContent = ({ children, className, ...props }) => (
    <div className={cn("p-6", className)} {...props}>
        {children}
    </div>
);
