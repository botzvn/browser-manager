import * as React from 'react';

import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';

const inputSizeClasses = { sm: 'h-8', default: 'h-9', lg: 'h-10' } as const;

function Input({ className, type, size = 'default', ...props }: Omit<React.ComponentProps<'input'>, 'size'> & { size?: 'sm' | 'default' | 'lg' }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        `flex ${inputSizeClasses[size]} w-full min-w-0 rounded-lg border-0 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-shadow outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-slate-400 focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50`,
        `[&_input]:w-full [&_input]:h-full [&_input]:bg-transparent [&_input]:outline-none [&_input]:border-none [&_input]:p-0`,
        className
      )}
      {...props}
    />
  );
}

export { Input };
