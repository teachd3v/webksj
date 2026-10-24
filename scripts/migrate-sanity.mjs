import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = 's9dsj8ot';
const DATASET = 'production';
const API_VERSION = 'v2024-01-31';

const OUT_DIR = path.resolve('migration-backup');
const MEDIA_DIR = path.resolve('public/uploads');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

// Simple PortableText to HTML converter
function portableTextToHtml(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) return '';
    return blocks
        .map((block) => {
            if (block._type !== 'block' || !Array.isArray(block.children)) return '';
            const text = block.children
                .map((span) => {
                    let t = (span.text || '')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    if (Array.isArray(span.marks)) {
                        if (span.marks.includes('strong')) t = `<strong>${t}</strong>`;
                        if (span.marks.includes('em')) t = `<em>${t}</em>`;
                        if (span.marks.includes('underline')) t = `<u>${t}</u>`;
                    }
                    return t;
                })
                .join('');
            if (!text.trim()) return '';
            const style = block.style || 'normal';
            if (style === 'h1') return `<h1>${text}</h1>`;
            if (style === 'h2') return `<h2>${text}</h2>`;
            if (style === 'h3') return `<h3>${text}</h3>`;
            if (style === 'blockquote') return `<blockquote>${text}</blockquote>`;
            return `<p>${text}</p>`;
        })
        .filter(Boolean)
        .join('\n');
}

async function downloadImage(url, prefix) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        const baseName = path.basename(parsed.pathname);
        const fileName = `${prefix}-${baseName}`;
        const destPath = path.join(MEDIA_DIR, fileName);

        if (!fs.existsSync(destPath)) {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(destPath, buf);
            console.log(`  [IMG] Downloaded ${fileName} (${buf.length} bytes)`);
        }
        return `/uploads/${fileName}`;
    } catch (err) {
        console.error(`  [ERR] Failed to download ${url}:`, err.message);
        return url;
    }
}

function sqlEscape(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    return `'${String(val).replace(/'/g, "''")}'`;
}

