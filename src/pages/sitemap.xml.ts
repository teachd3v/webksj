import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db';

export const GET: APIRoute = async ({ locals }) => {
    const baseUrl = 'https://kampungsilatjampang.id';
    const now = new Date().toISOString().split('T')[0];

    const db = getDb(locals);

    let perguruanList: Array<{ slug: string; updated_at?: string }> = [];
    let newsList: Array<{ slug: string; date?: string; updated_at?: string }> = [];

    if (db) {
        try {
            const [pRes, nRes] = await Promise.all([
                db.prepare('SELECT slug, updated_at FROM perguruan').all<{ slug: string; updated_at?: string }>(),
                db.prepare('SELECT slug, date, updated_at FROM news').all<{ slug: string; date?: string; updated_at?: string }>(),
            ]);
            perguruanList = pRes.results || [];
            newsList = nRes.results || [];
        } catch (err) {
            console.error('Error fetching sitemap data from D1:', err);
        }
    }

    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'weekly', lastmod: now },
        { url: '/perguruan', priority: '0.9', changefreq: 'daily', lastmod: now },
        { url: '/berita', priority: '0.8', changefreq: 'daily', lastmod: now },
        { url: '/produk', priority: '0.7', changefreq: 'weekly', lastmod: now },
        { url: '/organisasi', priority: '0.6', changefreq: 'monthly', lastmod: now },
        { url: '/kolaborasi', priority: '0.6', changefreq: 'monthly', lastmod: now },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${staticPages
        .map(
            (p) => `
    <url>
        <loc>${baseUrl}${p.url}</loc>
        <lastmod>${p.lastmod}</lastmod>
        <changefreq>${p.changefreq}</changefreq>
        <priority>${p.priority}</priority>
    </url>`
        )
        .join('')}
    ${perguruanList
        .map((p) => {
            const lastmod = p.updated_at ? p.updated_at.split(' ')[0] : now;
            return `
    <url>
        <loc>${baseUrl}/perguruan/${p.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
        })
        .join('')}
    ${newsList
        .map((n) => {
            const lastmod = n.updated_at ? n.updated_at.split(' ')[0] : (n.date || now);
            return `
    <url>
        <loc>${baseUrl}/berita/${n.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
        })
        .join('')}
</urlset>`.trim();

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
};
