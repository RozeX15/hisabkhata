import React from 'react';

interface AppLogoProps {
  variant?: 'icon' | 'full' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
  isDarkBg?: boolean;
}

export const AppLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm ${className}`}
    >
      <defs>
        {/* Background Emerald Shield Gradient */}
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="50%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#042F2E" />
        </linearGradient>

        {/* Gold Coin / Star Gradient */}
        <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Upward Growth Arrow Gradient */}
        <linearGradient id="logoGrowthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#042F2E" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer Squircle Container */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="28"
        fill="url(#logoBgGrad)"
      />

      {/* Subtle Inner Highlight Border */}
      <rect
        x="8"
        y="8"
        width="104"
        height="104"
        rx="26"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeOpacity="0.2"
      />

      {/* Stylized Open Accounting Ledger (খাতা) Pages with Layered 3D Depth */}
      <g filter="url(#logoShadow)">
        {/* Left Ledger Page */}
        <path
          d="M26 34C26 31 29 28 32 29L58 36V88L32 82C28 81 26 78 26 74V34Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        {/* Right Ledger Page */}
        <path
          d="M94 34C94 31 91 28 88 29L62 36V88L88 82C92 81 94 78 94 74V34Z"
          fill="#F1F5F9"
          fillOpacity="0.9"
        />

        {/* Center Spine Divider */}
        <line
          x1="60"
          y1="34"
          x2="60"
          y2="89"
          stroke="#0F766E"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Left Page Accounting Lines */}
        <line x1="33" y1="44" x2="52" y2="48" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="54" x2="52" y2="58" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="64" x2="48" y2="67" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right Page Dynamic Financial Growth Bars */}
        <rect x="68" y="60" width="4.5" height="16" rx="2" fill="#0D9488" />
        <rect x="75" y="52" width="4.5" height="24" rx="2" fill="#0F766E" />
        <rect x="82" y="44" width="4.5" height="32" rx="2" fill="#14B8A6" />

        {/* Ascending Trend Arrow Line */}
        <path
          d="M34 72L50 56L66 64L86 40"
          stroke="url(#logoGrowthGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow Tip */}
        <path
          d="M78 40H86V48"
          stroke="url(#logoGrowthGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Golden Prosperity Coin / Taka-Dollar Emblem */}
        <circle cx="60" cy="30" r="13" fill="url(#logoGoldGrad)" stroke="#FFFFFF" strokeWidth="2" />
        {/* Inner Coin Ring */}
        <circle cx="60" cy="30" r="9" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Coin Symbol (Stylized Currency Taka/Dollar Node) */}
        <path
          d="M60 23V37M56 26H63C64.5 26 65.5 27 65.5 28.5C65.5 30 64.5 31 63 31H56H63.5C65 31 66 32 66 33.5C66 35 65 36 63.5 36H55"
          stroke="#78350F"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  subtitle,
  isDarkBg = false,
}) => {
  const getSizePx = () => {
    switch (size) {
      case 'xs':
        return 26;
      case 'sm':
        return 34;
      case 'md':
        return 42;
      case 'lg':
        return 50;
      case 'xl':
        return 64;
      default:
        return 42;
    }
  };

  const sizePx = getSizePx();

  if (variant === 'icon') {
    return <AppLogoMark size={sizePx} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <AppLogoMark size={sizePx} />

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight leading-none text-base sm:text-lg ${isDarkBg ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            Hishab<span className={isDarkBg ? 'text-teal-400' : 'text-teal-600 dark:text-teal-400'}>Khata</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded-md font-extrabold text-[9px] tracking-wider uppercase border ${
            isDarkBg
              ? 'bg-amber-950/70 text-amber-300 border-amber-700/50'
              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-700/50'
          }`}>
            PRO
          </span>
        </div>

        {variant === 'full' && (
          <span className={`text-[11px] font-medium tracking-wide mt-0.5 truncate ${isDarkBg ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {subtitle || 'হিসাব খাতা • Smart Personal Finance'}
          </span>
        )}
      </div>
    </div>
  );
};
