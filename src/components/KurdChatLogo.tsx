import React from 'react';

interface KurdChatLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withGlow?: boolean;
}

export const KurdChatLogo: React.FC<KurdChatLogoProps> = ({
  size = 'lg',
  className = '',
  withGlow = false,
}) => {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28',
  };

  const iconSizeMap = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 shadow-xl ${
        withGlow ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black shadow-purple-900/40' : ''
      } ${sizeMap[size]} ${className}`}
    >
      {/* Speech bubble icon exactly matching video logo */}
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className={`text-white drop-shadow-md ${iconSizeMap[size]}`}
      >
        <path d="M 50 18 C 28 18 12 32 12 50 C 12 59 16 67 23 73 C 22 79 19 86 15 88 C 23 88 32 83 37 80 C 41 81 45 82 50 82 C 72 82 88 68 88 50 C 88 32 72 18 50 18 Z" />
      </svg>
      {/* Kurdish sun sparkle accent */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
      </span>
    </div>
  );
};
