import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Calendar,
    Clock,
    Users,
    Building2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    Star,
    LogOut,
    ExternalLink,
    RefreshCw,
    MessageCircle,
    Trash2,
    Shield,
    Sparkles,
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
}

interface Booking {
    id: string;
    nama: string;
    instansi: string;
    hp: string;
    kegiatan: string;
    peserta: number;
    start_time: string;
    end_time: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    created_at: string;
    rating_keseluruhan?: number | null;
    rating_kebersihan?: number | null;
    rating_fasilitas?: number | null;
    feedback_komentar?: string | null;
    feedback_avg?: number | null;
}

interface FeedbackItem {
    id: string;
    booking_id: string;
    nama: string;
    instansi: string;
    kegiatan: string;
    rating_keseluruhan: number;
    rating_kebersihan: number;
    rating_fasilitas: number;
    komentar: string;
    created_at: string;
    start_time?: string;
    end_time?: string;
}

type Tab = 'bookings' | 'feedback';
type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected';

function parseSafeDate(dtStr: string): Date | null {
    if (!dtStr) return null;
    const trimmed = String(dtStr).trim();
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    let [datePart, timePart] = trimmed.includes('T') ? trimmed.split('T') : trimmed.split(' ');
    if (!timePart) timePart = '00:00:00';

    if (datePart && datePart.includes('/')) {
        const parts = datePart.split('/');
        if (parts.length === 3) {
            const m = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            const y = parts[2].padStart(4, '0');
            const cand = new Date(`${y}-${m}-${day}T${timePart}`);
            if (!isNaN(cand.getTime())) return cand;
        }
    }
    return null;
}

function formatDT(dtStr: string) {
    if (!dtStr) return '-';
    const d = parseSafeDate(dtStr);
    if (!d) return dtStr;
    return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPhoneForWA(phone: string) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.slice(1);
    }
    return cleaned;
}

