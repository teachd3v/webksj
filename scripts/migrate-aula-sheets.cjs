const fs = require('fs');
const path = require('path');
const { google } = require('C:/Users/Asus VivoBook/Desktop/Web-Projects/pinjam-aula-ksj/node_modules/googleapis');

const CRED_PATH = 'C:/Users/Asus VivoBook/Desktop/Web-Projects/pinjam-aula-ksj/credentials.json';
const SPREADSHEET_ID = '18U2xLO7STP3b_x0j0w2XgtmCdEusydguaGk340TXWV0';

function escapeSql(val) {
    if (val === null || val === undefined) return "''";
    const str = String(val).replace(/'/g, "''");
    return `'${str}'`;
}

function normalizeDateTime(dtStr) {
    if (!dtStr) return '';
    const trimmed = String(dtStr).trim();
    if (!trimmed) return '';

    // If it's already an ISO string with Z or timestamp
    if (trimmed.endsWith('Z')) return trimmed;

    let datePart = '';
    let timePart = '00:00:00';

    if (trimmed.includes('T')) {
        const parts = trimmed.split('T');
        datePart = parts[0];
        timePart = parts[1] || '00:00:00';
    } else if (trimmed.includes(' ')) {
        const parts = trimmed.split(' ');
        datePart = parts[0];
        timePart = parts[1] || '00:00:00';
    } else {
        datePart = trimmed;
    }

    // Convert datePart if it is M/D/YYYY or D/M/YYYY
    if (datePart.includes('/')) {
        const dparts = datePart.split('/');
        if (dparts.length === 3) {
            const m = dparts[0].padStart(2, '0');
            const d = dparts[1].padStart(2, '0');
            const y = dparts[2].padStart(4, '0');
            datePart = `${y}-${m}-${d}`;
        }
    } else if (datePart.includes('-')) {
        const dparts = datePart.split('-');
        if (dparts.length === 3) {
            const y = dparts[0].padStart(4, '0');
            const m = dparts[1].padStart(2, '0');
            const d = dparts[2].padStart(2, '0');
            datePart = `${y}-${m}-${d}`;
        }
    }

    const timeSplits = timePart.split(':');
    const hour = (timeSplits[0] || '00').padStart(2, '0');
    const minute = (timeSplits[1] || '00').padStart(2, '0');
    const second = (timeSplits[2] || '00').slice(0, 2).padStart(2, '0');

    return `${datePart}T${hour}:${minute}:${second}`;
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

    let validCount = 0;

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

        if (isNaN(new Date(startTime).getTime()) || isNaN(new Date(endTime).getTime())) {
            console.warn(`⚠️ Warning date parsing for ${id}: start="${row[6]}" -> "${startTime}", end="${row[7]}" -> "${endTime}"`);
        } else {
            validCount++;
        }

        sqlStatements.push(
            `INSERT OR REPLACE INTO aula_bookings (id, nama, instansi, hp, kegiatan, peserta, start_time, end_time, status, created_at) ` +
            `VALUES (${escapeSql(id)}, ${escapeSql(nama)}, ${escapeSql(instansi)}, ${escapeSql(hp)}, ${escapeSql(kegiatan)}, ${peserta}, ${escapeSql(startTime)}, ${escapeSql(endTime)}, ${escapeSql(status)}, ${escapeSql(createdAt)});`
        );
    }

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
    console.log(`🎉 Berhasil membuat file SQL seed: ${outPath} (${sqlStatements.length} statements, ${validCount} valid parsed dates)`);
}

run().catch((err) => {
    console.error('❌ Terjadi kesalahan saat migrasi:', err);
    process.exit(1);
});
