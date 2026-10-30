import type { APIRoute } from 'astro';
import { Hono } from 'hono';
import { env } from 'cloudflare:workers';
import { getDb, getMediaBucket } from '@/lib/db';
import { generateToken, getCookie, sha256Hex, verifyAdminSession } from '@/lib/auth';

type Variables = {
    db: D1Database;
    bucket: R2Bucket | null;
    user: { id: string; email: string; name: string; role: string } | null;
};

const app = new Hono<{ Variables: Variables }>().basePath('/api');

function slugify(str: string): string {
    return String(str || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Auth Endpoints
app.post('/auth/login', async (c) => {
    const db = c.get('db');
    const body = await c.req.json<{ email?: string; password?: string }>();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
        return c.json({ error: 'Email dan password wajib diisi' }, 400);
    }

    const hash = await sha256Hex(password);
    const user = await db
        .prepare('SELECT id, email, name, COALESCE(role, \'cms\') as role FROM admin_users WHERE LOWER(email) = ? AND password_hash = ? LIMIT 1')
        .bind(email, hash)
        .first<{ id: string; email: string; name: string; role: string }>();

    if (!user) {
        return c.json({ error: 'Email atau password salah' }, 401);
    }

    const token = generateToken();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days

    await db
        .prepare('INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(token, user.id, expiresAt)
        .run();

    c.header(
        'Set-Cookie',
        `ksj_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    return c.json({ user });
});

app.post('/auth/logout', async (c) => {
    const db = c.get('db');
    const token = getCookie(c.req.header('cookie'), 'ksj_session');
    if (token) {
        await db.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run();
    }
    c.header('Set-Cookie', 'ksj_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return c.json({ ok: true });
});

app.get('/auth/me', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ user: null }, 401);
    return c.json({ user });
});

// Middleware to protect admin routes
app.use('/admin/*', async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

// Change password / account update
app.put('/admin/account', async (c) => {
    const db = c.get('db');
    const user = c.get('user')!;
    const body = await c.req.json<{ email?: string; name?: string; newPassword?: string }>();
    const email = (body.email || user.email).trim().toLowerCase();
    const name = (body.name || user.name).trim();

    if (body.newPassword && body.newPassword.length >= 6) {
        const newHash = await sha256Hex(body.newPassword);
        await db
            .prepare('UPDATE admin_users SET email = ?, name = ?, password_hash = ? WHERE id = ?')
            .bind(email, name, newHash, user.id)
            .run();
    } else {
        await db
            .prepare('UPDATE admin_users SET email = ?, name = ? WHERE id = ?')
            .bind(email, name, user.id)
            .run();
    }

    return c.json({ ok: true, user: { id: user.id, email, name } });
});

// Summary Stats for Dashboard
app.get('/admin/stats', async (c) => {
    const db = c.get('db');
    const [pCount, nCount, prodCount, gCount] = await Promise.all([
        db.prepare('SELECT COUNT(*) as total FROM perguruan').first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) as total FROM news').first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) as total FROM products').first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) as total FROM gallery').first<{ total: number }>(),
    ]);
    return c.json({
        perguruan: pCount?.total || 0,
        news: nCount?.total || 0,
        products: prodCount?.total || 0,
        gallery: gCount?.total || 0,
    });
});

// --- R2 MEDIA UPLOAD & SERVING ---
app.post('/admin/upload', async (c) => {
    const bucket = c.get('bucket');
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return c.json({ error: 'File tidak ditemukan' }, 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    if (bucket) {
        await bucket.put(key, arrayBuffer, {
            httpMetadata: { contentType: file.type || 'application/octet-stream' },
        });
        return c.json({
            url: `/api/media/${key}`,
            key,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
        });
    }

    return c.json({ error: 'R2 Bucket binding tidak tersedia' }, 500);
});

app.get('/media/:key', async (c) => {
    const bucket = c.get('bucket');
    const key = c.req.param('key');
    if (!bucket) return c.notFound();

    const obj = await bucket.get(key);
    if (!obj) return c.notFound();

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(obj.body, { headers });
});

// --- 1. PERGURUAN CRUD ---
app.get('/admin/perguruan', async (c) => {
    const db = c.get('db');
    const { results } = await db.prepare('SELECT * FROM perguruan ORDER BY name ASC').all();
    return c.json({ items: results || [] });
});

app.post('/admin/perguruan', async (c) => {
    const db = c.get('db');
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const slug = body.slug ? slugify(body.slug) : slugify(body.name || id);

    await db
        .prepare(
            `INSERT INTO perguruan (id, name, slug, style, members, location, logo, master_name, contact, description, history)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            id,
            body.name || 'Tanpa Nama',
            slug,
            body.style || '-',
            Number(body.members) || 0,
            body.location || '-',
            body.logo || null,
            body.master_name || null,
            body.contact || null,
            body.description || null,
            body.history || null
        )
        .run();

    return c.json({ ok: true, id, slug });
});

app.put('/admin/perguruan/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    const slug = body.slug ? slugify(body.slug) : slugify(body.name || id);

    await db
        .prepare(
            `UPDATE perguruan
             SET name = ?, slug = ?, style = ?, members = ?, location = ?, logo = ?,
                 master_name = ?, contact = ?, description = ?, history = ?, updated_at = datetime('now')
             WHERE id = ?`
        )
        .bind(
            body.name || 'Tanpa Nama',
            slug,
            body.style || '-',
            Number(body.members) || 0,
            body.location || '-',
            body.logo || null,
            body.master_name || null,
            body.contact || null,
            body.description || null,
            body.history || null,
            id
        )
        .run();

    return c.json({ ok: true });
});

app.delete('/admin/perguruan/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    await db.prepare('DELETE FROM perguruan WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
});