export default function PinjamAulaApp({
    user,
    onLogout,
}: {
    user: User;
    onLogout: () => void;
}) {
    const [tab, setTab] = useState<Tab>('bookings');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal Confirmation State
    const [confirmAction, setConfirmAction] = useState<{
        booking: Booking;
        newStatus: 'Approved' | 'Rejected';
    } | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [bRes, fRes] = await Promise.all([
                fetch('/api/admin/pinjamaula/bookings'),
                fetch('/api/admin/pinjamaula/feedback'),
            ]);
            const bJson = await bRes.json();
            const fJson = await fRes.json();

            if (bJson.ok) setBookings(bJson.data || []);
            if (fJson.ok) setFeedbackList(fJson.data || []);
        } catch (err) {
            console.error('Error load admin data:', err);
            showToast('Gagal memuat data admin.', 'err');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/pinjamaula/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                showToast(`Status berhasil diubah menjadi "${status}".`);
                setConfirmAction(null);
                loadData();
            } else {
                showToast(data.error || 'Gagal mengubah status booking.', 'err');
            }
        } catch (err: any) {
            showToast(err.message || 'Gagal mengubah status.', 'err');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus booking ini secara permanen?')) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/pinjamaula/bookings/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                showToast('Booking berhasil dihapus.');
                loadData();
            } else {
                showToast(data.error || 'Gagal menghapus.', 'err');
            }
        } catch (err) {
            showToast('Koneksi gagal.', 'err');
        } finally {
            setActionLoading(null);
        }
    };

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const matchStatus = statusFilter === 'all' || b.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchQuery =
                !q ||
                b.nama.toLowerCase().includes(q) ||
                b.instansi.toLowerCase().includes(q) ||
                b.kegiatan.toLowerCase().includes(q) ||
                b.hp.includes(q);
            return matchStatus && matchQuery;
        });
    }, [bookings, statusFilter, searchQuery]);

    // Stats counts
    const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
    const approvedCount = bookings.filter((b) => b.status === 'Approved').length;
    const rejectedCount = bookings.filter((b) => b.status === 'Rejected').length;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border animate-fade-in-up ${
                        toast.type === 'ok'
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                    }`}
                >
                    {toast.type === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{toast.msg}</span>
                </div>
            )}

            {/* Header Navbar */}
            <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800/80 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-950/60">
                            🏮
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base md:text-lg font-extrabold text-white font-display">
                                    Pengelola Aula KSJ
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                    Role: {user.role || 'pinjam'}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400">
                                Akun aktif: <span className="text-neutral-200 font-medium">{user.email}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/pinjamaula"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                        >
                            <span>Halaman Publik</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                            onClick={onLogout}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-xs font-semibold transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Admin Dashboard */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
                {/* Stats Counters */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>Menunggu Review</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-amber-400 mt-2 font-display">
                            {pendingCount}
                        </div>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>Telah Disetujui</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-display">
                            {approvedCount}
                        </div>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>Ditolak / Dibatalkan</span>
                            <XCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-rose-400 mt-2 font-display">
                            {rejectedCount}
                        </div>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>Total Ulasan</span>
                            <Star className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-extrabold text-white mt-2 font-display">
                            {feedbackList.length}
                        </div>
                    </div>
                </div>

                {/* Tab Controls */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTab('bookings')}
                            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                                tab === 'bookings'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/60'
                                    : 'text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-800'
                            }`}
                        >
                            📋 Pengajuan Peminjaman ({bookings.length})
                        </button>
                        <button
                            onClick={() => setTab('feedback')}
                            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                                tab === 'feedback'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/60'
                                    : 'text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-800'
                            }`}
                        >
                            ⭐ Ulasan Fasilitas ({feedbackList.length})
                        </button>
                    </div>

                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                        title="Segarkan data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Tab: Bookings */}
                {tab === 'bookings' && (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800/60">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama peminjam, instansi, atau kegiatan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                {(['all', 'Pending', 'Approved', 'Rejected'] as StatusFilter[]).map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                            statusFilter === st
                                                ? st === 'Approved'
                                                    ? 'bg-emerald-600 text-white'
                                                    : st === 'Pending'
                                                    ? 'bg-amber-600 text-white'
                                                    : st === 'Rejected'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-neutral-200 text-neutral-950'
                                                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                                        }`}
                                    >
                                        {st === 'all' ? 'Semua' : st === 'Pending' ? `⏳ Menunggu (${pendingCount})` : st === 'Approved' ? '✓ Disetujui' : '✕ Ditolak'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Booking List */}
                        {loading ? (
                            <div className="text-center py-16 text-neutral-500 text-sm">
                                Memuat data peminjaman aula...
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="text-center py-16 bg-neutral-900/30 rounded-3xl border border-neutral-800 text-neutral-400">
                                <p className="text-sm font-semibold">Tidak ada data peminjaman yang cocok.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredBookings.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                                        b.status === 'Approved'
                                                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                                            : b.status === 'Pending'
                                                            ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                                                            : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                                                    }`}
                                                >
                                                    {b.status === 'Approved'
                                                        ? '✓ Disetujui'
                                                        : b.status === 'Pending'
                                                        ? '⏳ Menunggu Persetujuan'
                                                        : '✕ Ditolak'}
                                                </span>
                                                <span className="text-xs text-neutral-400">
                                                    ID: <code className="text-neutral-300">{b.id}</code>
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-base font-extrabold text-white">
                                                    {b.kegiatan}
                                                </h3>
                                                <div className="text-xs text-amber-400 font-semibold mt-0.5">
                                                    {b.instansi}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-neutral-400 pt-1">
                                                <div>
                                                    <span className="text-neutral-500">PIC: </span>
                                                    <strong className="text-neutral-200">{b.nama}</strong> ({b.hp})
                                                </div>
                                                <div>
                                                    <span className="text-neutral-500">Jadwal: </span>
                                                    <strong className="text-neutral-200">{formatDT(b.start_time)}</strong> s/d {formatDT(b.end_time)}
                                                </div>
                                                <div>
                                                    <span className="text-neutral-500">Peserta: </span>
                                                    <strong className="text-neutral-200">{b.peserta} orang</strong>
                                                </div>
                                            </div>

                                            {b.feedback_avg && (
                                                <div className="text-xs text-amber-400 flex items-center gap-1.5 pt-1">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                    <span>Ulasan: {b.feedback_avg}/5 — "{b.feedback_komentar || 'Tanpa komentar'}"</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                                            {/* WhatsApp PIC */}
                                            <a
                                                href={`https://wa.me/${formatPhoneForWA(b.hp)}?text=${encodeURIComponent(
                                                    `Halo Bapak/Ibu ${b.nama}, kami dari Pengelola Aula Kampung Silat Jampang terkait pengajuan kegiatan "${b.kegiatan}".`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 transition-colors"
                                                title="Hubungi PIC via WhatsApp"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </a>

                                            {/* Approve Button */}
                                            {b.status !== 'Approved' && (
                                                <button
                                                    onClick={() => setConfirmAction({ booking: b, newStatus: 'Approved' })}
                                                    disabled={actionLoading === b.id}
                                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                                                >
                                                    Setujui
                                                </button>
                                            )}

                                            {/* Reject Button */}
                                            {b.status !== 'Rejected' && (
                                                <button
                                                    onClick={() => setConfirmAction({ booking: b, newStatus: 'Rejected' })}
                                                    disabled={actionLoading === b.id}
                                                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-rose-950 hover:text-rose-400 text-neutral-300 text-xs font-bold transition-all border border-neutral-700"
                                                >
                                                    Tolak
                                                </button>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(b.id)}
                                                disabled={actionLoading === b.id}
                                                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-rose-950 hover:text-rose-400 text-neutral-500 border border-neutral-800 transition-colors"
                                                title="Hapus booking"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Feedback */}
                {tab === 'feedback' && (
                    <div className="space-y-4">
                        {feedbackList.length === 0 ? (
                            <div className="text-center py-16 bg-neutral-900/30 rounded-3xl border border-neutral-800 text-neutral-400">
                                <p className="text-sm font-semibold">Belum ada feedback / ulasan fasilitas yang masuk.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {feedbackList.map((f) => {
                                    const avg = ((f.rating_keseluruhan + f.rating_kebersihan + f.rating_fasilitas) / 3).toFixed(1);
                                    return (
                                        <div
                                            key={f.id}
                                            className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 space-y-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-extrabold text-white text-sm">
                                                        {f.kegiatan}
                                                    </h4>
                                                    <p className="text-xs text-amber-400">{f.instansi}</p>
                                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                                        Oleh: {f.nama} • {formatDT(f.created_at)}
                                                    </p>
                                                </div>
                                                <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm flex items-center gap-1">
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    <span>{avg}</span>
                                                </div>
                                            </div>

                                            {/* Rating detail badges */}
                                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/60">
                                                <div>
                                                    <div className="text-neutral-500">Keseluruhan</div>
                                                    <div className="text-amber-400 font-bold mt-0.5">{f.rating_keseluruhan} / 5</div>
                                                </div>
                                                <div>
                                                    <div className="text-neutral-500">Kebersihan</div>
                                                    <div className="text-amber-400 font-bold mt-0.5">{f.rating_kebersihan} / 5</div>
                                                </div>
                                                <div>
                                                    <div className="text-neutral-500">Fasilitas</div>
                                                    <div className="text-amber-400 font-bold mt-0.5">{f.rating_fasilitas} / 5</div>
                                                </div>
                                            </div>

                                            {/* Comment */}
                                            {f.komentar ? (
                                                <div className="text-xs text-neutral-300 bg-neutral-800/40 p-3 rounded-xl border border-neutral-800 italic">
                                                    "{f.komentar}"
                                                </div>
                                            ) : (
                                                <div className="text-xs text-neutral-500 italic">Tidak ada komentar tertulis.</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modal Konfirmasi Status */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                        <h3 className="text-lg font-extrabold text-white font-display">
                            Konfirmasi {confirmAction.newStatus === 'Approved' ? 'Persetujuan' : 'Penolakan'}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-2">
                            Apakah Anda yakin ingin mengubah status pengajuan berikut menjadi{' '}
                            <strong
                                className={
                                    confirmAction.newStatus === 'Approved' ? 'text-emerald-400' : 'text-rose-400'
                                }
                            >
                                {confirmAction.newStatus}
                            </strong>
                            ?
                        </p>

                        <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                            <div>Kegiatan: <strong className="text-white">{confirmAction.booking.kegiatan}</strong></div>
                            <div>Instansi: <span className="text-amber-400">{confirmAction.booking.instansi}</span></div>
                            <div>Waktu: <span className="text-neutral-300">{formatDT(confirmAction.booking.start_time)} s/d {formatDT(confirmAction.booking.end_time)}</span></div>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(confirmAction.booking.id, confirmAction.newStatus)}
                                disabled={actionLoading === confirmAction.booking.id}
                                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-lg ${
                                    confirmAction.newStatus === 'Approved'
                                        ? 'bg-emerald-600 hover:bg-emerald-500'
                                        : 'bg-rose-600 hover:bg-rose-500'
                                }`}
                            >
                                {actionLoading ? 'Memproses...' : `Ya, ${confirmAction.newStatus}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
