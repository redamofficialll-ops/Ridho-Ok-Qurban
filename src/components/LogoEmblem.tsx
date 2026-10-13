import React from 'react';

interface LogoEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  customLogoUrl?: string;
}

export const LogoEmblem: React.FC<LogoEmblemProps> = ({
  className = '',
  size = 'md',
  showText = true,
  customLogoUrl
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const logoSrc = customLogoUrl || '/logo-qurban.jpg';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeMap[size]} shrink-0 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/30 bg-[#0A192F] p-0.5 group`}>
        <img
          src={logoSrc}
          alt="RIDHO OK QURBAN"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className={`font-serif-brand font-black tracking-wider text-[#D4AF37] drop-shadow-sm ${textSizes[size]}`}>
              RIDHO OK QURBAN
            </span>
            <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 rounded">
              1448 H
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
