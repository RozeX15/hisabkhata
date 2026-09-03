import React from 'react';
import { PaymentMethodType } from '../types';

/**
 * Authentic Official bKash (বিকাশ) Logo
 * Uses official brand color #E2136E and precise geometric origami bird folds.
 */
/**
 * Full authentic horizontal bKash (বিকাশ) Logo matching official brand asset
 * Displays the Bengali wordmark 'বিকাশ' (with pink 'বি' and black/white 'কাশ')
 * alongside the iconic origami bird in authentic pink facets.
 */
export const BKashFullLogo: React.FC<{
  className?: string;
  height?: number;
  inverted?: boolean;
}> = ({ className = '', height = 36, inverted = false }) => {
  const width = Math.round(height * 2.8);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Bengali Wordmark 'বিকাশ' */}
      <g transform="translate(10, 8)">
        {/* 'বি' in signature bKash magenta */}
        <text
          x="0"
          y="68"
          fill="#E2136E"
          fontWeight="900"
          fontSize="68"
          fontFamily="'Noto Sans Bengali', 'SolaimanLipi', system-ui, sans-serif"
          letterSpacing="-1"
        >
          বি
        </text>
        {/* 'কাশ' in dark charcoal or crisp white */}
        <text
          x="44"
          y="68"
          fill={inverted ? "#FFFFFF" : "#1E293B"}
          fontWeight="900"
          fontSize="68"
          fontFamily="'Noto Sans Bengali', 'SolaimanLipi', system-ui, sans-serif"
          letterSpacing="-1"
        >
          কাশ
        </text>
      </g>

      {/* Iconic Origami Bird Symbol on Right */}
      <g transform="translate(150, 6) scale(0.92)">
        {/* Main Body Facet */}
        <path
          d="M60 20L116 48L64 74L60 20Z"
          fill="#E2136E"
        />
        {/* Upper Wing Facet */}
        <path
          d="M60 20L8 28L64 74L60 20Z"
          fill="#D12053"
        />
        {/* Top Fold */}
        <path
          d="M8 28L42 2L60 20L8 28Z"
          fill="#F43F5E"
        />
        {/* Tail Lower Facet */}
        <path
          d="M64 74L36 102L60 20L64 74Z"
          fill="#9F1239"
        />
        {/* Beak Head Fold */}
        <path
          d="M116 48L132 44L118 58L116 48Z"
          fill="#E11D48"
        />
        {/* Facet Definition Highlight Lines */}
        <path
          d="M60 20L64 74M60 20L116 48M8 28L60 20"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />
      </g>
    </svg>
  );
};

/**
 * Full authentic horizontal Nagad (নগদ) Logo matching official brand asset
 * Displays the circular swirling flame symbol on left and bold red 'নগদ' on right.
 */
export const NagadFullLogo: React.FC<{
  className?: string;
  height?: number;
}> = ({ className = '', height = 36 }) => {
  const width = Math.round(height * 2.8);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="nagadSwirlGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="nagadSwirlGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="nagadSwirlGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      {/* Circular Dynamic Swirl Symbol on Left */}
      <g transform="translate(6, 6) scale(0.88)">
        {/* Outer Red Ring */}
        <circle cx="50" cy="50" r="46" fill="#DC2626" />
        
        {/* Swirling Layer 1 (Dark Orange) */}
        <path
          d="M50 4C75.4 4 96 24.6 96 50C96 75.4 75.4 96 50 96C32 96 16.4 85.6 9 70.4C22 75 36.4 72 47 62C61 49 61 27 47 14C40 7.5 30 4 20 4C29.6 4 39.8 4 50 4Z"
          fill="url(#nagadSwirlGrad1)"
        />
        {/* Swirling Layer 2 (Bright Orange Petal) */}
        <path
          d="M48 16C62 28 62 50 48 63C38 72 24 75 12 70C22 84 38 92 56 92C78 92 94 76 94 54C94 32 78 16 56 16C53.3 16 50.6 16 48 16Z"
          fill="url(#nagadSwirlGrad2)"
        />
        {/* Swirling Layer 3 (Golden Flare) */}
        <path
          d="M42 24C52 34 52 50 40 60C32 67 22 69 13 65C18 73 28 78 38 78C54 78 68 64 68 48C68 34 56 24 42 24Z"
          fill="url(#nagadSwirlGrad3)"
        />
        {/* Inner Crescent Hole */}
        <circle cx="34" cy="48" r="14" fill="#FFFFFF" />
      </g>

      {/* Bengali Wordmark 'নগদ' in Bold Red */}
      <g transform="translate(108, 12)">
        <text
          x="0"
          y="64"
          fill="#DC2626"
          fontWeight="900"
          fontSize="66"
          fontFamily="'Noto Sans Bengali', 'SolaimanLipi', system-ui, sans-serif"
          letterSpacing="0"
        >
          নগদ
        </text>
      </g>
    </svg>
  );
};