function slugify(str) {
    return String(str || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function run() {
    console.log('Fetching all documents from Sanity...');
    const query = `{
        "perguruan": *[_type == "perguruan"]{
            _id, name, "slug": slug.current, style, members, location,
            masterName, contact, description, history, "logoUrl": logo.asset->url
        },
        "news": *[_type == "news"] | order(date desc){
            _id, title, "slug": slug.current, date, excerpt, content, "imageUrl": image.asset->url
        },
        "products": *[_type == "product"]{
            _id, name, price, whatsappLink, isBestSeller, "imageUrl": image.asset->url
        },
        "gallery": *[_type == "gallery"]{
            _id, caption, "imageUrl": image.asset->url
        },
        "organisasi": *[_type == "organisasi"][0]{
            _id, title, pengurusInti[]{role, name}, bidangList[]{title, leader, members}
        }
    }`;

    const apiUrl = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
        throw new Error(`Sanity API failed: ${res.status} ${res.statusText}`);
    }
    const { result } = await res.json();

    fs.writeFileSync(path.join(OUT_DIR, 'sanity-raw.json'), JSON.stringify(result, null, 2));
    console.log('Saved raw backup to migration-backup/sanity-raw.json');

    const sqlStatements = [];

    // 1. Perguruan
    console.log(`Processing ${result.perguruan.length} perguruan...`);
    for (const p of result.perguruan) {
        const localLogo = await downloadImage(p.logoUrl, 'perguruan');
        const slug = p.slug || slugify(p.name) || p._id.toLowerCase();
        const descHtml = portableTextToHtml(p.description);
        const histHtml = portableTextToHtml(p.history);

        sqlStatements.push(
            `INSERT OR REPLACE INTO perguruan (id, name, slug, style, members, location, logo, master_name, contact, description, history) VALUES (${sqlEscape(p._id)}, ${sqlEscape(p.name || 'Tanpa Nama')}, ${sqlEscape(slug)}, ${sqlEscape(p.style || '-')}, ${sqlEscape(Number(p.members) || 0)}, ${sqlEscape(p.location || '-')}, ${sqlEscape(localLogo)}, ${sqlEscape(p.masterName || null)}, ${sqlEscape(p.contact || null)}, ${sqlEscape(descHtml || null)}, ${sqlEscape(histHtml || null)});`
        );
    }

    // 2. News
    console.log(`Processing ${result.news.length} news...`);
    for (const n of result.news) {
        const localImg = await downloadImage(n.imageUrl, 'news');
        const slug = n.slug || slugify(n.title) || n._id.toLowerCase();
        const contentHtml = portableTextToHtml(n.content);

        sqlStatements.push(
            `INSERT OR REPLACE INTO news (id, title, slug, date, excerpt, content, image) VALUES (${sqlEscape(n._id)}, ${sqlEscape(n.title || 'Tanpa Judul')}, ${sqlEscape(slug)}, ${sqlEscape(n.date || '2026-01-01')}, ${sqlEscape(n.excerpt || '')}, ${sqlEscape(contentHtml || '')}, ${sqlEscape(localImg)});`
        );
    }

    // 3. Products
    console.log(`Processing ${result.products.length} products...`);
    for (const prod of result.products) {
        const localImg = await downloadImage(prod.imageUrl, 'product');
        sqlStatements.push(
            `INSERT OR REPLACE INTO products (id, name, price, image, whatsapp_link, is_best_seller) VALUES (${sqlEscape(prod._id)}, ${sqlEscape(prod.name || 'Produk UMKM')}, ${sqlEscape(prod.price || 'Rp 0')}, ${sqlEscape(localImg)}, ${sqlEscape(prod.whatsappLink || '')}, ${sqlEscape(Boolean(prod.isBestSeller))});`
        );
    }

    // 4. Gallery
    console.log(`Processing ${result.gallery.length} gallery items...`);
    for (const g of result.gallery) {
        const localImg = await downloadImage(g.imageUrl, 'gallery');
        sqlStatements.push(
            `INSERT OR REPLACE INTO gallery (id, caption, image) VALUES (${sqlEscape(g._id)}, ${sqlEscape(g.caption || '')}, ${sqlEscape(localImg || '')});`
        );
    }

    // 5. Organisasi
    console.log('Processing organisasi singleton...');
    const org = result.organisasi || {
        title: 'PENGURUS KAMPUNG SILAT JAMPANG',
        pengurusInti: [
            { name: 'HERMAN BUDIANTO', role: 'Ketua Umum' },
            { name: 'SAHRAWARDI', role: 'Sekretaris' },
            { name: 'JABALLUDIN', role: 'Bendahara' },
            { name: 'SHEGI JUNIAR DANI', role: 'Koordinator KSJ' },
        ],
        bidangList: [],
    };
    sqlStatements.push(
        `INSERT OR REPLACE INTO organisasi (id, title, pengurus_inti, bidang_list) VALUES ('organisasi', ${sqlEscape(org.title || 'PENGURUS KAMPUNG SILAT JAMPANG')}, ${sqlEscape(JSON.stringify(org.pengurusInti || []))}, ${sqlEscape(JSON.stringify(org.bidangList || []))});`
    );

    // 6. Default Admin User (admin@kampungsilatjampang.com / ksj2026)
    // SHA-256 hash of "ksj2026"
    const crypto = await import('node:crypto');
    const passwordHash = crypto.createHash('sha256').update('ksj2026').digest('hex');
    sqlStatements.push(
        `INSERT OR REPLACE INTO admin_users (id, email, name, password_hash) VALUES ('admin-1', 'admin@ksj.id', 'Admin KSJ', '${passwordHash}');`
    );

    const seedSqlPath = path.join(OUT_DIR, 'seed.sql');
    fs.writeFileSync(seedSqlPath, sqlStatements.join('\n') + '\n');
    console.log(`Generated D1 seed SQL at ${seedSqlPath} (${sqlStatements.length} statements)`);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
