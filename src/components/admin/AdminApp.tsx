import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Shield,
    Newspaper,
    ShoppingBag,
    Image as ImageIcon,
    Users,
    LogOut,
    Plus,
    Pencil,
    Trash2,
    Upload,
    ExternalLink,
    Check,
    X,
    Search,
    Star,
    KeyRound,
    Mail,
    Calendar,
} from 'lucide-react';
import MailApp from './MailApp';
import PinjamAulaApp from './PinjamAulaApp';

interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
}

type Tab = 'dashboard' | 'perguruan' | 'news' | 'products' | 'gallery' | 'organisasi' | 'mail' | 'pinjam' | 'account';

export default function AdminApp({ initialUser }: { initialUser: User | null }) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    if (!user) {
        return <LoginView onSuccess={(u) => setUser(u)} />;
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    };

    // Khusus akun mail@ksj.id (role === 'mail'), langsung buka UI Webmail khusus tanpa menu CMS
    if (user.role === 'mail') {
        return <MailApp user={user} onLogout={handleLogout} />;
    }

    // Khusus akun pinjam@ksj.id (role === 'pinjam'), langsung buka UI Peminjaman Aula khusus tanpa menu CMS
    if (user.role === 'pinjam') {
        return <PinjamAulaApp user={user} onLogout={handleLogout} />;
    }

    const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
        { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
        { id: 'perguruan', label: 'Perguruan Silat', icon: Shield },
        { id: 'news', label: 'Berita & Kegiatan', icon: Newspaper },
        { id: 'products', label: 'Katalog UMKM', icon: ShoppingBag },
        { id: 'gallery', label: 'Galeri Aksi', icon: ImageIcon },
        { id: 'organisasi', label: 'Struktur Organisasi', icon: Users },
        { id: 'mail', label: 'Kotak Surat (Email)', icon: Mail },
        { id: 'pinjam', label: 'Peminjaman Aula', icon: Calendar },
        { id: 'account', label: 'Pengaturan Akun', icon: KeyRound },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-medium shadow-2xl border flex items-center gap-2 ${
                        toast.type === 'ok'
                            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/90 border-red-500/40 text-red-300'
                    }`}
                >
                    {toast.type === 'ok' ? <Check size={18} /> : <X size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-neutral-900 border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/images/logo.png" alt="KSJ" className="w-10 h-10 object-contain" />
                        <div>
                            <h1 className="font-display font-bold text-lg leading-none text-white">KSJ Admin</h1>
                            <span className="text-xs text-amber-500 font-medium">Cloudflare D1 + R2 CMS</span>
                        </div>
                    </div>
                    <a
                        href="/"
                        target="_blank"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Lihat Website"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>

                <nav className="p-4 space-y-1.5 flex-1 overflow-x-auto md:overflow-visible flex md:flex-col">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left ${
                                    active
                                        ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 hidden md:block">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-xs text-gray-500">Login sebagai</p>
                        <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={16} /> Keluar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
                {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
                {activeTab === 'perguruan' && <PerguruanManager showToast={showToast} />}
                {activeTab === 'news' && <NewsManager showToast={showToast} />}
                {activeTab === 'products' && <ProductsManager showToast={showToast} />}
                {activeTab === 'gallery' && <GalleryManager showToast={showToast} />}
                {activeTab === 'organisasi' && <OrganisasiManager showToast={showToast} />}
                {activeTab === 'mail' && (
                    <div className="-m-6 md:-m-10">
                        <MailApp user={user} onLogout={handleLogout} />
                    </div>
                )}
                {activeTab === 'pinjam' && (
                    <div className="-m-6 md:-m-10">
                        <PinjamAulaApp user={user} onLogout={handleLogout} />
                    </div>
                )}
                {activeTab === 'account' && (
                    <AccountManager user={user} onUpdateUser={setUser} showToast={showToast} />
                )}
            </main>
        </div>
    );
}

function LoginView({ onSuccess }: { onSuccess: (u: User) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Gagal login');
            } else {
                onSuccess(data.user);
            }
        } catch {
            setError('Terjadi kesalahan jaringan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <img src="/images/logo.png" alt="KSJ Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
                    <h1 className="text-2xl font-bold font-display text-white">Panel Admin KSJ</h1>
                    <p className="text-sm text-gray-400 mt-1">Masuk untuk mengelola konten Kampung Silat Jampang</p>
                </div>

                {error && (
                    <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Email Admin
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <a href="/" className="text-xs text-gray-400 hover:text-amber-500">
                        ← Kembali ke Beranda Publik
                    </a>
                </div>
            </div>
        </div>
    );
}

// Helper component for uploading images to R2
function ImageUploader({
    value,
    onChange,
    label = 'Upload Gambar (Cloudflare R2)',
}: {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}) {
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.url) {
                onChange(data.url);
            } else {
                alert(data.error || 'Gagal upload gambar');
            }
        } catch {
            alert('Error saat upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{label}</label>
            <div className="flex items-center gap-4">
                {value ? (
                    <img
                        src={value}
                        alt="Preview"
                        className="w-20 h-20 rounded-xl object-cover bg-neutral-800 border border-white/10 shrink-0"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-gray-500 text-xs shrink-0">
                        Kosong
                    </div>
                )}
                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="URL gambar atau klik tombol upload di bawah..."
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold cursor-pointer transition-colors">
                        <Upload size={14} />
                        {uploading ? 'Mengunggah ke R2...' : 'Pilih File Gambar'}
                        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
                    </label>
                </div>
            </div>
        </div>
    );
}

// 1. DASHBOARD VIEW
function DashboardView({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
    const [stats, setStats] = useState({ perguruan: 0, news: 0, products: 0, gallery: 0 });

    useEffect(() => {
        fetch('/api/admin/stats')
            .then((r) => r.json())
            .then(setStats)
            .catch(() => {});
    }, []);

    const cards = [
        { label: 'Total Perguruan', value: stats.perguruan, tab: 'perguruan' as Tab, color: 'from-amber-500/20 to-orange-600/10' },
        { label: 'Berita & Kegiatan', value: stats.news, tab: 'news' as Tab, color: 'from-blue-500/20 to-indigo-600/10' },
        { label: 'Produk UMKM', value: stats.products, tab: 'products' as Tab, color: 'from-emerald-500/20 to-teal-600/10' },
        { label: 'Foto Galeri', value: stats.gallery, tab: 'gallery' as Tab, color: 'from-purple-500/20 to-pink-600/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold font-display text-white">Dashboard Ringkasan</h2>
                <p className="text-gray-400 mt-1">
                    Seluruh konten tersimpan di Cloudflare D1 (SQLite) dan media di Cloudflare R2.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((c) => (
                    <button
                        key={c.label}
                        onClick={() => onNavigate(c.tab)}
                        className={`p-6 rounded-2xl bg-gradient-to-br ${c.color} border border-white/10 text-left hover:border-amber-500/50 transition-all cursor-pointer`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{c.label}</p>
                        <p className="text-4xl font-black font-display text-white mt-2">{c.value}</p>
                        <p className="text-xs text-amber-400 mt-4 font-medium">Kelola data →</p>
                    </button>
                ))}
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
                <h3 className="text-lg font-bold font-display text-white">Status Migrasi Ekosistem Cloudflare</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Semua data dari Sanity Production (59 Perguruan, 6 Berita, 4 Produk UMKM, 7 Foto Galeri, dan Struktur Organisasi) telah dimigrasikan secara otomatis beserta seluruh file gambarnya.
                </p>
            </div>
        </div>
    );
}

// 2. PERGURUAN MANAGER
function PerguruanManager({ showToast }: { showToast: (m: string, t?: 'ok' | 'err') => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<any | null>(null);

    const load = async () => {
        const res = await fetch('/api/admin/perguruan');
        const data = await res.json();
        setItems(data.items || []);
    };

    useEffect(() => {
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isUpdate = Boolean(editing.id);
        const url = isUpdate ? `/api/admin/perguruan/${editing.id}` : '/api/admin/perguruan';
        const res = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing),
        });
        if (res.ok) {
            showToast(isUpdate ? 'Perguruan diperbarui!' : 'Perguruan ditambahkan!');
            setEditing(null);
            load();
        } else {
            showToast('Gagal menyimpan perguruan', 'err');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus perguruan "${name}"?`)) return;
        const res = await fetch(`/api/admin/perguruan/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Perguruan dihapus');
            load();
        }
    };

    const filtered = items.filter(
        (i) =>
            i.name?.toLowerCase().includes(search.toLowerCase()) ||
            i.style?.toLowerCase().includes(search.toLowerCase()) ||
            i.location?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-display text-white">Manajemen Perguruan ({items.length})</h2>
                    <p className="text-sm text-gray-400">Kelola direktori perguruan silat anggota KSJ</p>
                </div>
                <button
                    onClick={() =>
                        setEditing({
                            name: '',
                            slug: '',
                            style: '',
                            members: 0,
                            location: '',
                            logo: '',
                            master_name: '',
                            contact: '',
                            description: '',
                            history: '',
                        })
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm cursor-pointer"
                >
                    <Plus size={18} /> Tambah Perguruan
                </button>
            </div>

            {editing && (
                <form onSubmit={handleSave} className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <h3 className="text-lg font-bold text-white">
                            {editing.id ? `Edit: ${editing.name}` : 'Tambah Perguruan Baru'}
                        </h3>
                        <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Perguruan *</label>
                            <input
                                required
                                value={editing.name}
                                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Slug URL (otomatis jika kosong)</label>
                            <input
                                value={editing.slug || ''}
                                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                                placeholder="contoh: ms-jalan-enam-pengasinan"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Aliran Silat</label>
                            <input
                                value={editing.style || ''}
                                onChange={(e) => setEditing({ ...editing, style: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Jumlah Anggota</label>
                            <input
                                type="number"
                                value={editing.members || 0}
                                onChange={(e) => setEditing({ ...editing, members: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Lokasi</label>
                            <input
                                value={editing.location || ''}
                                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Guru Besar</label>
                            <input
                                value={editing.master_name || ''}
                                onChange={(e) => setEditing({ ...editing, master_name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nomor WhatsApp (628xxx)</label>
                            <input
                                value={editing.contact || ''}
                                onChange={(e) => setEditing({ ...editing, contact: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <ImageUploader
                        label="Logo Perguruan"
                        value={editing.logo || ''}
                        onChange={(url) => setEditing({ ...editing, logo: url })}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Profil Perguruan (HTML / Paragraf)</label>
                            <textarea
                                rows={5}
                                value={editing.description || ''}
                                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Sejarah Perguruan (HTML / Paragraf)</label>
                            <textarea
                                rows={5}
                                value={editing.history || ''}
                                onChange={(e) => setEditing({ ...editing, history: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="px-5 py-2.5 rounded-xl bg-neutral-800 text-gray-300 hover:bg-neutral-700 text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm cursor-pointer"
                        >
                            Simpan Perguruan
                        </button>
                    </div>
                </form>
            )}

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama perguruan, aliran, atau lokasi..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-neutral-900 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-xs uppercase text-gray-400 bg-neutral-950/50">
                            <th className="py-3.5 px-4">Perguruan</th>
                            <th className="py-3.5 px-4 hidden md:table-cell">Aliran</th>
                            <th className="py-3.5 px-4 hidden sm:table-cell">Lokasi</th>
                            <th className="py-3.5 px-4 hidden lg:table-cell">Anggota</th>
                            <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {filtered.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02]">
                                <td className="py-3 px-4 flex items-center gap-3">
                                    {item.logo ? (
                                        <img src={item.logo} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">🥋</div>
                                    )}
                                    <div>
                                        <p className="font-bold text-white">{item.name}</p>
                                        <p className="text-xs text-gray-500">/{item.slug}</p>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-amber-400 hidden md:table-cell">{item.style}</td>
                                <td className="py-3 px-4 text-gray-400 hidden sm:table-cell">{item.location}</td>
                                <td className="py-3 px-4 text-gray-300 hidden lg:table-cell">{item.members}</td>
                                <td className="py-3 px-4 text-right space-x-2">
                                    <button
                                        onClick={() => setEditing(item)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-300 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// 3. NEWS MANAGER
function NewsManager({ showToast }: { showToast: (m: string, t?: 'ok' | 'err') => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [editing, setEditing] = useState<any | null>(null);

    const load = async () => {
        const res = await fetch('/api/admin/news');
        const data = await res.json();
        setItems(data.items || []);
    };

    useEffect(() => {
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isUpdate = Boolean(editing.id);
        const url = isUpdate ? `/api/admin/news/${editing.id}` : '/api/admin/news';
        const res = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing),
        });
        if (res.ok) {
            showToast(isUpdate ? 'Berita diperbarui!' : 'Berita diterbitkan!');
            setEditing(null);
            load();
        } else {
            showToast('Gagal menyimpan berita', 'err');
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Hapus berita "${title}"?`)) return;
        const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Berita dihapus');
            load();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-display text-white">Berita & Kegiatan ({items.length})</h2>
                    <p className="text-sm text-gray-400">Tulis dan publikasikan artikel kegiatan KSJ</p>
                </div>
                <button
                    onClick={() =>
                        setEditing({
                            title: '',
                            slug: '',
                            date: new Date().toISOString().slice(0, 10),
                            excerpt: '',
                            content: '',
                            image: '',
                        })
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm cursor-pointer"
                >
                    <Plus size={18} /> Tulis Berita
                </button>
            </div>

            {editing && (
                <form onSubmit={handleSave} className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <h3 className="text-lg font-bold text-white">
                            {editing.id ? 'Edit Berita' : 'Tulis Berita Baru'}
                        </h3>
                        <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Judul Berita *</label>
                            <input
                                required
                                value={editing.title}
                                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tanggal</label>
                            <input
                                type="date"
                                value={editing.date || ''}
                                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <ImageUploader
                        label="Gambar Utama Berita"
                        value={editing.image || ''}
                        onChange={(url) => setEditing({ ...editing, image: url })}
                    />

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Ringkasan Singkat (Excerpt)</label>
                        <textarea
                            rows={2}
                            value={editing.excerpt || ''}
                            onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Isi Berita (Mendukung HTML seperti &lt;p&gt;, &lt;strong&gt;, &lt;h2&gt;)
                        </label>
                        <textarea
                            rows={10}
                            value={editing.content || ''}
                            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm font-mono"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="px-5 py-2.5 rounded-xl bg-neutral-800 text-gray-300"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer"
                        >
                            Simpan Berita
                        </button>
                    </div>
                </form>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                        <div className="h-44 bg-neutral-800 relative">
                            {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-xs text-amber-400 font-semibold">
                                {item.date}
                            </span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{item.title}</h3>
                            <p className="text-xs text-gray-400 line-clamp-3 mb-4 flex-1">{item.excerpt}</p>
                            <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                <a
                                    href={`/berita/${item.slug}`}
                                    target="_blank"
                                    className="text-xs text-amber-500 hover:underline"
                                >
                                    Lihat Halaman ↗
                                </a>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => setEditing(item)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-300"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.title)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-gray-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 4. PRODUCTS UMKM MANAGER
function ProductsManager({ showToast }: { showToast: (m: string, t?: 'ok' | 'err') => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [editing, setEditing] = useState<any | null>(null);

    const load = async () => {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setItems(data.items || []);
    };

    useEffect(() => {
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isUpdate = Boolean(editing.id);
        const url = isUpdate ? `/api/admin/products/${editing.id}` : '/api/admin/products';
        const res = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing),
        });
        if (res.ok) {
            showToast(isUpdate ? 'Produk diperbarui!' : 'Produk ditambahkan!');
            setEditing(null);
            load();
        } else {
            showToast('Gagal menyimpan produk', 'err');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus produk "${name}"?`)) return;
        const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Produk dihapus');
            load();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-display text-white">Katalog Produk UMKM ({items.length})</h2>
                    <p className="text-sm text-gray-400">Kelola produk UMKM warga KSJ & status Best Seller di beranda</p>
                </div>
                <button
                    onClick={() =>
                        setEditing({
                            name: '',
                            price: 'Rp ',
                            image: '',
                            whatsapp_link: 'https://wa.me/628',
                            is_best_seller: 1,
                        })
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm cursor-pointer"
                >
                    <Plus size={18} /> Tambah Produk
                </button>
            </div>

            {editing && (
                <form onSubmit={handleSave} className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Produk *</label>
                            <input
                                required
                                value={editing.name}
                                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga (misal: Rp 100.000) *</label>
                            <input
                                required
                                value={editing.price}
                                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Link WhatsApp Penjual</label>
                            <input
                                value={editing.whatsapp_link || ''}
                                onChange={(e) => setEditing({ ...editing, whatsapp_link: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <ImageUploader
                        label="Foto Produk"
                        value={editing.image || ''}
                        onChange={(url) => setEditing({ ...editing, image: url })}
                    />

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={Boolean(editing.is_best_seller)}
                            onChange={(e) => setEditing({ ...editing, is_best_seller: e.target.checked ? 1 : 0 })}
                            className="w-5 h-5 accent-amber-500 rounded"
                        />
                        <span className="text-sm font-medium text-white">
                            Tampilkan sebagai <strong>Best Seller</strong> di halaman Beranda Utama
                        </span>
                    </label>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl bg-neutral-800">
                            Batal
                        </button>
                        <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold cursor-pointer">
                            Simpan Produk
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {items.map((p) => (
                    <div key={p.id} className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                        <div className="h-48 bg-neutral-800 relative">
                            {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                            {Boolean(p.is_best_seller) && (
                                <span className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-amber-400 text-xs font-bold flex items-center gap-1">
                                    <Star size={12} fill="currentColor" /> Best Seller
                                </span>
                            )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-white">{p.name}</h3>
                                <p className="text-amber-500 font-bold text-lg">{p.price}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                                <button
                                    onClick={() => setEditing(p)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id, p.name)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 5. GALLERY MANAGER
function GalleryManager({ showToast }: { showToast: (m: string, t?: 'ok' | 'err') => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState('');

    const load = async () => {
        const res = await fetch('/api/admin/gallery');
        const data = await res.json();
        setItems(data.items || []);
    };

    useEffect(() => {
        load();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return showToast('Pilih gambar terlebih dahulu', 'err');
        const res = await fetch('/api/admin/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caption, image }),
        });
        if (res.ok) {
            showToast('Foto ditambahkan ke galeri!');
            setCaption('');
            setImage('');
            load();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus foto ini dari galeri?')) return;
        await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
        showToast('Foto dihapus');
        load();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold font-display text-white">Galeri Aksi ({items.length})</h2>
                <p className="text-sm text-gray-400">Kelola dokumentasi foto aksi di halaman beranda</p>
            </div>

            <form onSubmit={handleAdd} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">Tambah Foto Baru</h3>
                <ImageUploader value={image} onChange={setImage} label="File Foto" />
                <div className="flex gap-3">
                    <input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Keterangan / Caption foto..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm cursor-pointer"
                    >
                        Tambah ke Galeri
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((g) => (
                    <div key={g.id} className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden group relative">
                        <img src={g.image} alt={g.caption} className="w-full h-44 object-cover" />
                        <div className="p-3 flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-300 truncate">{g.caption}</p>
                            <button
                                onClick={() => handleDelete(g.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white shrink-0"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 6. ORGANISASI MANAGER
function OrganisasiManager({ showToast }: { showToast: (m: string, t?: 'ok' | 'err') => void }) {
    const [title, setTitle] = useState('PENGURUS KAMPUNG SILAT JAMPANG');
    const [pengurusInti, setPengurusInti] = useState<{ role: string; name: string }[]>([]);
    const [bidangList, setBidangList] = useState<{ title: string; leader: string; members: string[] }[]>([]);

    useEffect(() => {
        fetch('/api/admin/organisasi')
            .then((r) => r.json())
            .then((d) => {
                setTitle(d.title || 'PENGURUS KAMPUNG SILAT JAMPANG');
                setPengurusInti(d.pengurusInti || []);
                setBidangList(d.bidangList || []);
            });
    }, []);

    const handleSave = async () => {
        const res = await fetch('/api/admin/organisasi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, pengurusInti, bidangList }),
        });
        if (res.ok) {
            showToast('Struktur organisasi berhasil disimpan!');
        } else {
            showToast('Gagal menyimpan perubahan', 'err');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-display text-white">Struktur Organisasi</h2>
                    <p className="text-sm text-gray-400">Edit jajaran pengurus harian & bidang pengembangan KSJ</p>
                </div>
                <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm cursor-pointer"
                >
                    Simpan Perubahan
                </button>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Judul Halaman</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase text-amber-500">Pengurus Harian (Inti)</h3>
                        <button
                            type="button"
                            onClick={() => setPengurusInti([...pengurusInti, { role: 'Jabatan', name: '' }])}
                            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> Tambah Pengurus
                        </button>
                    </div>
                    {pengurusInti.map((p, idx) => (
                        <div key={idx} className="flex gap-3">
                            <input
                                value={p.role}
                                onChange={(e) => {
                                    const copy = [...pengurusInti];
                                    copy[idx].role = e.target.value;
                                    setPengurusInti(copy);
                                }}
                                placeholder="Jabatan (misal: Ketua Umum)"
                                className="w-1/3 px-3.5 py-2 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm"
                            />
                            <input
                                value={p.name}
                                onChange={(e) => {
                                    const copy = [...pengurusInti];
                                    copy[idx].name = e.target.value;
                                    setPengurusInti(copy);
                                }}
                                placeholder="Nama Lengkap"
                                className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-800 border border-white/10 text-white text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setPengurusInti(pengurusInti.filter((_, i) => i !== idx))}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase text-amber-500">Daftar Bidang Pengembangan</h3>
                        <button
                            type="button"
                            onClick={() => setBidangList([...bidangList, { title: 'NAMA BIDANG', leader: '', members: [] }])}
                            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> Tambah Bidang
                        </button>
                    </div>
                    {bidangList.map((b, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-neutral-800/60 border border-white/5 space-y-3">
                            <div className="flex gap-3">
                                <input
                                    value={b.title}
                                    onChange={(e) => {
                                        const copy = [...bidangList];
                                        copy[idx].title = e.target.value;
                                        setBidangList(copy);
                                    }}
                                    placeholder="Nama Bidang"
                                    className="w-1/2 px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white text-sm font-bold"
                                />
                                <input
                                    value={b.leader}
                                    onChange={(e) => {
                                        const copy = [...bidangList];
                                        copy[idx].leader = e.target.value;
                                        setBidangList(copy);
                                    }}
                                    placeholder="Ketua Bidang"
                                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setBidangList(bidangList.filter((_, i) => i !== idx))}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-1">
                                    Anggota Bidang (pisahkan dengan koma)
                                </label>
                                <input
                                    value={(b.members || []).join(', ')}
                                    onChange={(e) => {
                                        const copy = [...bidangList];
                                        copy[idx].members = e.target.value
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        setBidangList(copy);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-gray-300 text-xs"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 7. ACCOUNT SETTINGS
function AccountManager({
    user,
    onUpdateUser,
    showToast,
}: {
    user: User;
    onUpdateUser: (u: User) => void;
    showToast: (m: string, t?: 'ok' | 'err') => void;
}) {
    const [email, setEmail] = useState(user.email);
    const [name, setName] = useState(user.name);
    const [newPassword, setNewPassword] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/account', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
            onUpdateUser(data.user);
            setNewPassword('');
            showToast('Profil & kredensial admin diperbarui!');
        } else {
            showToast('Gagal memperbarui akun', 'err');
        }
    };

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h2 className="text-2xl font-bold font-display text-white">Pengaturan Akun Admin</h2>
                <p className="text-sm text-gray-400">Ubah email atau ganti password akses CMS</p>
            </div>

            <form onSubmit={handleSave} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Admin</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email Login</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                        Password Baru (Kosongkan jika tidak ingin mengganti)
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-white/10 text-white"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm cursor-pointer"
                >
                    Simpan Perubahan Akun
                </button>
            </form>
        </div>
    );
}
