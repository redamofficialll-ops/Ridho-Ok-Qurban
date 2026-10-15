import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Apple } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar'
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in installed standalone mode, hide
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition active:scale-95 border border-emerald-400/40 ${className}`}
          title="Download dan Pasang Aplikasi RIDHO OK QURBAN di HP Android & iOS"
        >
          {isIOS ? (
            <Apple className="w-4 h-4 text-emerald-200" />
          ) : (
            <Smartphone className="w-4 h-4 text-emerald-200 animate-pulse" />
          )}
          <span>Download App (Android & iOS)</span>
        </button>
        <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-sm transition active:scale-95 ${className}`}
        title="Download dan Pasang Aplikasi RIDHO OK QURBAN di Smartphone Android & iOS"
      >
        {isIOS ? <Apple className="w-3.5 h-3.5 text-emerald-200" /> : <Smartphone className="w-3.5 h-3.5 text-emerald-200" />}
        <span>Download App</span>
      </button>
      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
