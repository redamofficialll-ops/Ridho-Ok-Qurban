import React from 'react';
import { SummaryStats, AppSettings, formatRupiah } from '../types/qurban';
import { Wallet, Target, Clock, CheckCircle2, Users, Calendar, Sparkles } from 'lucide-react';

interface StatsOverviewProps {
  summary: SummaryStats;
  settings: AppSettings;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ summary, settings }) => {
  // Calculate countdown days to target Idul Adha
  const calculateDaysLeft = () => {
    try {
      const targetDate = new Date(settings.targetIdulAdha || '2027-05-16');
      const now = new Date();
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  const daysLeft = calculateDaysLeft();
  const weeksLeft = Math.ceil(daysLeft / 7);

  return (
    <div className="space-y-4">
      {/* Hero Welcome & Hadith Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A192F] via-[#1E293B] to-[#0A192F] border-2 border-[#D4AF37]/40 shadow-xl p-5 md:p-6 text-[#FAF8F5]">
        {/* Decorative corner motifs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0d1b2a]/50 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-xs font-semibold text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Program Tabungan Qurban 1448H/2027M</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#FAF8F5] tracking-tight">
              Laporan Keuangan Tabungan Qurban <span className="text-[#D4AF37] font-serif-brand">RIDHO OK</span>
            </h1>
            <p className="text-sm text-[#FAF8F5]/85 leading-relaxed">
              Transparan, amanah, dan tercatat otomatis secara real-time. Memudahkan jamaah & peserta merencanakan ibadah qurban kambing dengan beragam varian harga sesuai kesepakatan & ketulusan niat.
            </p>
          </div>

          {/* Countdown & Target Widget */}
          <div className="shrink-0 bg-[#0F172A]/90 border border-[#D4AF37]/40 rounded-xl p-4 min-w-[260px] shadow-inner">
            <div className="flex items-center justify-between text-xs text-[#FAF8F5]/70 mb-2">
              <span className="flex items-center gap-1.5 font-medium text-amber-300">
                <Calendar className="w-3.5 h-3.5" />
                Target Hari Raya Idul Adha
              </span>
              <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {settings.tahunHijriyah}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-[#D4AF37] font-serif-brand">
                {daysLeft}
              </span>
              <span className="text-xs text-[#FAF8F5]/80 font-medium">
                Hari Lagi (~{weeksLeft} Pekan)
              </span>
            </div>

            <div className="text-[11px] text-[#FAF8F5]/70 flex items-center justify-between border-t border-white/10 pt-2">
              <span>Perkiraan:</span>
              <span className="font-semibold text-white">
                {settings.targetIdulAdha ? new Date(settings.targetIdulAdha).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '16 Mei 2027'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="relative mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 gap-2">
            <span className="font-semibold text-amber-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#D4AF37]" />
              Progres Capaian Target Tabungan Keseluruhan
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#D4AF37] text-sm">
                {summary.persentaseTotal}%
              </span>
              <span className="text-white/60 text-xs">
                ({formatRupiah(summary.totalDanaTerkumpul)} dari {formatRupiah(summary.totalTargetDana)})
              </span>
            </div>
          </div>

          <div className="w-full bg-[#0A192F] h-3.5 rounded-full overflow-hidden border border-[#D4AF37]/30 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#F5D77F] rounded-full transition-all duration-700 shadow-md shadow-[#D4AF37]/50"
              style={{ width: `${Math.min(100, Math.max(0, summary.persentaseTotal))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4 Key KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Terkumpul */}
        <div className="bg-white rounded-xl border-2 border-[#D4AF37]/50 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Dana Terkumpul
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#B8860B]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A192F] font-serif-brand">
            {formatRupiah(summary.totalDanaTerkumpul)}
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersimpan aman di kas panitia</span>
          </div>
        </div>

        {/* Total Target Dana */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Target Biaya
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-800">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A192F] font-serif-brand">
            {formatRupiah(summary.totalTargetDana)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Akumulasi target hewan qurban peserta
          </div>
        </div>

        {/* Sisa Target */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sisa Target Tabungan
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-700 font-serif-brand">
            {formatRupiah(summary.totalSisaDana)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Kekurangan dana yang perlu dicicil
          </div>
        </div>

        {/* Total Peserta & Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Partisipasi Peserta
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0A192F] font-serif-brand">
              {summary.totalPeserta}
            </span>
            <span className="text-xs text-slate-500">Orang Peserta</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {summary.jumlahLunas} Lunas
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {summary.jumlahProses} Mencicil
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