// --- 2. BERITA (NEWS) CRUD ---
app.get('/admin/news', async (c) => {
    const db = c.get('db');
    const { results } = await db.prepare('SELECT * FROM news ORDER BY date DESC').all();
    return c.json({ items: results || [] });
});

app.post('/admin/news', async (c) => {
    const db = c.get('db');
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const slug = body.slug ? slugify(body.slug) : slugify(body.title || id);

    await db
        .prepare(
            `INSERT INTO news (id, title, slug, date, excerpt, content, image)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            id,
            body.title || 'Tanpa Judul',
            slug,
            body.date || new Date().toISOString().slice(0, 10),
            body.excerpt || '',
            body.content || '',
            body.image || null
        )
        .run();

    return c.json({ ok: true, id, slug });
});

app.put('/admin/news/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    const slug = body.slug ? slugify(body.slug) : slugify(body.title || id);

    await db
        .prepare(
            `UPDATE news
             SET title = ?, slug = ?, date = ?, excerpt = ?, content = ?, image = ?, updated_at = datetime('now')
             WHERE id = ?`
        )
        .bind(
            body.title || 'Tanpa Judul',
            slug,
            body.date || new Date().toISOString().slice(0, 10),
            body.excerpt || '',
            body.content || '',
            body.image || null,
            id
        )
        .run();

    return c.json({ ok: true });
});

app.delete('/admin/news/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    await db.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
});

// --- 3. PRODUCTS (UMKM) CRUD ---
app.get('/admin/products', async (c) => {
    const db = c.get('db');
    const { results } = await db.prepare('SELECT * FROM products ORDER BY is_best_seller DESC, created_at DESC').all();
    return c.json({ items: results || [] });
});

app.post('/admin/products', async (c) => {
    const db = c.get('db');
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();

    await db
        .prepare(
            `INSERT INTO products (id, name, price, image, whatsapp_link, is_best_seller)
             VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
            id,
            body.name || 'Produk UMKM',
            body.price || 'Rp 0',
            body.image || null,
            body.whatsapp_link || '',
            body.is_best_seller ? 1 : 0
        )
        .run();

    return c.json({ ok: true, id });
});

app.put('/admin/products/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();

    await db
        .prepare(
            `UPDATE products
             SET name = ?, price = ?, image = ?, whatsapp_link = ?, is_best_seller = ?, updated_at = datetime('now')
             WHERE id = ?`
        )
        .bind(
            body.name || 'Produk UMKM',
            body.price || 'Rp 0',
            body.image || null,
            body.whatsapp_link || '',
            body.is_best_seller ? 1 : 0,
            id
        )
        .run();

    return c.json({ ok: true });
});

