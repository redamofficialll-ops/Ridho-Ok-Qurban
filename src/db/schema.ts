import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const peserta = pgTable('peserta', {
  id: serial('id').primaryKey(),
  kodePeserta: text('kode_peserta').notNull(),
  nama: text('nama').notNull(),
  alamat: text('alamat').notNull(),
  noHp: text('no_hp'),
  varianHarga: integer('varian_harga').notNull(),
  kodeVarian: text('kode_varian').notNull(),
  catatanNiat: text('catatan_niat'),
  tanggalDaftar: text('tanggal_daftar').notNull(),
  totalTerkumpul: integer('total_terkumpul').default(0),
  targetKurban: integer('target_kurban').default(0),
  status: text('status').default('Dalam Proses'),
});

// Settings (singleton)
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});
