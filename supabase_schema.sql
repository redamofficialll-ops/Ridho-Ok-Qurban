-- ==============================================================================
-- SKEMA DATABASE LENGKAP SUPABASE - RIDHO OK QURBAN
-- ==============================================================================
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Skrip ini menyiapkan seluruh tabel, kebijakan akses publik (RLS), 
-- realtime subscriptions, serta data awal (seed) secara otomatis.
-- ==============================================================================

-- 1. TABEL APP_SETTINGS (Pengaturan Lembaga & Target Qurban)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_settings',
    nama_program TEXT NOT NULL DEFAULT 'RIDHO OK QURBAN',
    nama_lembaga TEXT NOT NULL DEFAULT 'RIDHO OK QURBAN',
    target_idul_adha TEXT NOT NULL DEFAULT '2027-05-16',
    tahun_hijriyah TEXT NOT NULL DEFAULT '1448 H',
    tahun_masehi TEXT NOT NULL DEFAULT '2027 M',
    admin_pin TEXT NOT NULL DEFAULT '1234',
    kontak_pengurus TEXT DEFAULT '087874586603',
    rekening_tujuan TEXT DEFAULT 'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho',
    custom_logo_url TEXT,
    connected_spreadsheet_id TEXT,
    connected_spreadsheet_title TEXT,
    auto_sync_sheets BOOLEAN DEFAULT true,
    authorized_google_email TEXT DEFAULT 'redamofficialll@gmail.com',
    last_sheets_sync_time TEXT,
    is_sheets_locked BOOLEAN DEFAULT false,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABEL VARIAN_KAMBING (12 Pilihan Kambing Sesuai Syariat)
