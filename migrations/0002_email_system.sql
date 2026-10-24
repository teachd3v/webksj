-- Migration 0002: Add Email System and Role-based Authentication

-- 1. Tambah kolom role di admin_users (jika belum ada)
ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'cms';

-- 2. Pastikan admin utama memiliki role 'cms'
UPDATE admin_users SET role = 'cms' WHERE email = 'admin@ksj.id';

-- 3. Tambah akun mail@ksj.id (password: ksj@2026 -> sha256) dengan role 'mail'
INSERT OR REPLACE INTO admin_users (id, email, name, password_hash, role)
VALUES (
    'mail-1',
    'mail@ksj.id',
    'Mail Administrator',
    '8553f3a733a0090af134b2a889d5fa29b221546572cf993d51d7dd50d6a2d29f',
    'mail'
);

-- 4. Tabel inbox_emails untuk menampung email masuk dari Cloudflare Email Routing / Worker
CREATE TABLE IF NOT EXISTS inbox_emails (
    id TEXT PRIMARY KEY,
    message_id TEXT,
    from_name TEXT,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL DEFAULT 'mail@kampungsilatjampang.id',
    subject TEXT NOT NULL,
    snippet TEXT,
    body_text TEXT,
    body_html TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    is_starred INTEGER NOT NULL DEFAULT 0,
    received_at TEXT DEFAULT (datetime('now'))
);

-- 5. Tabel email_replies untuk mencatat balasan email
CREATE TABLE IF NOT EXISTS email_replies (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    from_email TEXT NOT NULL DEFAULT 'mail@kampungsilatjampang.id',
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (email_id) REFERENCES inbox_emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inbox_emails_received ON inbox_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_replies_email_id ON email_replies(email_id);

-- 6. Seed email sambutan awal
INSERT OR REPLACE INTO inbox_emails (id, from_name, from_email, to_email, subject, snippet, body_text, body_html, is_read, received_at)
VALUES (
    'welcome-mail-1',
    'Sistem KSJ',
    'noreply@kampungsilatjampang.id',
    'mail@kampungsilatjampang.id',
    'Selamat Datang di Webmail Kampung Silat Jampang!',
    'Kotak surat mail@kampungsilatjampang.id telah aktif dan siap digunakan untuk menerima serta membalas pesan.',
    'Halo Pengelola Mail KSJ,\n\nKotak surat mail@kampungsilatjampang.id telah aktif dan siap menerima pesan dari masyarakat, calon murid, maupun tamu undangan perguruan silat.\n\nAnda dapat membaca dan membalas pesan secara langsung melalui dashboard ini.',
    '<p>Halo <strong>Pengelola Mail KSJ</strong>,</p><p>Kotak surat <code>mail@kampungsilatjampang.id</code> telah aktif dan siap menerima pesan dari masyarakat, calon murid, maupun tamu undangan perguruan silat.</p><p>Anda dapat membaca dan membalas pesan secara langsung melalui dashboard ini.</p>',
    0,
    datetime('now')
);