app.delete('/admin/products/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
});

// --- 4. GALLERY CRUD ---
app.get('/admin/gallery', async (c) => {
    const db = c.get('db');
    const { results } = await db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
    return c.json({ items: results || [] });
});

app.post('/admin/gallery', async (c) => {
    const db = c.get('db');
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();

    await db
        .prepare('INSERT INTO gallery (id, caption, image) VALUES (?, ?, ?)')
        .bind(id, body.caption || '', body.image || '')
        .run();

    return c.json({ ok: true, id });
});

app.put('/admin/gallery/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();

    await db
        .prepare('UPDATE gallery SET caption = ?, image = ? WHERE id = ?')
        .bind(body.caption || '', body.image || '', id)
        .run();

    return c.json({ ok: true });
});

app.delete('/admin/gallery/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    await db.prepare('DELETE FROM gallery WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
});

// --- 5. ORGANISASI SINGLETON ---
app.get('/admin/organisasi', async (c) => {
    const db = c.get('db');
    const row = await db
        .prepare("SELECT * FROM organisasi WHERE id = 'organisasi' LIMIT 1")
        .first<{ title: string; pengurus_inti: string; bidang_list: string }>();

    if (!row) {
        return c.json({
            title: 'PENGURUS KAMPUNG SILAT JAMPANG',
            pengurusInti: [],
            bidangList: [],
        });
    }

    return c.json({
        title: row.title,
        pengurusInti: JSON.parse(row.pengurus_inti || '[]'),
        bidangList: JSON.parse(row.bidang_list || '[]'),
    });
});

app.put('/admin/organisasi', async (c) => {
    const db = c.get('db');
    const body = await c.req.json();

    await db
        .prepare(
            `INSERT OR REPLACE INTO organisasi (id, title, pengurus_inti, bidang_list, updated_at)
             VALUES ('organisasi', ?, ?, ?, datetime('now'))`
        )
        .bind(
            body.title || 'PENGURUS KAMPUNG SILAT JAMPANG',
            JSON.stringify(body.pengurusInti || []),
            JSON.stringify(body.bidangList || [])
        )
        .run();

    return c.json({ ok: true });
});

// Mail Inbox Endpoints
app.get('/admin/mail/inbox', async (c) => {
    const db = c.get('db');
    const { results } = await db
        .prepare('SELECT * FROM inbox_emails ORDER BY received_at DESC')
        .all();
    return c.json({ emails: results || [] });
});

app.get('/admin/mail/inbox/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const email = await db
        .prepare('SELECT * FROM inbox_emails WHERE id = ? LIMIT 1')
        .bind(id)
        .first();

    if (!email) {
        return c.json({ error: 'Email tidak ditemukan' }, 404);
    }

    // Mark as read
    await db.prepare('UPDATE inbox_emails SET is_read = 1 WHERE id = ?').bind(id).run();

    // Fetch replies
    const { results: replies } = await db
        .prepare('SELECT * FROM email_replies WHERE email_id = ? ORDER BY sent_at ASC')
        .bind(id)
        .all();

    return c.json({ email: { ...email, is_read: 1, replies: replies || [] } });
});

app.put('/admin/mail/inbox/:id/toggle-star', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    await db
        .prepare('UPDATE inbox_emails SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?')
        .bind(id)
        .run();
    return c.json({ ok: true });
});

app.delete('/admin/mail/inbox/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    await db.prepare('DELETE FROM inbox_emails WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
});

async function sendViaResend(apiKey: string, to: string, subject: string, text: string, attachments?: any[]) {
    const formattedAttachments = (attachments || []).map((att: any) => ({
        filename: att.name,
        path: att.url?.startsWith('http') ? att.url : `https://kampungsilatjampang.id${att.url}`,
    }));

    const payload: any = {
        from: 'Kampung Silat Jampang <mail@kampungsilatjampang.id>',
        to: [to],
        subject,
        text,
    };
    if (formattedAttachments.length > 0) {
        payload.attachments = formattedAttachments;
    }

    try {
        let res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn('Resend custom domain failed, fallback to onboarding@resend.dev:', errText);
            payload.from = 'KSJ Webmail <onboarding@resend.dev>';
            res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        }
        return res.ok;
    } catch (err) {
        console.error('sendViaResend network error:', err);
        return false;
    }
}