CREATE TABLE IF NOT EXISTS public.varian_kambing (
    kode TEXT PRIMARY KEY,
    value BIGINT NOT NULL,
    label TEXT NOT NULL,
    grade TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABEL PENGURUS (Akun 5 Pengurus Aktif)
CREATE TABLE IF NOT EXISTS public.pengurus (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Pengurus Aktif',
    status TEXT NOT NULL DEFAULT 'Aktif',
    terakhir_login TEXT,
    password_changed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABEL PESERTA (Data Mudhohi & Riwayat Setoran Cicilan)
CREATE TABLE IF NOT EXISTS public.peserta (
    id TEXT PRIMARY KEY,
    kode_peserta TEXT NOT NULL,
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    no_hp TEXT DEFAULT '-',
    varian_harga BIGINT NOT NULL,
    nama_varian TEXT NOT NULL,
    kode_varian TEXT,
    target_kurban BIGINT NOT NULL,
    total_terkumpul BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Dalam Proses',
    tanggal_daftar TEXT NOT NULL,
    catatan_niat TEXT DEFAULT '',
    riwayat_setoran JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABEL APP_DATA (Fallback JSONB untuk sinkronisasi state instan)
CREATE TABLE IF NOT EXISTS public.app_data (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS) - AKSES ANON & PUBLIK PENUH
-- ==============================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varian_kambing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan Akses Penuh untuk Anon/Authenticated Client
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Akses Penuh app_settings" ON public.app_settings;
    CREATE POLICY "Akses Penuh app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh varian_kambing" ON public.varian_kambing;
    CREATE POLICY "Akses Penuh varian_kambing" ON public.varian_kambing FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh pengurus" ON public.pengurus;
    CREATE POLICY "Akses Penuh pengurus" ON public.pengurus FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh peserta" ON public.peserta;
    CREATE POLICY "Akses Penuh peserta" ON public.peserta FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh app_data" ON public.app_data;
    CREATE POLICY "Akses Penuh app_data" ON public.app_data FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- DATA AWAL (INITIAL SEEDING)
-- ==============================================================================

-- Seed Pengaturan Aplikasi
INSERT INTO public.app_settings (id, nama_program, nama_lembaga, target_idul_adha, tahun_hijriyah, tahun_masehi, admin_pin, kontak_pengurus, rekening_tujuan, authorized_google_email)
VALUES (
    'main_settings',
    'RIDHO OK QURBAN',
    'RIDHO OK QURBAN',
    '2027-05-16',
    '1448 H',
    '2027 M',
    '1234',
    '087874586603',
    'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho',
    'redamofficialll@gmail.com'
) ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- Seed 12 Varian Kambing
INSERT INTO public.varian_kambing (kode, value, label, grade, deskripsi) VALUES
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
('V12', 7000000, 'Rp 7.000.000', 'Kambing Tipe Jumbo 2', 'Bobot hidup > 63 kg')
ON CONFLICT (kode) DO NOTHING;

-- Seed 5 Akun Pengurus Resmi
INSERT INTO public.pengurus (id, username, nama, password, role, status) VALUES
('adm-001', 'Kemal1208', 'Kemal1208', 'Kemal1208', 'Pengurus Aktif', 'Aktif'),
('adm-002', 'Addin7846', 'Addin7846', 'Addin7846', 'Pengurus Aktif', 'Aktif'),
('adm-003', 'Gilang2356', 'Gilang2356', 'Gilang2356', 'Pengurus Aktif', 'Aktif'),
('adm-004', 'Apni4638', 'Apni4638', 'Apni4638', 'Pengurus Aktif', 'Aktif'),
('adm-005', 'Ridho9856', 'Ridho9856', 'Ridho9856', 'Pengurus Aktif', 'Aktif')
ON CONFLICT (id) DO NOTHING;

-- Seed Peserta Awal & Riwayat Setoran
INSERT INTO public.peserta (
    id, kode_peserta, nama, alamat, no_hp, varian_harga, nama_varian, kode_varian, target_kurban, total_terkumpul, status, tanggal_daftar, catatan_niat, riwayat_setoran
) VALUES
(
    'p-001', 'ROQ-001', 'H. Ahmad Supriyadi', 'Jl. Melati No. 12, RT 03/RW 05, Kel. Sukamaju', '081298765432',
    4500000, 'Rp 4.500.000 (Kambing Tipe Super 2)', 'V06', 4500000, 4500000, 'Lunas', '2026-01-15',
    'Bismillah qurban untuk keluarga tercinta',
    '[
        {"id": "set-001-1", "tanggal": "2026-01-15", "jumlah": 2000000, "metode": "Transfer Bank", "keterangan": "Setoran Awal Tabungan", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2601-01"},
        {"id": "set-001-2", "tanggal": "2026-02-15", "jumlah": 2500000, "metode": "Transfer Bank", "keterangan": "Pelunasan Tabungan Qurban", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2602-09"}
    ]'::jsonb
),
(
    'p-002', 'ROQ-002', 'Ibu Siti Nurhaliza', 'Kompleks Griya Asri Blok B2 No. 8, Kec. Cibinong', '085712349876',
    3500000, 'Rp 3.500.000 (Kambing Tipe C)', 'V04', 3500000, 2500000, 'Dalam Proses', '2026-01-20',
    'Niat qurban atas nama pribadi ikhlas lillahi ta''ala',
    '[
        {"id": "set-002-1", "tanggal": "2026-01-20", "jumlah": 1000000, "metode": "Tunai", "keterangan": "Setoran Tahap 1", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2601-04"},
        {"id": "set-002-2", "tanggal": "2026-02-20", "jumlah": 1500000, "metode": "QRIS", "keterangan": "Setoran Tahap 2", "penerima": "Bpk. Hendra (Sekretaris)", "nomorKwitansi": "KW-ROQ-2602-14"}
    ]'::jsonb
),
(
    'p-003', 'ROQ-003', 'Bpk. Wahyu Hidayat', 'Dusun Mekar RT 01/RW 02, Desa Pasir Putih', '087855443322',
    5000000, 'Rp 5.000.000 (Kambing Tipe Premium 2)', 'V08', 5000000, 3000000, 'Dalam Proses', '2026-02-01',
    'Qurban kambing pilihan terbaik',
    '[
        {"id": "set-003-1", "tanggal": "2026-02-01", "jumlah": 1500000, "metode": "Transfer Bank", "keterangan": "Cicilan ke-1", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2602-03"},
        {"id": "set-003-2", "tanggal": "2026-03-01", "jumlah": 1500000, "metode": "Transfer Bank", "keterangan": "Cicilan ke-2", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2603-02"}
    ]'::jsonb
),
(
    'p-004', 'ROQ-004', 'Ibu Hj. Maryam Lestari', 'Jl. Flamboyan Timur No. 45, RT 04/RW 01', '081377889911',
    7000000, 'Rp 7.000.000 (Kambing Tipe Jumbo 2)', 'V12', 7000000, 7000000, 'Lunas', '2026-01-10',
    'Qurban kambing istimewa untuk almarhum orang tua',
    '[
        {"id": "set-004-1", "tanggal": "2026-01-10", "jumlah": 3500000, "metode": "Transfer Bank", "keterangan": "Setoran Termin 1", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2601-02"},
        {"id": "set-004-2", "tanggal": "2026-02-10", "jumlah": 3500000, "metode": "Transfer Bank", "keterangan": "Pelunasan Kambing Jumbo", "penerima": "Ust. Ridwan (Bendahara)", "nomorKwitansi": "KW-ROQ-2602-06"}
    ]'::jsonb
),
(
    'p-005', 'ROQ-005', 'Bpk. Faisal Rahman', 'Jl. Garuda No. 77, RT 02/RW 03, Kel. Cempaka', '082199887766',
    2500000, 'Rp 2.500.000 (Kambing Tipe A)', 'V02', 2500000, 1500000, 'Dalam Proses', '2026-02-15',
    'Niat tabungan rutin tiap awal bulan',
    '[
        {"id": "set-005-1", "tanggal": "2026-02-15", "jumlah": 1500000, "metode": "Tunai", "keterangan": "Uang Muka Tabungan", "penerima": "Bpk. Hendra (Sekretaris)", "nomorKwitansi": "KW-ROQ-2602-11"}
    ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Inisialisasi baris pertama app_data
INSERT INTO public.app_data (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

-- Aktifkan Realtime Publikasi (opsional jika ekstensi realtime aktif)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.peserta;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.varian_kambing;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
