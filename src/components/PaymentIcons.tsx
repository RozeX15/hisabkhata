import React from 'react';
import { PaymentMethodType } from '../types';

export const BKashIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="48" height="48" rx="12" fill="#E2136E" />
    {/* Stylized bKash bird folded polygon icon */}
    <path
      d="M23.5 10L35 22.5L25.5 25.5L23.5 10Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
    />
    <path
      d="M13 22L23.5 10L25.5 25.5L13 22Z"
      fill="#FFFFFF"
      fillOpacity="0.8"
    />
    <path
      d="M13 22L25.5 25.5L20 37L13 22Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
    />
    <path
      d="M25.5 25.5L35 22.5L29 34L25.5 25.5Z"
      fill="#FFFFFF"
      fillOpacity="0.75"
    />
    <path
      d="M20 37L25.5 25.5L29 34L25 38L20 37Z"
      fill="#FFFFFF"
      fillOpacity="0.9"
    />
  </svg>
);

export const NagadIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="nagadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#nagadGrad)" />
    {/* Stylized Nagad Flame Motif */}
    <path
      d="M24 10C24 10 29 16 29 21C29 23.8 26.8 26 24 26C21.2 26 19 23.8 19 21C19 16 24 10 24 10Z"
      fill="#FFFFFF"
    />
    <path
      d="M24 16C24 16 27 19.5 27 22.5C27 24.2 25.7 25.5 24 25.5C22.3 25.5 21 24.2 21 22.5C21 19.5 24 16 24 16Z"
      fill="#F97316"
    />
    {/* Bengali 'নগদ' lettering badge */}
    <text
      x="24"
      y="38"
      textAnchor="middle"
      fill="#FFFFFF"
      fontWeight="900"
      fontSize="11"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.5"
    >
      নগদ
    </text>
  </svg>
);

export const RocketIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9333EA" />
        <stop offset="100%" stopColor="#6B21A8" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#rocketGrad)" />
    {/* Rocket Silhouette */}
    <path
      d="M24 10C28 14 30 19 30 25L24 22L18 25C18 19 20 14 24 10Z"
      fill="#FFFFFF"
    />
    <path
      d="M18 25L14 30L19 28.5L18 25Z"
      fill="#E9D5FF"
    />
    <path
      d="M30 25L34 30L29 28.5L30 25Z"
      fill="#E9D5FF"
    />
    <circle cx="24" cy="18" r="2.5" fill="#6B21A8" />
    <path
      d="M22 28L24 38L26 28L24 31L22 28Z"
      fill="#FBBF24"
    />
  </svg>
);

export const BankIconBadge: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="bankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F766E" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#bankGrad)" />
    {/* Classical Bank Pillars & Pediment */}
    <path d="M12 18L24 11L36 18H12Z" fill="#FFFFFF" />
    <rect x="14" y="20" width="3" height="12" rx="1" fill="#FFFFFF" />
    <rect x="20" y="20" width="3" height="12" rx="1" fill="#FFFFFF" />
    <rect x="25" y="20" width="3" height="12" rx="1" fill="#FFFFFF" />
    <rect x="31" y="20" width="3" height="12" rx="1" fill="#FFFFFF" />
    <rect x="11" y="33" width="26" height="4" rx="1" fill="#FFFFFF" />
  </svg>
);

export const PaymentMethodBadge: React.FC<{
  method: PaymentMethodType;
  size?: number;
  showName?: boolean;
  className?: string;
}> = ({ method, size = 28, showName = false, className = '' }) => {
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
        return 'bKash';
      case 'nagad':
        return 'Nagad';
      case 'rocket':
        return 'Rocket';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  if (!showName) {
    return <div className={`inline-flex items-center ${className}`}>{renderIcon()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {renderIcon()}
      <span className="font-extrabold text-xs">{getName()}</span>
    </div>
  );
};
