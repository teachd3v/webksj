-- Migration 0004: Sistem Peminjaman Aula KSJ & Role Pinjam

-- 1. Tabel aula_bookings
CREATE TABLE IF NOT EXISTS aula_bookings (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    instansi TEXT NOT NULL,
    hp TEXT NOT NULL,
    kegiatan TEXT NOT NULL,
    peserta INTEGER NOT NULL DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aula_bookings_start ON aula_bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_aula_bookings_status ON aula_bookings(status);

-- 2. Tabel aula_feedback
CREATE TABLE IF NOT EXISTS aula_feedback (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    nama TEXT NOT NULL,
    instansi TEXT NOT NULL,
    kegiatan TEXT NOT NULL,
    rating_keseluruhan INTEGER NOT NULL DEFAULT 5,
    rating_kebersihan INTEGER NOT NULL DEFAULT 5,
    rating_fasilitas INTEGER NOT NULL DEFAULT 5,
    komentar TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (booking_id) REFERENCES aula_bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aula_feedback_booking_id ON aula_feedback(booking_id);

-- 3. Akun Pengelola Aula: pinjam@ksj.id (password: ksj@pinjam2026 -> sha256)
INSERT OR REPLACE INTO admin_users (id, email, name, password_hash, role)
VALUES (
    'pinjam-1',
    'pinjam@ksj.id',
    'Pengelola Aula KSJ',
    'ddb705c164443599136b62bf6d950c40ba13d6d92016f2af4d6a96963cc019e1',
    'pinjam'
);
