import { useId } from "react";

interface LogoProps {
  /**
   * If true, renders only the brand mark icon without typography.
   */
  iconOnly?: boolean;
  /**
   * Size preset for the icon.
   * sm: 28px, md: 36px, lg: 44px, xl: 56px
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Optional custom className for the container.
   */
  className?: string;
  /**
   * Whether to show the tag badge alongside the title.
   */
  showBadge?: boolean;
  /**
   * Text for the tag badge.
   */
  badgeText?: string;
  /**
   * Subtitle text below the title.
   */
  subtitle?: string;
}

const sizeClasses = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
  xl: "w-14 h-14",
};

export function Logo({
  iconOnly = false,
  size = "md",
  className = "",
  showBadge = true,
  badgeText = "Trim it all",
  subtitle,
}: LogoProps) {
  const id = useId();
  const bgId = `tc-bg-${id}`;
  const borderId = `tc-border-${id}`;
  const bladeTopId = `tc-blade-top-${id}`;
  const bladeBotId = `tc-blade-bot-${id}`;
  const playId = `tc-play-${id}`;
  const glowId = `tc-glow-${id}`;

  const iconElement = (
    <div
      className={`relative group shrink-0 select-none transition-transform duration-300 ease-out hover:scale-[1.04] ${className}`}
      title="Trim Clipsto"
    >
      {/* Outer ambient glow behind the icon on hover */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/30 to-indigo-500/30 blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />

      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} relative drop-shadow-md`}
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#0b1120" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id={borderId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
            <stop offset="45%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id={bladeTopId} x1="14" y1="12" x2="40" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id={bladeBotId} x1="20" y1="32" x2="50" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id={playId} x1="25" y1="20" x2="42" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* High-contrast rounded squircle container */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill={`url(#${bgId})`}
          stroke={`url(#${borderId})`}
          strokeWidth="1.75"
        />

        {/* Subtle ambient light glows */}
        <circle cx="20" cy="18" r="14" fill="#38bdf8" fillOpacity="0.22" />
        <circle cx="44" cy="46" r="14" fill="#6366f1" fillOpacity="0.22" />

        {/* Upper Trim Blade (Scissors upper arm / Trim In bracket) */}
        <path
          d="M16 16 C16 14.3 17.3 13 19 13 L28 13 C30.2 13 32.1 14.3 32.9 16.3 L39.5 31 L29 31 L20.5 19 L19 19 C17.9 19 17 19.9 17 21 C17 22.1 17.9 23 19 23 L24 23 L20 31 C17.8 30.5 16 28.5 16 26 Z"
          fill={`url(#${bladeTopId})`}
        />

        {/* Lower Trim Blade (Scissors lower arm / Trim Out bracket) */}
        <path
          d="M48 48 C48 49.7 46.7 51 45 51 L36 51 C33.8 51 31.9 49.7 31.1 47.7 L24.5 33 L35 33 L43.5 45 L45 45 C46.1 45 47 44.1 47 43 C47 41.9 46.1 41 45 41 L40 41 L44 33 C46.2 33.5 48 35.5 48 38 Z"
          fill={`url(#${bladeBotId})`}
        />

        {/* Center Sliced Playhead (Upper Triangle) */}
        <path
          d="M25 21 L39 29 C40.2 29.7 40.2 30.5 39.2 31 L25 31 Z"
          fill={`url(#${playId})`}
          filter={`url(#${glowId})`}
        />

        {/* Center Sliced Playhead (Lower Triangle) with 2px precision slit */}
        <path
          d="M25 33 L39.2 33 C40.2 33.5 40.2 34.3 39 35 L25 43 Z"
          fill={`url(#${playId})`}
        />

        {/* Precision Razor Slit Accent Line & Dot */}
        <line
          x1="21"
          y1="32"
          x2="43"
          y2="32"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="44" cy="32" r="1.5" fill="#e0f2fe" />
      </svg>
    </div>
  );

  if (iconOnly) {
    return iconElement;
  }

  return (
    <div className="flex items-start gap-3.5 group">
      {iconElement}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
            <span>Trim</span>
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 bg-clip-text text-transparent font-extrabold">
              Clipsto
            </span>
          </h1>

          {showBadge && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-500/20 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {badgeText}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
