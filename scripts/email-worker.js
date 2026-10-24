/**
 * Cloudflare Email Worker untuk Kampung Silat Jampang
 * 
 * Fungsi:
 * 1. Menerima email masuk dari Cloudflare Email Routing (mail@kampungsilatjampang.id).
 * 2. Forward salinan otomatis ke Gmail pribadi (biar ada notifikasi instan di HP).
 * 3. Kirim data email (pengirim, subjek, isi) ke API Web KSJ agar tersimpan di D1 & tampil di Webmail admin.
 */

import PostalMime from 'postal-mime';

export default {
    async email(message, env, ctx) {
        // 1. Forward salinan email ke Gmail tujuan (admin01ksj@gmail.com)
        const forwardTo = env.FORWARD_GMAIL || 'admin01ksj@gmail.com';
        try {
            await message.forward(forwardTo);
            console.log(`Email forwarded to ${forwardTo}`);
        } catch (err) {
            console.error('Forward to Gmail error:', err);
        }

        // 2. Parse MIME email mentah
        let bodyText = '';
        let bodyHtml = null;
        let fromName = message.from;

        try {
            const parser = new PostalMime();
            const rawStream = await new Response(message.raw).arrayBuffer();
            const parsed = await parser.parse(rawStream);

            fromName = parsed.from?.name || message.from;
            bodyText = parsed.text || '';
            bodyHtml = parsed.html || null;
        } catch (err) {
            console.error('MIME parsing fallback:', err);
            // Fallback baca text sederhana jika gagal parse
            const text = await new Response(message.raw).text();
            bodyText = text.slice(0, 1000);
        }

        const subject = message.headers.get('subject') || '(Tanpa Subjek)';

        // 3. Simpan ke database D1 website via Inbound API
        const apiUrl = env.KSJ_API_URL || 'https://kampungsilatjampang.id/api/mail/inbound';
        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: message.headers.get('message-id') || null,
                    fromName,
                    fromEmail: message.from,
                    toEmail: message.to,
                    subject,
                    bodyText,
                    bodyHtml,
                }),
            });
            console.log('Inbound API saved status:', res.status);
        } catch (err) {
            console.error('Error saving email to KSJ API:', err);
        }
    },
};
