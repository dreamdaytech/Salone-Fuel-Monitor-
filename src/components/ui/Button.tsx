import React from 'react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showNotification?: boolean;
  notificationMessage?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'unstyled';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'none';
  loading?: boolean;
  disableAfterClick?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, showNotification = true, notificationMessage, onClick, variant = 'primary', size = 'md', loading, disableAfterClick, ...props }, ref) => {
    const [isClicked, setIsClicked] = React.useState(false);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disableAfterClick) {
        setIsClicked(true);
      }
      if (showNotification && notificationMessage) {
        toast.success(notificationMessage);
      }
      if (onClick) {
        onClick(e);
      }
    };

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20',
      secondary: 'bg-surface-900 text-white hover:bg-surface-800 shadow-md shadow-surface-900/10',
      outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-surface-900',
      ghost: 'hover:bg-gray-100 text-gray-600 bg-transparent',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
      unstyled: '',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs font-bold rounded-lg',
      md: 'px-4 py-2.5 text-sm font-bold rounded-xl',
      lg: 'px-6 py-3 text-base font-bold rounded-2xl',
      icon: 'p-2 rounded-xl',
      none: '',
    };

    const isDisabled = props.disabled || loading || isClicked;

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary/20',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';
