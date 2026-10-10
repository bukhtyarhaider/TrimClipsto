import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  kbd?: string;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      icon,
      iconRight,
      kbd,
      loading,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:scale-[0.98]";

    const sizeStyles = {
      xs: "h-7 px-2 text-xs gap-1.5",
      sm: "h-8 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-sm gap-2",
      lg: "h-11 px-5 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/25 border border-blue-400/20 active:from-blue-700 active:to-indigo-700",
      accent:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30 active:bg-indigo-200 dark:active:bg-indigo-500/25",
      secondary:
        "bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-xs dark:shadow-none dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-zinc-200 dark:border-zinc-700/60 active:bg-zinc-200 dark:active:bg-zinc-800",
      danger:
        "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 active:bg-rose-200 dark:active:bg-rose-500/25",
      ghost:
        "bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border-transparent dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
      outline:
        "bg-transparent hover:bg-zinc-100 text-zinc-700 border border-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800/50 dark:text-zinc-300 active:bg-zinc-200 dark:active:bg-zinc-800",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {iconRight && <span className="inline-flex shrink-0 items-center justify-center">{iconRight}</span>}
        {kbd && (
          <kbd className="ml-1 px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-zinc-100 border border-zinc-200 text-zinc-600 dark:bg-black/30 dark:border-white/10 dark:text-zinc-400 rounded">
            {kbd}
          </kbd>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
