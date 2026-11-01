import React from 'react';

// Authentic 21-ray Golden Sun of Kurdistan (Rôj) SVG Emoji
export const KurdistanSunEmoji: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => {
  return (
    <span className={`inline-block align-middle shrink-0 drop-shadow-sm ${className}`} title="ڕۆژی کوردستان ☀️">
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
      <defs>
        <linearGradient id="kurdSunCenter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <linearGradient id="kurdRay" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* 21 Golden Sun Rays of Kurdistan */}
      <g transform="translate(50, 50)">
        {Array.from({ length: 21 }).map((_, i) => {
          const angle = (i * 360) / 21;
          return (
            <polygon
              key={i}
              points="0,-48 4.2,-26 -4.2,-26"
              fill="url(#kurdRay)"
              transform={`rotate(${angle})`}
            />
          );
        })}
        {/* Central Solar Disc */}
        <circle cx="0" cy="0" r="26" fill="url(#kurdSunCenter)" stroke="#d97706" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="21" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.8" />
      </g>
    </svg>
    </span>
  );
};

// Official Kurdistan Verified Badge Emoji (Scalloped Starburst with Kurdistan Flag / 21-Ray Sun & Checkmark)
export const KurdistanVerifiedBadgeIcon: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'flag' | 'blue' | 'gold';
  className?: string;
}> = ({ size = 'sm', variant = 'flag', className = '' }) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  return (
    <span
      className={`inline-flex items-center justify-center align-middle shrink-0 select-none ${sizeMap[size]} ${className}`}
      title="پشتڕاستکراوەی فەرمی کوردستان | Kurdistan Verified Badge"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Starburst scalloped badge path */}
          <clipPath id="scallopClip">
            <path d="M50 0 C54 7 60 10 68 8 C75 7 81 12 82 19 C84 27 89 31 96 33 C103 36 105 44 102 50 C98 56 98 63 102 69 C105 76 102 83 95 86 C88 88 84 93 82 100 C80 107 73 111 66 109 C59 108 53 111 49 118 C46 124 38 125 32 121 C27 117 20 117 14 121 C8 124 1 120 0 113 C0 105 -4 100 -10 97 C-17 95 -20 87 -17 81 C-14 74 -15 67 -20 62 C-24 56 -23 48 -17 44 C-11 41 -8 35 -9 28 C-9 20 -3 15 4 16 C11 17 18 13 21 7 C24 1 32 -2 38 1 C44 4 50 2 53 -5 Z" />
          </clipPath>
          <linearGradient id="blueBadge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="goldBadge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* 12-pointed scalloped starburst badge */}
        {variant === 'blue' && (
          <path
            d="M50 3 L61 14 L77 11 L83 26 L98 32 L96 48 L107 60 L98 72 L98 88 L83 92 L75 106 L60 103 L50 114 L40 103 L25 106 L17 92 L2 88 L2 72 L-7 60 L4 48 L2 32 L17 26 L23 11 L39 14 Z"
            transform="scale(0.85) translate(10, 8)"
            fill="url(#blueBadge)"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
        )}

        {variant === 'gold' && (
          <path
            d="M50 3 L61 14 L77 11 L83 26 L98 32 L96 48 L107 60 L98 72 L98 88 L83 92 L75 106 L60 103 L50 114 L40 103 L25 106 L17 92 L2 88 L2 72 L-7 60 L4 48 L2 32 L17 26 L23 11 L39 14 Z"
            transform="scale(0.85) translate(10, 8)"
            fill="url(#goldBadge)"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
        )}

        {/* Flag Variant (Default): Scalloped circle with Kurdistan flag colors */}
        {variant === 'flag' && (
          <g>
            {/* Scalloped outer starburst base */}
            <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
            
            {/* Kurdistan Flag Bands inside circle */}
            <clipPath id="circleClip">
              <circle cx="50" cy="50" r="46" />
            </clipPath>
            <g clipPath="url(#circleClip)">
              {/* Red band */}
              <rect x="0" y="4" width="100" height="32" fill="#ed1b24" />
              {/* White band */}
              <rect x="0" y="36" width="100" height="28" fill="#ffffff" />
              {/* Green band */}
              <rect x="0" y="64" width="100" height="32" fill="#278842" />
            </g>
          </g>
        )}

        {/* Golden Kurdistan Sun inside badge */}
        <g transform="translate(50, 50)">
          {Array.from({ length: 21 }).map((_, i) => {
            const angle = (i * 360) / 21;
            return (
              <polygon
                key={i}
                points="0,-22 2.5,-12 -2.5,-12"
                fill="#ffc107"
                stroke="#d97706"
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
              />
            );
          })}
          <circle cx="0" cy="0" r="13" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        </g>

        {/* Crisp White Verification Checkmark */}
        <path
          d="M 38 50 L 46 58 L 64 38"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.6))"
        />
      </svg>
    </span>
  );
};