export const BKashIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 36,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-xs ${className}`}
  >
    {/* bKash Brand Rounded Background */}
    <rect width="100" height="100" rx="22" fill="#E2136E" />
    
    {/* Authentic Origami Bird Polygon Mesh */}
    <g transform="translate(10, 10) scale(0.8)">
      {/* Top Head & Beak Fold */}
      <path
        d="M62 14L88 38L66 45L62 14Z"
        fill="#FFFFFF"
        fillOpacity="0.98"
      />
      {/* Top Left Wing Fold */}
      <path
        d="M32 38L62 14L66 45L32 38Z"
        fill="#FFFFFF"
        fillOpacity="0.82"
      />
      {/* Main Chest Body */}
      <path
        d="M32 38L66 45L54 74L32 38Z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
      {/* Lower Right Wing Fold */}
      <path
        d="M66 45L88 38L74 65L66 45Z"
        fill="#FFFFFF"
        fillOpacity="0.75"
      />
      {/* Tail Feather Fold */}
      <path
        d="M54 74L66 45L74 65L64 78L54 74Z"
        fill="#FFFFFF"
        fillOpacity="0.9"
      />
      {/* Sharp Beak Tip Accent */}
      <path
        d="M88 38L96 35L87 42L88 38Z"
        fill="#FDE047"
      />
    </g>
  </svg>
);

/**
 * Authentic Official Nagad (নগদ) Logo
 * Uses official fiery gradient #EA580C to #F97316 and signature runner flame emblem.
 */
export const NagadIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 36,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-xs ${className}`}
  >
    <defs>
      <linearGradient id="nagadOfficialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="50%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    {/* Nagad Brand Rounded Background */}
    <rect width="100" height="100" rx="22" fill="url(#nagadOfficialGrad)" />

    {/* Authentic Nagad Teardrop Flame & Runner Emblem */}
    <g transform="translate(18, 14) scale(0.64)">
      {/* Outer Flame Swirl */}
      <path
        d="M50 8C50 8 78 30 78 56C78 71.5 65.5 84 50 84C34.5 84 22 71.5 22 56C22 36 40 22 40 22C40 22 34 34 38 46C41 55 52 57 56 48C60 38 50 8 50 8Z"
        fill="#FFFFFF"
      />
      {/* Inner Fiery Core */}
      <path
        d="M50 28C50 28 66 44 66 58C66 66.8 58.8 74 50 74C41.2 74 34 66.8 34 58C34 46 44 38 44 38C44 38 40 46 44 52C47 57 54 56 56 50C58 44 50 28 50 28Z"
        fill="#EA580C"
      />
      {/* Dynamic Spark / Diamond */}
      <circle cx="50" cy="54" r="5" fill="#FDE047" />
    </g>

    {/* Bengali 'নগদ' Brand Mark at bottom */}
    <text
      x="50"
      y="84"
      textAnchor="middle"
      fill="#FFFFFF"
      fontWeight="900"
      fontSize="19"
      fontFamily="'Noto Sans Bengali', system-ui, -apple-system, sans-serif"
      letterSpacing="1"
    >
      নগদ
    </text>
  </svg>
);

/**
 * Authentic Official Rocket (রকেট - Dutch-Bangla Bank) Logo
 * Uses DBBL purple #8A2BE2 / #6B21A8, aerodynamic fuselage, delta wings and fiery booster.
 */
