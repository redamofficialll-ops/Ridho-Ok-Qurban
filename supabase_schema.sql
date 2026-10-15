-- SQL untuk skema database Supabase aplikasi RIDHO OK QURBAN

-- 1. Tabel untuk menyimpan data peserta qurban
CREATE TABLE peserta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kode_peserta TEXT NOT NULL,
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    no_hp TEXT,
    varian_harga NUMERIC NOT NULL,
    nama_varian TEXT NOT NULL,
    kode_varian TEXT,
    target_kurban NUMERIC NOT NULL,
    total_terkumpul NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('Lunas', 'Dalam Proses')) DEFAULT 'Dalam Proses',
    tanggal_daftar DATE NOT NULL,
    catatan_niat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel untuk riwayat setoran
CREATE TABLE riwayat_setoran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    peserta_id UUID REFERENCES peserta(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jumlah NUMERIC NOT NULL,
    metode TEXT CHECK (metode IN ('Tunai', 'Transfer Bank', 'QRIS')),
    keterangan TEXT,
    penerima TEXT NOT NULL,
    nomor_kwitansi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel untuk pengaturan aplikasi (Simpan dalam bentuk key-value atau satu baris konfigurasi)
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    nama_program TEXT,
    nama_lembaga TEXT,
    target_idul_adha TEXT,
    tahun_hijriyah TEXT,
    tahun_masehi TEXT,
    kontak_pengurus TEXT,
    rekening_tujuan TEXT,
    custom_logo_url TEXT,
    connected_spreadsheet_id TEXT,
    connected_spreadsheet_title TEXT,
    auto_sync_sheets BOOLEAN DEFAULT true,
    authorized_google_email TEXT,
    is_sheets_locked BOOLEAN DEFAULT false
);

-- 4. Tabel untuk akun pengurus
CREATE TABLE pengurus (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'Pengurus Aktif',
    status TEXT CHECK (status IN ('Aktif', 'Nonaktif')) DEFAULT 'Aktif',
    terakhir_login TIMESTAMP WITH TIME ZONE
);

-- 5. Tabel untuk varian harga kambing (12 Pilihan)
CREATE TABLE varian_kambing (
    kode TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    label TEXT NOT NULL,
    grade TEXT NOT NULL,
    deskripsi TEXT
);

-- Seed Data untuk Varian Kambing
INSERT INTO varian_kambing (kode, value, label, grade, deskripsi) VALUES
('V01', 2000000, 'Rp 2.000.000', 'Kambing Tipe Hemat', 'Bobot hidup ± 20-22 kg'),
('V02', 2500000, 'Rp 2.500.000', 'Kambing Tipe A', 'Bobot hidup ± 23-25 kg'),
('V03', 3000000, 'Rp 3.000.000', 'Kambing Tipe B', 'Bobot hidup ± 26-28 kg'),
('V04', 3500000, 'Rp 3.500.000', 'Kambing Tipe C', 'Bobot hidup ± 29-31 kg'),
('V05', 4000000, 'Rp 4.000.000', 'Kambing Tipe Super 1', 'Bobot hidup ± 32-35 kg'),
('V06', 4500000, 'Rp 4.500.000', 'Kambing Tipe Super 2', 'Bobot hidup ± 36-39 kg'),
('V07', 4800000, 'Rp 4.800.000', 'Kambing Tipe Premium 1', 'Bobot hidup ± 40-43 kg'),
('V08', 5000000, 'Rp 5.000.000', 'Kambing Tipe Premium 2', 'Bobot hidup ± 44-47 kg'),
('V09', 5500000, 'Rp 5.500.000', 'Kambing Tipe Istimewa 1', 'Bobot hidup ± 48-52 kg'),
('V10', 6000000, 'Rp 6.000.000', 'Kambing Tipe Istimewa 2', 'Bobot hidup ± 53-57 kg'),
('V11', 6500000, 'Rp 6.500.000', 'Kambing Tipe Jumbo 1', 'Bobot hidup ± 58-62 kg'),
('V12', 7000000, 'Rp 7.000.000', 'Kambing Tipe Jumbo 2', 'Bobot hidup > 63 kg');