// Kurdistan Flag Shield Emblem matching the user's screenshot
export const KurdistanShield: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-6 h-7',
    md: 'w-9 h-10',
    lg: 'w-12 h-14',
  };

  return (
    <svg
      viewBox="0 0 100 120"
      className={`${sizeMap[size]} shrink-0 drop-shadow-md ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="shieldClip">
          <path d="M50 4 C76 4, 94 16, 94 40 C94 82, 50 114, 50 114 C50 114, 6 82, 6 40 C6 16, 24 4, 50 4 Z" />
        </clipPath>
        <linearGradient id="shieldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="sunGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      {/* Outer Metallic Shield Border */}
      <path
        d="M50 2 C78 2, 98 14, 98 40 C98 84, 50 118, 50 118 C50 118, 2 84, 2 40 C2 14, 22 2, 50 2 Z"
        fill="url(#shieldRim)"
        stroke="#475569"
        strokeWidth="1.5"
      />

      {/* Inner Shield with Kurdistan Flag Stripes */}
      <g clipPath="url(#shieldClip)">
        {/* Red Stripe (Top) */}
        <rect x="0" y="0" width="100" height="42" fill="#ed1b24" />
        {/* White Stripe (Middle) */}
        <rect x="0" y="42" width="100" height="34" fill="#ffffff" />
        {/* Green Stripe (Bottom) */}
        <rect x="0" y="76" width="100" height="44" fill="#278842" />

        {/* Golden Sun of Kurdistan (Rôj) with 21 rays */}
        <g transform="translate(50, 59)">
          {Array.from({ length: 21 }).map((_, i) => {
            const angle = (i * 360) / 21;
            return (
              <polygon
                key={i}
                points="0,-18 2.5,-10 -2.5,-10"
                fill="#ffc107"
                transform={`rotate(${angle})`}
              />
            );
          })}
          <circle cx="0" cy="0" r="10" fill="url(#sunGold)" stroke="#d97706" strokeWidth="0.8" />
        </g>
      </g>

      {/* Glossy inner rim highlight */}
      <path
        d="M50 6 C74 6, 90 17, 90 39 C90 76, 50 108, 50 108 C50 108, 10 76, 10 39 C10 17, 26 6, 50 6 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.2"
        opacity="0.6"
      />
    </svg>
  );
};

// Verified Admin Kurdistan Badge (Verification Tick with Kurdistan Sun & Colors)
export const KurdistanAdminVerifyBadge: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-red-950/90 via-neutral-900 to-emerald-950/90 border border-amber-500/70 rounded-full ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } font-bold text-amber-300 shadow-md shadow-amber-500/20 select-none ${className}`}
      title="Verified Kurdistan Admin | باجی فەرمی ئەدمینی کوردستان"
    >
      <KurdistanVerifiedBadgeIcon size={isSm ? 'xs' : 'sm'} />
      <span className="tracking-tight text-white font-extrabold">Admin</span>
      <span className="text-amber-400">☀️</span>
    </span>
  );
};

// Mini Kurdistan Flag Emoji / Pill
export const KurdistanFlagPill: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-[3px] border border-neutral-700 w-5 h-3.5 shadow-xs shrink-0 ${className}`}
      title="Kurdistan ☀️"
    >
      <svg viewBox="0 0 30 20" className="w-full h-full">
        <rect width="30" height="6.6" fill="#ed1b24" />
        <rect y="6.6" width="30" height="6.6" fill="#ffffff" />
        <rect y="13.2" width="30" height="6.8" fill="#278842" />
        <circle cx="15" cy="10" r="3" fill="#ffc107" />
      </svg>
    </span>
  );
};

// Official Blue Verified Badge identical to Instagram, Facebook, YouTube, & Twitter
export const BlueVerifiedBadge: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'sm', className = '' }) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7',
  };

  return (
    <span
      className={`inline-flex items-center justify-center align-middle shrink-0 select-none ${sizeMap[size]} ${className}`}
      title="حساب موثق بالعلامة الزرقاء الرسمية (Verified)"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.5 12.5C22.5 13.5 21.8 14.4 21.7 15.4C21.6 16.5 22.1 17.5 21.6 18.4C21.1 19.3 20.1 19.7 19.4 20.4C18.7 21.1 18.3 22.1 17.4 22.6C16.5 23.1 15.5 22.6 14.4 22.7C13.4 22.8 12.5 23.5 11.5 23.5C10.5 23.5 9.6 22.8 8.6 22.7C7.5 22.6 6.5 23.1 5.6 22.6C4.7 22.1 4.3 21.1 3.6 20.4C2.9 19.7 1.9 19.3 1.4 18.4C0.9 17.5 1.4 16.5 1.3 15.4C1.2 14.4 0.5 13.5 0.5 12.5C0.5 11.5 1.2 10.6 1.3 9.6C1.4 8.5 0.9 7.5 1.4 6.6C1.9 5.7 2.9 5.3 3.6 4.6C4.3 3.9 4.7 2.9 5.6 2.4C6.5 1.9 7.5 2.4 8.6 2.3C9.6 2.2 10.5 1.5 11.5 1.5C12.5 1.5 13.4 2.2 14.4 2.3C15.5 2.4 16.5 1.9 17.4 2.4C18.3 2.9 18.7 3.9 19.4 4.6C20.1 5.3 21.1 5.7 21.6 6.6C22.1 7.5 21.6 8.5 21.7 9.6C21.8 10.6 22.5 11.5 22.5 12.5Z"
          fill="#0095F6"
        />
        <path
          d="M10.2 16.3L6.5 12.6L7.9 11.2L10.2 13.5L16.1 7.6L17.5 9L10.2 16.3Z"
          fill="white"
        />
      </svg>
    </span>
  );
};

// User Badges Row (renders Blue Checkmark + Admin badge)
export const UserBadges: React.FC<{
  user: { isVerified?: boolean; isAdmin?: boolean; username?: string };
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}> = ({ user, size = 'sm', className = '' }) => {
  const isGeneralManager = user.username === 'sabah_sndi';

  return (
    <span className={`inline-flex items-center gap-1 align-middle shrink-0 ${className}`}>
      {user.isVerified && <BlueVerifiedBadge size={size} />}
      {isGeneralManager ? (
        <KurdistanAdminVerifyBadge size={size === 'md' ? 'md' : 'sm'} />
      ) : user.isAdmin ? (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[10px] font-bold select-none"
          title="مدير مساعد / Admin"
        >
          <span>👑</span>
          <span>Admin</span>
        </span>
      ) : null}
    </span>
  );
};