app.post('/admin/mail/reply', async (c) => {
    const db = c.get('db');
    const body = await c.req.json<{ emailId: string; to: string; subject: string; body: string; attachments?: any[] }>();

    if (!body.emailId || !body.to || !body.body) {
        return c.json({ error: 'Data balasan tidak lengkap' }, 400);
    }

    const replyId = `rep-${Date.now()}`;
    const sentAt = new Date().toISOString();
    const attachmentsJson = JSON.stringify(body.attachments || []);

    let sendStatus = 'sent';
    const resendKey = (env as any)?.RESEND_API_KEY || (globalThis as any).process?.env?.RESEND_API_KEY;
    if (resendKey) {
        await sendViaResend(resendKey, body.to, body.subject, body.body, body.attachments);
    }

    await db
        .prepare(
            `INSERT INTO email_replies (id, email_id, from_email, to_email, subject, body, status, attachments, sent_at)
             VALUES (?, ?, 'mail@kampungsilatjampang.id', ?, ?, ?, ?, ?, ?)`
        )
        .bind(replyId, body.emailId, body.to, body.subject, body.body, sendStatus, attachmentsJson, sentAt)
        .run();

    return c.json({
        ok: true,
        reply: {
            id: replyId,
            email_id: body.emailId,
            from_email: 'mail@kampungsilatjampang.id',
            to_email: body.to,
            subject: body.subject,
            body: body.body,
            status: sendStatus,
            attachments: body.attachments || [],
            sent_at: sentAt,
        },
    });
});

// Compose & Sent Mail Endpoints
app.get('/admin/mail/sent', async (c) => {
    const db = c.get('db');
    const { results } = await db
        .prepare('SELECT * FROM sent_emails ORDER BY sent_at DESC')
        .all();
    const mapped = (results || []).map((r: any) => ({
        ...r,
        body_text: r.body || '',
        snippet: r.body ? r.body.substring(0, 150) : '',
    }));
    return c.json({ emails: mapped });
});

app.post('/admin/mail/compose', async (c) => {
    const db = c.get('db');
    const body = await c.req.json<{ to: string; subject: string; body: string; attachments?: any[] }>();

    if (!body.to || !body.subject || !body.body) {
        return c.json({ error: 'Penerima (To), Subjek, dan Isi pesan wajib diisi' }, 400);
    }

    const id = `sent-${Date.now()}`;
    const sentAt = new Date().toISOString();
    const attachmentsJson = JSON.stringify(body.attachments || []);

    // Send via Resend API if available
    const resendKey = (env as any)?.RESEND_API_KEY || (globalThis as any).process?.env?.RESEND_API_KEY;
    if (resendKey) {
        await sendViaResend(resendKey, body.to.trim(), body.subject.trim(), body.body.trim(), body.attachments);
    }

    await db
        .prepare(
            `INSERT INTO sent_emails (id, from_email, to_email, subject, body, attachments, sent_at)
             VALUES (?, 'mail@kampungsilatjampang.id', ?, ?, ?, ?, ?)`
        )
        .bind(id, body.to.trim(), body.subject.trim(), body.body.trim(), attachmentsJson, sentAt)
        .run();

    return c.json({
        ok: true,
        email: {
            id,
            from_email: 'mail@kampungsilatjampang.id',
            to_email: body.to.trim(),
            subject: body.subject.trim(),
            body: body.body.trim(),
            attachments: body.attachments || [],
            sent_at: sentAt,
        },
    });
});

