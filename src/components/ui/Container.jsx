import React from 'react';
import { cn } from '../../lib/utils';

export const Container = ({ children, className, ...props }) => {
    return (
        <div
            className={cn("mx-auto max-w-lg px-4 sm:px-6", className)}
            {...props}
        >
            {children}
        </div>
    );
};