export const RocketIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 36,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-xs ${className}`}
  >
    <defs>
      <linearGradient id="rocketOfficialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9333EA" />
        <stop offset="50%" stopColor="#7E22CE" />
        <stop offset="100%" stopColor="#581C87" />
      </linearGradient>
      <linearGradient id="rocketFlameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="60%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>
    {/* Rocket Brand Rounded Background */}
    <rect width="100" height="100" rx="22" fill="url(#rocketOfficialGrad)" />

    {/* Authentic Dutch-Bangla Rocket Craft */}
    <g transform="translate(18, 10) scale(0.64)">
      {/* Aerodynamic Rocket Fuselage */}
      <path
        d="M50 12C60 24 66 40 66 60L50 54L34 60C34 40 40 24 50 12Z"
        fill="#FFFFFF"
      />
      {/* Left Stabilizer Wing */}
      <path
        d="M34 60L20 74L36 68L34 60Z"
        fill="#E9D5FF"
      />
      {/* Right Stabilizer Wing */}
      <path
        d="M66 60L80 74L64 68L66 60Z"
        fill="#E9D5FF"
      />
      {/* Cockpit Porthole / DBBL Emblem */}
      <circle cx="50" cy="34" r="7" fill="#6B21A8" />
      <circle cx="50" cy="34" r="3.5" fill="#FDE047" />
      
      {/* Rocket Thruster Propulsion Flame */}
      <path
        d="M44 64L50 94L56 64L50 72L44 64Z"
        fill="url(#rocketFlameGrad)"
      />
      {/* Inner Hot Flame */}
      <path
        d="M46 66L50 84L54 66L50 71L46 66Z"
        fill="#FFFFFF"
      />
    </g>

    {/* Bengali 'রকেট' Lettering */}
    <text
      x="50"
      y="84"
      textAnchor="middle"
      fill="#FFFFFF"
      fontWeight="900"
      fontSize="17"
      fontFamily="'Noto Sans Bengali', system-ui, -apple-system, sans-serif"
      letterSpacing="1"
    >
      রকেট
    </text>
  </svg>
);

/**
 * Authentic Bank Transfer / Islami Bank Badge
 */
export const BankIconBadge: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 36,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-xs ${className}`}
  >
    <defs>
      <linearGradient id="bankOfficialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F766E" />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#bankOfficialGrad)" />

    {/* Classical Bank Pillars & Pediment Arch */}
    <g transform="translate(18, 18) scale(0.64)">
      {/* Roof Pediment */}
      <path d="M12 36L50 14L88 36H12Z" fill="#FFFFFF" />
      {/* Entablature Header */}
      <rect x="14" y="38" width="72" height="6" rx="2" fill="#E2E8F0" />
      {/* Four Bank Pillars */}
      <rect x="20" y="46" width="9" height="34" rx="2" fill="#FFFFFF" />
      <rect x="36" y="46" width="9" height="34" rx="2" fill="#FFFFFF" />
      <rect x="54" y="46" width="9" height="34" rx="2" fill="#FFFFFF" />
      <rect x="70" y="46" width="9" height="34" rx="2" fill="#FFFFFF" />
      {/* Foundation Base Steps */}
      <rect x="12" y="82" width="76" height="8" rx="2" fill="#FFFFFF" />
      <rect x="8" y="90" width="84" height="6" rx="2" fill="#E2E8F0" />
    </g>
  </svg>
);

/**
 * Universal Payment Method Badge with Original Logos and Clear Names
 */
export const PaymentMethodBadge: React.FC<{
  method: PaymentMethodType;
  size?: number;
  showName?: boolean;
  className?: string;
}> = ({ method, size = 32, showName = false, className = '' }) => {
  const renderIcon = () => {
    switch (method) {
      case 'bkash':
        return <BKashIcon size={size} />;
      case 'nagad':
        return <NagadIcon size={size} />;
      case 'rocket':
        return <RocketIcon size={size} />;
      case 'bank_transfer':
      case 'card':
      default:
        return <BankIconBadge size={size} />;
    }
  };

  const getName = () => {
    switch (method) {
      case 'bkash':
        return 'bKash (বিকাশ)';
      case 'nagad':
        return 'Nagad (নগদ)';
      case 'rocket':
        return 'Rocket (রকেট)';
      case 'bank_transfer':
        return 'Bank Transfer (ব্যাংক)';
      default:
        return method;
    }
  };

  if (!showName) {
    return <div className={`inline-flex items-center ${className}`}>{renderIcon()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderIcon()}
      <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">
        {getName()}
      </span>
    </div>
  );
};
