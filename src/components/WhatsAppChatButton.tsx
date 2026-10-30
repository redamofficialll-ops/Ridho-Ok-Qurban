import React from 'react';

export const WA_PHONE = '087874586603';
export const WA_PHONE_INTL = '6287874586603';
export const WA_DEFAULT_MESSAGE = "Assalamu'alaikum Admin Ridho Ok Qurban. Saya berminat dengan program Tabungan Qurban. Boleh minta informasi detail dan cara daftarnya?";
export const WA_CHAT_URL = `https://wa.me/${WA_PHONE_INTL}?text=${encodeURIComponent(WA_DEFAULT_MESSAGE)}`;

export function getCustomWhatsAppUrl(customMessage?: string): string {
  const msg = customMessage || WA_DEFAULT_MESSAGE;
  return `https://wa.me/${WA_PHONE_INTL}?text=${encodeURIComponent(msg)}`;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} fill-current`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

interface WhatsAppFloatingButtonProps {
  customMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ customMessage }) => {
  const url = getCustomWhatsAppUrl(customMessage);

  return (
    <aside aria-label="WhatsApp Contact" className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 group">
      {/* Tooltip badge on hover or subtle appearance */}
      <div className="hidden sm:flex items-center gap-1.5 bg-[#0A192F] text-[#FAF8F5] border border-[#D4AF37]/50 shadow-xl px-3 py-1.5 rounded-full text-xs font-semibold opacity-95 group-hover:opacity-100 transition pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
        <span>Chat Admin WhatsApp: <strong className="text-[#D4AF37] font-mono">{WA_PHONE}</strong></span>
      </div>

      {/* Main floating action button */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi Admin WhatsApp"
        className="flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-600/60 transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white/30"
      >
        <WhatsAppIcon className="w-6 h-6 shrink-0" />
        <span className="font-extrabold text-xs sm:text-sm tracking-wide">
          Hubungi Admin WA
        </span>
      </a>
    </aside>
  );
};