// Endpoint untuk Resend Webhook & Cloudflare Inbound
app.post('/mail/inbound', async (c) => {
    const db = c.get('db');
    const resendKey = (env as any)?.RESEND_API_KEY || (globalThis as any).process?.env?.RESEND_API_KEY;
    const rawBody = await c.req.json<any>();

    let fromEmail = '';
    let fromName = '';
    let toEmail = 'mail@kampungsilatjampang.id';
    let subject = '';
    let bodyText = '';
    let bodyHtml = null as string | null;
    let messageId = null as string | null;
    let attachments: any[] = [];

    // Jika ini adalah Webhook resmi dari Resend (email.received)
    if (rawBody.type === 'email.received' && rawBody.data?.email_id && resendKey) {
        const emailId = rawBody.data.email_id;
        fromEmail = rawBody.data.from || '';
        toEmail = Array.isArray(rawBody.data.to) ? rawBody.data.to[0] : (rawBody.data.to || 'mail@kampungsilatjampang.id');
        subject = rawBody.data.subject || '(Tanpa Subjek)';
        messageId = rawBody.data.message_id || null;

        // Fetch detail isi pesan lengkap (HTML / Text) dari Resend Receiving API
        try {
            const detailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
                headers: { 'Authorization': `Bearer ${resendKey}` },
            });
            if (detailRes.ok) {
                const detail = await detailRes.json<any>();
                bodyText = detail.text || '';
                bodyHtml = detail.html || null;
                if (detail.from) fromEmail = detail.from;
                if (detail.subject) subject = detail.subject;
                if (Array.isArray(detail.attachments)) {
                    attachments = detail.attachments.map((a: any) => ({
                        name: a.filename,
                        size: a.size,
                        type: a.content_type,
                        url: a.download_url || '#',
                    }));
                }
            }
        } catch (fetchErr) {
            console.error('Error fetching receiving email content from Resend:', fetchErr);
        }
    } else {
        // Fallback untuk direct JSON post
        fromEmail = rawBody.fromEmail || rawBody.from || '';
        fromName = rawBody.fromName || fromEmail;
        toEmail = rawBody.toEmail || rawBody.to || 'mail@kampungsilatjampang.id';
        subject = rawBody.subject || '(Tanpa Subjek)';
        bodyText = rawBody.bodyText || rawBody.text || '';
        bodyHtml = rawBody.bodyHtml || rawBody.html || null;
        messageId = rawBody.messageId || null;
        attachments = rawBody.attachments || [];
    }

    if (!fromEmail) {
        return c.json({ error: 'Data email tidak valid' }, 400);
    }

    // Filter ketat: Pastikan email memang ditujukan untuk domain @kampungsilatjampang.id
    // Karena Resend Webhook bersifat account-wide (mencakup semua domain dalam 1 akun Resend)
    const rawTo = rawBody.data?.to || rawBody.to || toEmail;
    const toRecipients: string[] = Array.isArray(rawTo) ? rawTo : [String(rawTo || '')];
    const isTargetKSJ = toRecipients.some((r) => String(r).toLowerCase().includes('kampungsilatjampang.id'));

    if (!isTargetKSJ) {
        // Return 200 OK agar webhook Resend tidak me-retry, namun jangan simpan ke DB KSJ
        return c.json({
            ok: true,
            ignored: true,
            reason: 'Email diabaikan karena bukan ditujukan untuk @kampungsilatjampang.id',
            to: toRecipients,
        });
    }

    const id = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const snippet = bodyText ? bodyText.substring(0, 150) : (subject || '');
    const attachmentsJson = JSON.stringify(attachments);

    // 1. Simpan ke database D1
    await db
        .prepare(
            `INSERT INTO inbox_emails (id, message_id, from_name, from_email, to_email, subject, snippet, body_text, body_html, attachments, is_read, received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`
        )
        .bind(
            id,
            messageId,
            fromName || fromEmail,
            fromEmail,
            toEmail,
            subject,
            snippet,
            bodyText,
            bodyHtml,
            attachmentsJson
        )
        .run();

    // 2. Teruskan salinan otomatis (Forward) ke admin01ksj@gmail.com
    if (resendKey && fromEmail !== 'admin01ksj@gmail.com') {
        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'KSJ Forwarder <mail@kampungsilatjampang.id>',
                    to: ['admin01ksj@gmail.com'],
                    subject: `[KSJ Forward] ${subject} (dari ${fromEmail})`,
                    text: `Pesan baru masuk ke ${toEmail}\nDari: ${fromEmail}\nSubjek: ${subject}\n\nIsi Pesan:\n${bodyText}\n\n---\nAnda dapat membalas pesan ini langsung melalui dashboard admin https://kampungsilatjampang.id/admin`,
                }),
            });
        } catch (fwdErr) {
            console.error('Error auto-forwarding to admin01ksj@gmail.com:', fwdErr);
        }
    }

    return c.json({ ok: true, id });
});

