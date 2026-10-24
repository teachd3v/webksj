-- Migration 0003: Attachments and Email Composer (Sent Emails)

-- 1. Tambah kolom attachments di inbox_emails & email_replies
ALTER TABLE inbox_emails ADD COLUMN attachments TEXT DEFAULT '[]';
ALTER TABLE email_replies ADD COLUMN attachments TEXT DEFAULT '[]';

-- 2. Buat tabel sent_emails untuk email yang baru ditulis / dikirim (Compose)
CREATE TABLE IF NOT EXISTS sent_emails (
    id TEXT PRIMARY KEY,
    from_email TEXT NOT NULL DEFAULT 'mail@kampungsilatjampang.id',
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    attachments TEXT DEFAULT '[]',
    sent_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sent_emails_sent ON sent_emails(sent_at DESC);
