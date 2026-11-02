-- ==============================================================================
-- SKEMA DATABASE SUPABASE - RIDHO OK QURBAN
-- ==============================================================================
-- Buka di: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABEL APP_SETTINGS
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

-- 2. TABEL VARIAN_KAMBING
CREATE TABLE IF NOT EXISTS public.varian_kambing (
    kode TEXT PRIMARY KEY,
    value BIGINT NOT NULL,
    label TEXT NOT NULL,
    grade TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABEL PENGURUS
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

-- 4. TABEL PESERTA
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

-- 5. TABEL APP_DATA (Penyimpanan Cadangan Cepat)
CREATE TABLE IF NOT EXISTS public.app_data (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varian_kambing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

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