// =========================================================================
// PINJAM AULA PUBLIC & ADMIN ENDPOINTS
// =========================================================================

// 1. Get bookings for public calendar & list
app.get('/pinjamaula/bookings', async (c) => {
    const db = c.get('db');
    const rows = await db
        .prepare(`
            SELECT b.*, 
                   f.rating_keseluruhan, f.rating_kebersihan, f.rating_fasilitas, f.komentar as feedback_komentar,
                   ROUND((f.rating_keseluruhan + f.rating_kebersihan + f.rating_fasilitas) / 3.0, 1) as feedback_avg
            FROM aula_bookings b
            LEFT JOIN aula_feedback f ON f.booking_id = b.id
            ORDER BY b.start_time DESC
        `)
        .all();

    return c.json({ ok: true, data: rows.results || [] });
});

// 2. Stats (Kegiatan, Instansi, Peserta)
app.get('/pinjamaula/stats', async (c) => {
    const db = c.get('db');
    const [kegiatanRow, instansiRow, pesertaRow] = await Promise.all([
        db.prepare("SELECT COUNT(*) as total FROM aula_bookings WHERE status = 'Approved'").first<{ total: number }>(),
        db.prepare("SELECT COUNT(DISTINCT instansi) as total FROM aula_bookings WHERE status = 'Approved'").first<{ total: number }>(),
        db.prepare("SELECT SUM(peserta) as total FROM aula_bookings WHERE status = 'Approved'").first<{ total: number }>(),
    ]);

    return c.json({
        ok: true,
        data: {
            kegiatan: kegiatanRow?.total || 0,
            instansi: instansiRow?.total || 0,
            peserta: pesertaRow?.total || 0,
        },
    });
});

// 3. Submit Booking (Public)
app.post('/pinjamaula/bookings', async (c) => {
    const db = c.get('db');
    const body = await c.req.json<{
        nama?: string;
        hp?: string;
        instansi?: string;
        kegiatan?: string;
        peserta?: number | string;
        start?: string;
        end?: string;
    }>();

    const nama = (body.nama || '').trim();
    const hp = (body.hp || '').trim();
    const instansi = (body.instansi || '').trim();
    const kegiatan = (body.kegiatan || '').trim();
    const peserta = parseInt(String(body.peserta || '0'), 10) || 0;
    const start = (body.start || '').trim();
    const end = (body.end || '').trim();

    if (!nama || nama.length < 3) return c.json({ ok: false, error: 'Nama PIC minimal 3 karakter.' }, 400);
    if (!hp || hp.length < 9) return c.json({ ok: false, error: 'Nomor HP tidak valid. Minimal 9 digit.' }, 400);
    if (!instansi || instansi.length < 3) return c.json({ ok: false, error: 'Nama instansi minimal 3 karakter.' }, 400);
    if (!kegiatan || kegiatan.length < 5) return c.json({ ok: false, error: 'Nama kegiatan minimal 5 karakter.' }, 400);
    if (peserta < 1 || peserta > 500) return c.json({ ok: false, error: 'Jumlah peserta antara 1 - 500 orang.' }, 400);
    if (!start || !end) return c.json({ ok: false, error: 'Waktu mulai dan selesai wajib diisi.' }, 400);

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) {
        return c.json({ ok: false, error: 'Jam selesai harus lebih akhir dari jam mulai.' }, 400);
    }
    const diffMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
    if (diffMinutes < 30) {
        return c.json({ ok: false, error: 'Durasi peminjaman minimal 30 menit.' }, 400);
    }

    // Check conflict against Approved bookings
    const conflict = await db
        .prepare(`
            SELECT id, kegiatan, instansi, start_time, end_time
            FROM aula_bookings
            WHERE status = 'Approved'
              AND datetime(start_time) < datetime(?)
              AND datetime(end_time) > datetime(?)
            LIMIT 1
        `)
        .bind(end, start)
        .first<{ id: string; kegiatan: string; instansi: string; start_time: string; end_time: string }>();

    if (conflict) {
        return c.json({
            ok: false,
            error: `Jadwal bentrok dengan kegiatan "${conflict.kegiatan}" (${conflict.instansi}) yang sudah disetujui.`,
        }, 409);
    }

    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    await db
        .prepare(`
            INSERT INTO aula_bookings (id, nama, instansi, hp, kegiatan, peserta, start_time, end_time, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        `)
        .bind(id, nama, instansi, hp, kegiatan, peserta, start, end, createdAt)
        .run();

    return c.json({ ok: true, message: 'Pengajuan peminjaman berhasil diajukan! Menunggu persetujuan Admin.', id });
});

