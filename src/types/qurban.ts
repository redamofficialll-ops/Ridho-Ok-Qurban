export interface Setoran {
  id: string;
  tanggal: string;
  jumlah: number;
  metode: 'Tunai' | 'Transfer Bank' | 'QRIS';
  keterangan?: string;
  penerima: string;
  nomorKwitansi: string;
}

export interface Peserta {
  id: string;
  kodePeserta: string;
  nama: string;
  alamat: string;
  noHp: string;
  varianHarga: number;
  namaVarian: string;
  kodeVarian?: string;
  targetKurban: number;
  totalTerkumpul: number;
  status: 'Lunas' | 'Dalam Proses';
  tanggalDaftar: string;
  catatanNiat?: string;
  riwayatSetoran: Setoran[];
}

export interface Pengurus {
  id: string;
  username: string;
  nama: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
  terakhirLogin?: string;
}

export interface ActiveAdminSession {
  id: string;
  username: string;
  nama: string;
  role: string;
  loginTime: string;
}

export interface AppSettings {
  namaProgram: string;
  namaLembaga: string;
  targetIdulAdha: string;
  tahunHijriyah: string;
  tahunMasehi: string;
  adminPin?: string;
  appsScriptWebhookUrl?: string;
  kontakPengurus: string;
  rekeningTujuan: string;
  customLogoUrl?: string;
  connectedSpreadsheetId?: string;
  connectedSpreadsheetTitle?: string;
  autoSyncSheets?: boolean;
  authorizedGoogleEmail?: string;
  lastSheetsSyncTime?: string;
  isSheetsLocked?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseConnected?: boolean;
  lastSupabaseSyncTime?: string;
}

export interface SummaryStats {
  totalPeserta: number;
  totalTargetDana: number;
  totalDanaTerkumpul: number;
  totalSisaDana: number;
  jumlahLunas: number;
  jumlahProses: number;
  persentaseTotal: number;
}

export interface VarianKambingOption {
  kode: string;
  value: number;
  label: string;
  grade: string;
  deskripsi: string;
}

export const HARGA_KAMBING_OPTIONS: VarianKambingOption[] = [
  { kode: 'V01', value: 2000000, label: 'Rp 2.000.000', grade: 'Kambing Tipe Hemat', deskripsi: 'Bobot hidup ± 20-22 kg, sehat, cukup umur & sesuai syariat' },
  { kode: 'V02', value: 2500000, label: 'Rp 2.500.000', grade: 'Kambing Tipe A', deskripsi: 'Bobot hidup ± 23-25 kg, kualitas baik & sesuai syariat' },
  { kode: 'V03', value: 3000000, label: 'Rp 3.000.000', grade: 'Kambing Tipe B', deskripsi: 'Bobot hidup ± 26-28 kg, gagah, sehat & berotot' },
  { kode: 'V04', value: 3500000, label: 'Rp 3.500.000', grade: 'Kambing Tipe C', deskripsi: 'Bobot hidup ± 29-31 kg, postur ideal & gemuk' },
  { kode: 'V05', value: 4000000, label: 'Rp 4.000.000', grade: 'Kambing Tipe Super 1', deskripsi: 'Bobot hidup ± 32-35 kg, gemuk, bertanduk & prima' },
  { kode: 'V06', value: 4500000, label: 'Rp 4.500.000', grade: 'Kambing Tipe Super 2', deskripsi: 'Bobot hidup ± 36-39 kg, pilihan favorit jamaah' },
  { kode: 'V07', value: 4800000, label: 'Rp 4.800.000', grade: 'Kambing Tipe Premium 1', deskripsi: 'Bobot hidup ± 40-43 kg, kualitas premium istimewa' },
  { kode: 'V08', value: 5000000, label: 'Rp 5.000.000', grade: 'Kambing Tipe Premium 2', deskripsi: 'Bobot hidup ± 44-47 kg, tegap, gemuk & sehat sempurna' },
  { kode: 'V09', value: 5500000, label: 'Rp 5.500.000', grade: 'Kambing Tipe Istimewa 1', deskripsi: 'Bobot hidup ± 48-52 kg, kambing super unggul' },
  { kode: 'V10', value: 6000000, label: 'Rp 6.000.000', grade: 'Kambing Tipe Istimewa 2', deskripsi: 'Bobot hidup ± 53-57 kg, daging melimpah barokah' },
  { kode: 'V11', value: 6500000, label: 'Rp 6.500.000', grade: 'Kambing Tipe Jumbo 1', deskripsi: 'Bobot hidup ± 58-62 kg, kambing jumbo istimewa' },
  { kode: 'V12', value: 7000000, label: 'Rp 7.000.000', grade: 'Kambing Tipe Jumbo 2', deskripsi: 'Bobot hidup > 63 kg, kelas tertinggi super istimewa' },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}
