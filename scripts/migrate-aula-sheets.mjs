import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to credentials in previous project or local
const CRED_PATH = path.resolve(__dirname, '../../../Desktop/Web-Projects/pinjam-aula-ksj/credentials.json');
const SPREADSHEET_ID = '18U2xLO7STP3b_x0j0w2XgtmCdEusydguaGk340TXWV0';

function escapeSql(val) {
    if (val === null || val === undefined) return "''";
    const str = String(val).replace(/'/g, "''");
    return `'${str}'`;
}

function normalizeDateTime(dtStr) {
    if (!dtStr) return '';
    const trimmed = String(dtStr).trim();
    // If it's already ISO format (contains T)
    if (trimmed.includes('T')) return trimmed;

    // Handle "YYYY-MM-DD H:MM" or "YYYY-MM-DD HH:MM"
    const parts = trimmed.split(' ');
    if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const timeSplits = timePart.split(':');
        const hour = timeSplits[0].padStart(2, '0');
        const minute = (timeSplits[1] || '00').padStart(2, '0');
        return `${datePart}T${hour}:${minute}:00`;
    }
    return trimmed;
}

async function run() {
    console.log('🔄 Membaca credentials dari:', CRED_PATH);
    if (!fs.existsSync(CRED_PATH)) {
        throw new Error(`File credentials tidak ditemukan di ${CRED_PATH}`);
    }

    const creds = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
    const auth = new google.auth.JWT(
        creds.client_email,
        null,
        creds.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📥 Mengambil data Bookings dari Google Sheet...');
    const bookingsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Bookings!A2:J',
    });
    const bookingRows = bookingsRes.data.values || [];
    console.log(`✅ Didapatkan ${bookingRows.length} baris Bookings.`);

    console.log('📥 Mengambil data Feedback dari Google Sheet...');
    const feedbackRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Feedback!A2:J',
    });
    const feedbackRows = feedbackRes.data.values || [];
    console.log(`✅ Didapatkan ${feedbackRows.length} baris Feedback.`);

    const sqlStatements = [];
    sqlStatements.push('-- Seed Data Migrasi Peminjaman Aula KSJ dari Google Spreadsheet\n');

    // Generate Bookings SQL
    for (const row of bookingRows) {
        const id = (row[0] || '').trim();
        if (!id) continue;
        const nama = (row[1] || '').trim();
        const instansi = (row[2] || '').trim();
        const hp = (row[3] || '').trim();
        const kegiatan = (row[4] || '').trim();
        const peserta = parseInt(row[5] || '0', 10) || 0;
        const startTime = normalizeDateTime(row[6]);
        const endTime = normalizeDateTime(row[7]);
        const status = (row[8] || 'Pending').trim();
        const createdAt = row[9] ? normalizeDateTime(row[9]) : new Date().toISOString();

        sqlStatements.push(
            `INSERT OR REPLACE INTO aula_bookings (id, nama, instansi, hp, kegiatan, peserta, start_time, end_time, status, created_at) ` +
            `VALUES (${escapeSql(id)}, ${escapeSql(nama)}, ${escapeSql(instansi)}, ${escapeSql(hp)}, ${escapeSql(kegiatan)}, ${peserta}, ${escapeSql(startTime)}, ${escapeSql(endTime)}, ${escapeSql(status)}, ${escapeSql(createdAt)});`
        );
    }

    // Generate Feedback SQL
    for (const row of feedbackRows) {
        const id = (row[0] || '').trim();
        if (!id) continue;
        const nama = (row[1] || '').trim();
        const instansi = (row[2] || '').trim();
        const kegiatan = (row[3] || '').trim();
        const ratingKeseluruhan = parseInt(row[4] || '5', 10) || 5;
        const ratingKebersihan = parseInt(row[5] || '5', 10) || 5;
        const ratingFasilitas = parseInt(row[6] || '5', 10) || 5;
        const komentar = (row[7] || '').trim();
        const createdAt = row[8] ? normalizeDateTime(row[8]) : new Date().toISOString();
        const bookingId = (row[9] || '').trim();

        sqlStatements.push(
            `INSERT OR REPLACE INTO aula_feedback (id, booking_id, nama, instansi, kegiatan, rating_keseluruhan, rating_kebersihan, rating_fasilitas, komentar, created_at) ` +
            `VALUES (${escapeSql(id)}, ${escapeSql(bookingId)}, ${escapeSql(nama)}, ${escapeSql(instansi)}, ${escapeSql(kegiatan)}, ${ratingKeseluruhan}, ${ratingKebersihan}, ${ratingFasilitas}, ${escapeSql(komentar)}, ${escapeSql(createdAt)});`
        );
    }

    const outPath = path.resolve(__dirname, '../migrations/seed_aula.sql');
    fs.writeFileSync(outPath, sqlStatements.join('\n'), 'utf8');
    console.log(`🎉 Berhasil membuat file SQL seed: ${outPath} (${sqlStatements.length} statements)`);
}

run().catch((err) => {
    console.error('❌ Terjadi kesalahan saat migrasi:', err);
    process.exit(1);
});