// 4. Submit Feedback (Public)
app.post('/pinjamaula/feedback', async (c) => {
    const db = c.get('db');
    const body = await c.req.json<{
        bookingId?: string;
        nama?: string;
        instansi?: string;
        kegiatan?: string;
        ratingKeseluruhan?: number;
        ratingKebersihan?: number;
        ratingFasilitas?: number;
        komentar?: string;
    }>();

    const bookingId = (body.bookingId || '').trim();
    if (!bookingId) {
        return c.json({ ok: false, error: 'ID booking tidak valid.' }, 400);
    }

    const booking = await db
        .prepare('SELECT id, nama, instansi, kegiatan, status, end_time FROM aula_bookings WHERE id = ?')
        .bind(bookingId)
        .first<{ id: string; nama: string; instansi: string; kegiatan: string; status: string; end_time: string }>();

    if (!booking) {
        return c.json({ ok: false, error: 'Data booking tidak ditemukan.' }, 404);
    }

    const existing = await db
        .prepare('SELECT id FROM aula_feedback WHERE booking_id = ?')
        .bind(bookingId)
        .first();
    if (existing) {
        return c.json({ ok: false, error: 'Feedback untuk kegiatan ini sudah pernah dikirim.' }, 400);
    }

    const id = Date.now().toString();
    const rKeseluruhan = Math.min(5, Math.max(1, Number(body.ratingKeseluruhan || 5)));
    const rKebersihan = Math.min(5, Math.max(1, Number(body.ratingKebersihan || 5)));
    const rFasilitas = Math.min(5, Math.max(1, Number(body.ratingFasilitas || 5)));
    const komentar = (body.komentar || '').trim();
    const createdAt = new Date().toISOString();

    await db
        .prepare(`
            INSERT INTO aula_feedback (id, booking_id, nama, instansi, kegiatan, rating_keseluruhan, rating_kebersihan, rating_fasilitas, komentar, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
            id,
            booking.id,
            body.nama?.trim() || booking.nama,
            body.instansi?.trim() || booking.instansi,
            body.kegiatan?.trim() || booking.kegiatan,
            rKeseluruhan,
            rKebersihan,
            rFasilitas,
            komentar,
            createdAt
        )
        .run();

    return c.json({ ok: true, message: 'Terima kasih! Feedback Anda berhasil disimpan.' });
});

// 5. Admin - List Bookings
app.get('/admin/pinjamaula/bookings', async (c) => {
    const user = c.get('user');
    if (!user || (user.role !== 'pinjam' && user.role !== 'cms')) {
        return c.json({ error: 'Unauthorized' }, 403);
    }
    const db = c.get('db');
    const status = c.req.query('status');

    let query = `
        SELECT b.*, 
               f.id as feedback_id, f.rating_keseluruhan, f.rating_kebersihan, f.rating_fasilitas, f.komentar as feedback_komentar,
               ROUND((f.rating_keseluruhan + f.rating_kebersihan + f.rating_fasilitas) / 3.0, 1) as feedback_avg
        FROM aula_bookings b
        LEFT JOIN aula_feedback f ON f.booking_id = b.id
    `;
    const params: string[] = [];

    if (status && status !== 'all') {
        query += ' WHERE b.status = ? ';
        params.push(status);
    }

    query += ' ORDER BY b.start_time DESC ';

    const stmt = params.length ? db.prepare(query).bind(...params) : db.prepare(query);
    const rows = await stmt.all();

    return c.json({ ok: true, data: rows.results || [] });
});

// 6. Admin - Update Booking Status
app.patch('/admin/pinjamaula/bookings/:id', async (c) => {
    const user = c.get('user');
    if (!user || (user.role !== 'pinjam' && user.role !== 'cms')) {
        return c.json({ error: 'Unauthorized' }, 403);
    }
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json<{ status?: 'Approved' | 'Rejected' | 'Pending' }>();
    const status = body.status;

    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
        return c.json({ ok: false, error: 'Status tidak valid.' }, 400);
    }

    if (status === 'Approved') {
        const target = await db
            .prepare('SELECT start_time, end_time, kegiatan, instansi FROM aula_bookings WHERE id = ?')
            .bind(id)
            .first<{ start_time: string; end_time: string; kegiatan: string; instansi: string }>();

        if (target) {
            const conflict = await db
                .prepare(`
                    SELECT id, kegiatan, instansi
                    FROM aula_bookings
                    WHERE status = 'Approved'
                      AND id != ?
                      AND datetime(start_time) < datetime(?)
                      AND datetime(end_time) > datetime(?)
                    LIMIT 1
                `)
                .bind(id, target.end_time, target.start_time)
                .first<{ id: string; kegiatan: string; instansi: string }>();

            if (conflict) {
                return c.json({
                    ok: false,
                    error: `Gagal approve: Bentrok dengan "${conflict.kegiatan}" (${conflict.instansi}) yang telah disetujui.`,
                }, 409);
            }
        }
    }

    await db
        .prepare('UPDATE aula_bookings SET status = ? WHERE id = ?')
        .bind(status, id)
        .run();

    return c.json({ ok: true, message: `Status berhasil diubah menjadi ${status}.` });
});

// 7. Admin - Delete Booking
app.delete('/admin/pinjamaula/bookings/:id', async (c) => {
    const user = c.get('user');
    if (!user || (user.role !== 'pinjam' && user.role !== 'cms')) {
        return c.json({ error: 'Unauthorized' }, 403);
    }
    const db = c.get('db');
    const id = c.req.param('id');
    await db.prepare('DELETE FROM aula_bookings WHERE id = ?').bind(id).run();
    return c.json({ ok: true, message: 'Booking berhasil dihapus.' });
});

// 8. Admin - Get Feedback List
app.get('/admin/pinjamaula/feedback', async (c) => {
    const user = c.get('user');
    if (!user || (user.role !== 'pinjam' && user.role !== 'cms')) {
        return c.json({ error: 'Unauthorized' }, 403);
    }
    const db = c.get('db');
    const rows = await db
        .prepare(`
            SELECT f.*, b.start_time, b.end_time
            FROM aula_feedback f
            LEFT JOIN aula_bookings b ON b.id = f.booking_id
            ORDER BY f.created_at DESC
        `)
        .all();

    return c.json({ ok: true, data: rows.results || [] });
});

// Inject variables via middleware before routes run
const mainApp = new Hono<{ Variables: Variables }>();
mainApp.use('*', async (c, next) => {
    const env = c.env as { db: D1Database; bucket: R2Bucket | null; user: Variables['user'] };
    c.set('db', env.db);
    c.set('bucket', env.bucket);
    c.set('user', env.user);
    await next();
});
mainApp.route('/', app);

export const ALL: APIRoute = async ({ request, locals }) => handleRequest(request, locals);
export const GET: APIRoute = async ({ request, locals }) => handleRequest(request, locals);
export const POST: APIRoute = async ({ request, locals }) => handleRequest(request, locals);
export const PUT: APIRoute = async ({ request, locals }) => handleRequest(request, locals);
export const DELETE: APIRoute = async ({ request, locals }) => handleRequest(request, locals);

async function handleRequest(request: Request, locals: App.Locals) {
    const db = getDb(locals);
    const bucket = getMediaBucket(locals);

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database binding DB tidak ditemukan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const user = await verifyAdminSession(db, request.headers.get('cookie'));
    return mainApp.fetch(request, { db, bucket, user });
}
