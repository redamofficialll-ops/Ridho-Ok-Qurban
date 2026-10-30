-- SQL untuk skema database Supabase aplikasi RIDHO OK QURBAN (Pendekatan JSONB - Simple & Robust)

-- Tabel untuk menyimpan seluruh state aplikasi dalam bentuk JSONB
CREATE TABLE IF NOT EXISTS app_data (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inisialisasi baris pertama (id=1)
INSERT INTO app_data (id, data) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;
