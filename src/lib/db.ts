import { env } from 'cloudflare:workers';

export interface PerguruanRow {
    id: string;
    name: string;
    slug: string;
    style: string;
    members: number;
    location: string;
    logo?: string | null;
    master_name?: string | null;
    contact?: string | null;
    description?: string | null;
    history?: string | null;
}

export interface NewsRow {
    id: string;
    title: string;
    slug: string;
    date: string;
    excerpt: string;
    content: string;
    image?: string | null;
}

export interface ProductRow {
    id: string;
    name: string;
    price: string;
    image?: string | null;
    whatsapp_link?: string | null;
    is_best_seller: number;
}

export interface GalleryRow {
    id: string;
    caption: string;
    image: string;
}

export interface OrganisasiRow {
    id: string;
    title: string;
    pengurus_inti: string;
    bidang_list: string;
}

export function getDb(_locals?: unknown): D1Database | null {
    return env?.DB || null;
}

export function getMediaBucket(_locals?: unknown): R2Bucket | null {
    return env?.MEDIA_BUCKET || null;
}

export function getYoutubeApiKey(): string | undefined {
    return env?.YOUTUBE_API_KEY || import.meta.env.YOUTUBE_API_KEY;
}

export async function getAllPerguruan(db: D1Database | null) {
    if (!db) return [];
    const { results } = await db
        .prepare('SELECT * FROM perguruan ORDER BY name ASC')
        .all<PerguruanRow>();
    return (results || []).map((r) => ({
        _id: r.id,
        name: r.name,
        slug: r.slug,
        style: r.style,
        members: r.members,
        location: r.location,
        logo: r.logo || undefined,
        masterName: r.master_name || undefined,
        contact: r.contact || undefined,
        description: r.description || undefined,
        history: r.history || undefined,
    }));
}

export async function getPerguruanBySlug(db: D1Database | null, slug: string) {
    if (!db) return null;
    const r = await db
        .prepare('SELECT * FROM perguruan WHERE slug = ? LIMIT 1')
        .bind(slug)
        .first<PerguruanRow>();
    if (!r) return null;
    return {
        _id: r.id,
        name: r.name,
        slug: r.slug,
        style: r.style,
        members: r.members,
        location: r.location,
        logo: r.logo || undefined,
        masterName: r.master_name || undefined,
        contact: r.contact || undefined,
        description: r.description || undefined,
        history: r.history || undefined,
    };
}

export async function getAllNews(db: D1Database | null, limit?: number) {
    if (!db) return [];
    const sql = limit
        ? 'SELECT * FROM news ORDER BY date DESC LIMIT ?'
        : 'SELECT * FROM news ORDER BY date DESC';
    const stmt = limit ? db.prepare(sql).bind(limit) : db.prepare(sql);
    const { results } = await stmt.all<NewsRow>();
    return (results || []).map((r) => ({
        _id: r.id,
        title: r.title,
        slug: r.slug,
        date: r.date,
        excerpt: r.excerpt,
        content: r.content,
        image: r.image || undefined,
    }));
}

export async function getNewsBySlug(db: D1Database | null, slug: string) {
    if (!db) return null;
    const r = await db
        .prepare('SELECT * FROM news WHERE slug = ? LIMIT 1')
        .bind(slug)
        .first<NewsRow>();
    if (!r) return null;
    return {
        _id: r.id,
        title: r.title,
        slug: r.slug,
        date: r.date,
        excerpt: r.excerpt,
        content: r.content,
        image: r.image || undefined,
    };
}

export async function getAllProducts(db: D1Database | null, bestSellerOnly = false) {
    if (!db) return [];
    const sql = bestSellerOnly
        ? 'SELECT * FROM products WHERE is_best_seller = 1 ORDER BY created_at DESC'
        : 'SELECT * FROM products ORDER BY is_best_seller DESC, created_at DESC';
    const { results } = await db.prepare(sql).all<ProductRow>();
    return (results || []).map((r) => ({
        _id: r.id,
        name: r.name,
        price: r.price,
        image: r.image || undefined,
        whatsappLink: r.whatsapp_link || undefined,
        isBestSeller: Boolean(r.is_best_seller),
    }));
}

export async function getAllGallery(db: D1Database | null) {
    if (!db) return [];
    const { results } = await db
        .prepare('SELECT * FROM gallery ORDER BY created_at DESC')
        .all<GalleryRow>();
    return (results || []).map((r) => ({
        _id: r.id,
        caption: r.caption,
        image: r.image,
    }));
}

export async function getOrganisasi(db: D1Database | null) {
    const fallback = {
        title: 'PENGURUS KAMPUNG SILAT JAMPANG',
        pengurusInti: [
            { name: 'HERMAN BUDIANTO', role: 'Ketua Umum' },
            { name: 'SAHRAWARDI', role: 'Sekretaris' },
            { name: 'JABALLUDIN', role: 'Bendahara' },
            { name: 'SHEGI JUNIAR DANI', role: 'Koordinator KSJ' },
        ],
        bidangList: [
            {
                title: 'SILAT PRESTASI',
                leader: 'IMANG',
                members: ['SUPRIYATNA', 'M KHAIRUL', 'M NUR', 'ADUL'],
            },
            {
                title: 'SILAT TRADISIONAL',
                leader: 'ANGGA',
                members: ['OBOY', 'NURHASAN', 'RAHMAT', 'ROKIB', 'ADOEL'],
            },
            {
                title: 'LITBANK / SIDEC',
                leader: 'SABTADJI',
                members: ['Tono Hartono', 'AGUS', 'ILHAM', 'ELFRIDO'],
            },
            {
                title: 'EKONOMI SILAT',
                leader: 'DODIK',
                members: ['JAYADI', 'BAGIO', 'HERDI', 'HENDRO'],
            },
        ],
    };

    if (!db) return fallback;
    const r = await db
        .prepare("SELECT * FROM organisasi WHERE id = 'organisasi' LIMIT 1")
        .first<OrganisasiRow>();
    if (!r) return fallback;
    try {
        return {
            title: r.title || fallback.title,
            pengurusInti: JSON.parse(r.pengurus_inti || '[]'),
            bidangList: JSON.parse(r.bidang_list || '[]'),
        };
    } catch {
        return fallback;
    }
}
