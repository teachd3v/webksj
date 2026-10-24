import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    Users,
    Building2,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Plus,
    Star,
    Sparkles,
    Shield,
    X,
    Lock,
    ExternalLink,
    ListFilter,
    CalendarDays,
} from 'lucide-react';

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

interface Stats {
    kegiatan: number;
    instansi: number;
    peserta: number;
}

type Filter = 'all' | 'Approved' | 'Pending' | 'Rejected';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Bulletproof Date Parser for ISO, M/D/YYYY, YYYY-MM-DD
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

function formatDateIndo(dateStr: string) {
    const d = parseSafeDate(dateStr);
    if (!d) return dateStr || '-';
    return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatTimeIndo(dateStr: string) {
    const d = parseSafeDate(dateStr);
    if (!d) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isEventEnded(endStr: string) {
    const d = parseSafeDate(endStr);
    if (!d) return false;
    return d.getTime() < Date.now();
}

export default function PinjamAulaClient() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState<Stats>({ kegiatan: 0, instansi: 0, peserta: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');

    // Calendar state
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string>(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    );

    // Mobile sheet / tab state
    const [mobileTab, setMobileTab] = useState<'calendar' | 'list'>('calendar');

    // Modal state
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [feedbackTarget, setFeedbackTarget] = useState<Booking | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [bookRes, statsRes] = await Promise.all([
                fetch('/api/pinjamaula/bookings'),
                fetch('/api/pinjamaula/stats')
            ]);
            const bookJson = await bookRes.json();
            const statsJson = await statsRes.json();

            if (bookJson.ok) setBookings(bookJson.data || []);
            if (statsJson.ok) setStats(statsJson.data || { kegiatan: 0, instansi: 0, peserta: 0 });
        } catch (err) {
            console.error('Gagal memuat data:', err);
            showToast('Gagal memuat data jadwal aula', 'err');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Group bookings by normalized date string YYYY-MM-DD
    const bookingsByDate = useMemo(() => {
        const map = new Map<string, Booking[]>();
        for (const b of bookings) {
            const d = parseSafeDate(b.start_time);
            if (!d) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(b);
        }
        return map;
    }, [bookings]);

    // Calendar grid calculations
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

        const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

        // Prev month padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
            const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            days.push({ day: dayNum, dateStr, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, dateStr, isCurrentMonth: true });
        }

        // Next month trailing days to complete 35 cells (or 42)
        const totalCells = days.length <= 35 ? 35 : 42;
        const remaining = totalCells - days.length;
        for (let i = 1; i <= remaining; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, dateStr, isCurrentMonth: false });
        }

        return days;
    }, [currentYear, currentMonth]);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    };

    const handleToday = () => {
        const now = new Date();
        setCurrentMonth(now.getMonth());
        setCurrentYear(now.getFullYear());
        setSelectedDate(
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        );
    };

    // Filtered bookings for selected date (or all recent if selected date empty)
    const selectedDateBookings = useMemo(() => {
        const items = bookingsByDate.get(selectedDate) || [];
        if (filter === 'all') return items;
        return items.filter((b) => b.status === filter);
    }, [bookingsByDate, selectedDate, filter]);

    // All filtered bookings (for general view or counter)
    const allFilteredBookings = useMemo(() => {
        let list = [...bookings];
        if (filter !== 'all') list = list.filter((b) => b.status === filter);
        return list.sort((a, b) => {
            const da = parseSafeDate(a.start_time)?.getTime() || 0;
            const db = parseSafeDate(b.start_time)?.getTime() || 0;
            return db - da;
        });
    }, [bookings, filter]);

    return (
        <div className="h-full flex flex-col p-2.5 sm:p-3 md:p-4 gap-2.5 max-w-[1700px] mx-auto select-none">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md border animate-fade-in-up text-xs font-semibold ${
                        toast.type === 'ok'
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                    }`}
                >
                    {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* ===== COMPACT TOP NAVBAR & STATS BAR ===== */}
            <header className="shrink-0 bg-neutral-900/90 border border-neutral-800/80 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-base shadow-md shadow-amber-950/50 shrink-0">
                        🏮
                    </div>
                    <div>
                        <h1 className="text-sm md:text-base font-black text-white leading-tight font-display tracking-tight flex items-center gap-1.5">
                            Peminjaman Aula KSJ
                        </h1>
                        <p className="text-[10px] text-amber-400 font-medium leading-none">
                            Kampung Silat Jampang
                        </p>
                    </div>
                </div>

                {/* Inline Stats Counter */}
                <div className="hidden sm:flex items-center gap-2 bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800/60 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] text-neutral-400">Kegiatan:</span>
                        <strong className="text-white font-extrabold">{loading ? '—' : stats.kegiatan}</strong>
                    </div>
                    <span className="text-neutral-700">|</span>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                        <Building2 className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[11px] text-neutral-400">Instansi:</span>
                        <strong className="text-amber-400 font-extrabold">{loading ? '—' : stats.instansi}</strong>
                    </div>
                    <span className="text-neutral-700">|</span>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-neutral-400">Peserta:</span>
                        <strong className="text-emerald-400 font-extrabold">{loading ? '—' : stats.peserta.toLocaleString('id-ID')}</strong>
                    </div>
                </div>

                {/* Actions & Legend */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    {/* Status Dots */}
                    <div className="hidden xl:flex items-center gap-3 text-[11px] text-neutral-400 mr-2">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Disetujui
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Menunggu
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Ditolak
                        </span>
                    </div>

                    <a
                        href="/admin"
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-neutral-700"
                        title="Masuk Admin"
                    >
                        <Lock className="w-3 h-3 text-neutral-400" />
                        <span className="hidden md:inline">Admin</span>
                    </a>

                    <button
                        onClick={() => setIsBookingOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-extrabold shadow-md shadow-amber-950/60 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Ajukan Booking</span>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Toggle */}
            <div className="flex lg:hidden items-center justify-between bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
                <button
                    onClick={() => setMobileTab('calendar')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === 'calendar' ? 'bg-amber-600 text-white' : 'text-neutral-400'
                    }`}
                >
                    📅 Kalender
                </button>
                <button
                    onClick={() => setMobileTab('list')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === 'list' ? 'bg-amber-600 text-white' : 'text-neutral-400'
                    }`}
                >
                    📋 Jadwal Tanggal Ini ({selectedDateBookings.length})
                </button>
            </div>

            {/* ===== MAIN BODY: SPLIT VIEW (FITS SCREEN ON DESKTOP) ===== */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
                {/* ── LEFT PANEL: INTERACTIVE CALENDAR GRID ── */}
                <div
                    className={`flex-1 min-h-0 bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 md:p-3.5 flex flex-col shadow-xl ${
                        mobileTab === 'list' ? 'hidden lg:flex' : 'flex'
                    }`}
                >
                    {/* Month Nav Controls */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800/80 shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base md:text-lg font-extrabold text-white font-display tracking-tight">
                                {MONTH_NAMES[currentMonth]} {currentYear}
                            </h2>
                            <button
                                onClick={handleToday}
                                className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-colors"
                            >
                                Hari Ini
                            </button>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-white transition-colors"
                                aria-label="Bulan lalu"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-white transition-colors"
                                aria-label="Bulan depan"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-neutral-400 pb-1.5 shrink-0">
                        {DAY_NAMES.map((d) => (
                            <div key={d} className="py-0.5">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day Cells Grid (Fills remaining height) */}
                    <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
                        {calendarDays.map((cell, idx) => {
                            const isSelected = selectedDate === cell.dateStr;
                            const isTodayDate =
                                today.getFullYear() === currentYear &&
                                today.getMonth() === currentMonth &&
                                today.getDate() === cell.day &&
                                cell.isCurrentMonth;
                            const dayEvents = bookingsByDate.get(cell.dateStr) || [];

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(cell.dateStr);
                                        setMobileTab('list');
                                    }}
                                    className={`p-1 md:p-1.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between overflow-hidden relative ${
                                        isSelected
                                            ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                                            : isTodayDate
                                            ? 'bg-neutral-800/80 border-neutral-600'
                                            : cell.isCurrentMonth
                                            ? 'bg-neutral-950/60 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-900/60'
                                            : 'bg-neutral-950/20 border-neutral-900/40 opacity-30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span
                                            className={`text-[11px] md:text-xs font-bold leading-none ${
                                                isSelected
                                                    ? 'text-amber-400'
                                                    : isTodayDate
                                                    ? 'text-amber-300'
                                                    : cell.isCurrentMonth
                                                    ? 'text-neutral-200'
                                                    : 'text-neutral-600'
                                            }`}
                                        >
                                            {cell.day}
                                        </span>
                                        {isTodayDate && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                        )}
                                    </div>

                                    {/* Event mini badges */}
                                    <div className="space-y-0.5 w-full mt-0.5 overflow-hidden">
                                        {dayEvents.slice(0, 2).map((ev) => (
                                            <div
                                                key={ev.id}
                                                className={`text-[8px] md:text-[9px] truncate px-1 py-0.5 rounded font-medium leading-none ${
                                                    ev.status === 'Approved'
                                                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                                                        : ev.status === 'Pending'
                                                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
                                                        : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                                                }`}
                                            >
                                                {ev.kegiatan}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[8px] text-amber-400 font-bold pl-0.5 leading-none">
                                                +{dayEvents.length - 2} lagi
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT PANEL: SELECTED DATE & ACTIVITY FEED ── */}
                <div
                    className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 min-h-0 bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 md:p-3.5 flex flex-col shadow-xl ${
                        mobileTab === 'calendar' ? 'hidden lg:flex' : 'flex'
                    }`}
                >
                    {/* Header + Filter Bar */}
                    <div className="pb-2.5 border-b border-neutral-800/80 shrink-0 space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-white text-sm md:text-base font-display">
                                    📋 Jadwal Kegiatan
                                </h3>
                                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                                    {formatDateIndo(selectedDate)}
                                </p>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                                {selectedDateBookings.length} Jadwal
                            </span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                            {(['all', 'Approved', 'Pending', 'Rejected'] as Filter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                                        filter === f
                                            ? f === 'Approved'
                                                ? 'bg-emerald-600 text-white'
                                                : f === 'Pending'
                                                ? 'bg-amber-600 text-white'
                                                : f === 'Rejected'
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-neutral-200 text-neutral-950'
                                            : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                                    }`}
                                >
                                    {f === 'all' ? 'Semua' : f === 'Approved' ? 'Disetujui' : f === 'Pending' ? 'Menunggu' : 'Ditolak'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Event List */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pt-2.5 pr-1">
                        {selectedDateBookings.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                                <div className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center text-neutral-400 mb-2">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-neutral-300">Tidak ada jadwal pada tanggal ini</p>
                                <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                                    Aula KSJ masih tersedia. Anda dapat mengajukan peminjaman sekarang.
                                </p>
                                <button
                                    onClick={() => setIsBookingOpen(true)}
                                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white text-xs font-bold transition-all border border-amber-500/40"
                                >
                                    Pesan Tanggal Ini
                                </button>
                            </div>
                        ) : (
                            selectedDateBookings.map((b) => (
                                <CompactActivityCard
                                    key={b.id}
                                    booking={b}
                                    onFeedback={() => setFeedbackTarget(b)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Form Booking */}
            {isBookingOpen && (
                <BookingModal
                    bookings={bookings}
                    onClose={() => setIsBookingOpen(false)}
                    onSuccess={() => {
                        setIsBookingOpen(false);
                        showToast('Pengajuan berhasil dikirim! Menunggu konfirmasi admin.');
                        loadData();
                    }}
                    initialDate={selectedDate}
                />
            )}

            {/* Modal: Form Feedback */}
            {feedbackTarget && (
                <FeedbackModal
                    booking={feedbackTarget}
                    onClose={() => setFeedbackTarget(null)}
                    onSuccess={() => {
                        setFeedbackTarget(null);
                        showToast('Feedback berhasil dikirim. Terima kasih!');
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

// ── Compact Activity Card ────────────────────────────────────────────────
function CompactActivityCard({
    booking,
    onFeedback,
}: {
    booking: Booking;
    onFeedback: () => void;
}) {
    const isFinished = isEventEnded(booking.end_time);
    const hasFeedback = booking.feedback_avg !== null && booking.feedback_avg !== undefined;

    return (
        <div
            className={`p-3 rounded-xl border bg-neutral-900/90 transition-all ${
                booking.status === 'Approved'
                    ? 'border-emerald-500/30'
                    : booking.status === 'Pending'
                    ? 'border-amber-500/30'
                    : 'border-rose-500/30'
            }`}
        >
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <div className="min-w-0">
                    <h4 className="font-extrabold text-white text-xs md:text-sm leading-snug line-clamp-1">
                        {booking.kegiatan}
                    </h4>
                    <p className="text-[11px] text-amber-400 font-medium truncate mt-0.5">
                        {booking.instansi}
                    </p>
                </div>
                <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        booking.status === 'Approved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : booking.status === 'Pending'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                    }`}
                >
                    {booking.status === 'Approved' ? '✓ Disetujui' : booking.status === 'Pending' ? '⏳ Menunggu' : '✕ Ditolak'}
                </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>
                        {formatTimeIndo(booking.start_time)} – {formatTimeIndo(booking.end_time)} WIB
                    </span>
                </div>
                <div className="flex items-center gap-1 text-neutral-300 font-semibold">
                    <Users className="w-3 h-3 text-neutral-500" />
                    <span>{booking.peserta} org</span>
                </div>
            </div>

            {/* Feedback footer */}
            {booking.status === 'Approved' && (
                <div className="mt-2 pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                    {hasFeedback ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{booking.feedback_avg} / 5</span>
                            <span className="text-[9px] text-neutral-500 font-normal">(Sudah dinilai)</span>
                        </div>
                    ) : isFinished ? (
                        <button
                            onClick={onFeedback}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white text-[10px] font-bold transition-all border border-amber-500/30"
                        >
                            <Star className="w-3 h-3" />
                            <span>Beri Ulasan</span>
                        </button>
                    ) : (
                        <span className="text-[10px] text-neutral-500 italic">
                            Ulasan dibuka setelah acara selesai
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Form Modal: Booking dengan Smart Conflict Assistant ─────────────────
function BookingModal({
    bookings,
    onClose,
    onSuccess,
    initialDate,
}: {
    bookings: Booking[];
    onClose: () => void;
    onSuccess: () => void;
    initialDate?: string;
}) {
    const todayStr = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, []);

    const [tanggal, setTanggal] = useState<string>(initialDate || todayStr);
    const [jamMulai, setJamMulai] = useState<string>('08:00');
    const [jamSelesai, setJamSelesai] = useState<string>('11:00');

    const [nama, setNama] = useState('');
    const [hp, setHp] = useState('');
    const [instansi, setInstansi] = useState('');
    const [kegiatan, setKegiatan] = useState('');
    const [peserta, setPeserta] = useState<number>(20);

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Filter approved bookings on the chosen date
    const approvedOnDate = useMemo(() => {
        if (!tanggal) return [];
        return bookings.filter((b) => {
            if (b.status !== 'Approved') return false;
            const d = parseSafeDate(b.start_time);
            if (!d) return false;
            const bDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return bDate === tanggal;
        }).sort((a, b) => {
            const da = parseSafeDate(a.start_time)?.getTime() || 0;
            const db = parseSafeDate(b.start_time)?.getTime() || 0;
            return da - db;
        });
    }, [bookings, tanggal]);

    // Calculate free slots recommendations on that date (07:00 to 22:00)
    const freeSlotSuggestions = useMemo(() => {
        if (approvedOnDate.length === 0) return [];

        const slots: { label: string; start: string; end: string }[] = [];
        const toMinutes = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + (m || 0);
        };
        const toTimeStr = (totalMins: number) => {
            const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
            const m = (totalMins % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        const intervals = approvedOnDate.map((b) => {
            const d1 = parseSafeDate(b.start_time)!;
            const d2 = parseSafeDate(b.end_time)!;
            return {
                startM: d1.getHours() * 60 + d1.getMinutes(),
                endM: d2.getHours() * 60 + d2.getMinutes(),
                kegiatan: b.kegiatan,
            };
        });

        const DAY_START = 7 * 60; // 07:00
        const DAY_END = 22 * 60;  // 22:00

        // Slot before first agenda
        if (intervals[0].startM - DAY_START >= 60) {
            slots.push({
                label: 'Slot Pagi',
                start: toTimeStr(DAY_START),
                end: toTimeStr(intervals[0].startM),
            });
        }

        // Slots between agendas
        for (let i = 0; i < intervals.length - 1; i++) {
            const gap = intervals[i + 1].startM - intervals[i].endM;
            if (gap >= 60) {
                slots.push({
                    label: 'Slot Antar Sesi',
                    start: toTimeStr(intervals[i].endM),
                    end: toTimeStr(intervals[i + 1].startM),
                });
            }
        }

        // Slot after last agenda
        const lastEnd = intervals[intervals.length - 1].endM;
        if (DAY_END - lastEnd >= 60) {
            slots.push({
                label: lastEnd >= 17 * 60 ? 'Slot Malam' : 'Slot Sore',
                start: toTimeStr(lastEnd),
                end: toTimeStr(Math.min(DAY_END, lastEnd + 180)), // suggest max 3 hrs
            });
        }

        return slots;
    }, [approvedOnDate]);

    // Check conflict with chosen time
    const conflictBooking = useMemo(() => {
        if (!tanggal || !jamMulai || !jamSelesai) return null;
        const reqStart = new Date(`${tanggal}T${jamMulai}:00`).getTime();
        const reqEnd = new Date(`${tanggal}T${jamSelesai}:00`).getTime();

        if (isNaN(reqStart) || isNaN(reqEnd) || reqEnd <= reqStart) return null;

        for (const b of approvedOnDate) {
            const existStart = parseSafeDate(b.start_time)?.getTime();
            const existEnd = parseSafeDate(b.end_time)?.getTime();
            if (existStart && existEnd) {
                if (reqStart < existEnd && reqEnd > existStart) {
                    return b;
                }
            }
        }
        return null;
    }, [tanggal, jamMulai, jamSelesai, approvedOnDate]);

    // Calculate duration in hours
    const durationLabel = useMemo(() => {
        if (!jamMulai || !jamSelesai) return null;
        const [h1, m1] = jamMulai.split(':').map(Number);
        const [h2, m2] = jamSelesai.split(':').map(Number);
        const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff <= 0) return 'Jam selesai harus lebih akhir dari mulai';
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `Durasi: ${hours > 0 ? `${hours} jam ` : ''}${mins > 0 ? `${mins} menit` : ''}`;
    }, [jamMulai, jamSelesai]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (conflictBooking) {
            setErrorMsg(`Jadwal bentrok dengan kegiatan "${conflictBooking.kegiatan}". Silakan sesuaikan jam.`);
            return;
        }

        setSubmitting(true);
        try {
            const startStr = `${tanggal}T${jamMulai}:00`;
            const endStr = `${tanggal}T${jamSelesai}:00`;

            const res = await fetch('/api/pinjamaula/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nama,
                    hp,
                    instansi,
                    kegiatan,
                    peserta,
                    start: startStr,
                    end: endStr,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setErrorMsg(data.error || 'Terjadi kesalahan saat mengajukan peminjaman.');
            } else {
                onSuccess();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Koneksi gagal. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-hidden">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header (Pinned Top) */}
                <div className="px-5 md:px-7 py-3.5 border-b border-neutral-800/80 flex items-center justify-between shrink-0 bg-neutral-900/90">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase mb-0.5">
                            <Sparkles className="w-3 h-3" /> Smart Booking Assistant
                        </div>
                        <h3 className="text-lg md:text-xl font-extrabold text-white font-display leading-tight">
                            Ajukan Peminjaman Aula KSJ
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content (Scrollable if needed, 2-cols on desktop) */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                            {/* ===== KOLOM KIRI: WAKTU & KETERSEDIAAN ===== */}
                            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <CalendarIcon className="w-3.5 h-3.5" /> 1. Tanggal & Jam Kegiatan
                                    </label>
                                    {durationLabel && (
                                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800">
                                            {durationLabel}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                                            Tanggal <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={tanggal}
                                            onChange={(e) => setTanggal(e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                                            Mulai <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={jamMulai}
                                            onChange={(e) => setJamMulai(e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                                            Selesai <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={jamSelesai}
                                            onChange={(e) => setJamSelesai(e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* SMART AVAILABILITY & CONFLICT WARNING BANNER */}
                                {approvedOnDate.length === 0 ? (
                                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Aula kosong seharian penuh pada tanggal ini. Bebas menentukan jam.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2 p-2.5 rounded-xl bg-neutral-900/90 border border-amber-500/30 text-xs">
                                        <div className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            <span>Agenda terjadwal di tanggal {formatDateIndo(tanggal)}:</span>
                                        </div>
                                        <div className="space-y-1 pl-4 text-[11px]">
                                            {approvedOnDate.map((b) => (
                                                <div key={b.id} className="text-neutral-300">
                                                    • <strong className="text-white">{b.kegiatan}</strong> ({b.instansi}){' '}
                                                    <span className="text-amber-300 font-semibold">
                                                        {formatTimeIndo(b.start_time)} – {formatTimeIndo(b.end_time)} WIB
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Slot Rekomendasi Bebas */}
                                        {freeSlotSuggestions.length > 0 && (
                                            <div className="pt-2 border-t border-neutral-800">
                                                <div className="text-[10px] text-neutral-400 mb-1 font-medium">
                                                    💡 Rekomendasi slot kosong (klik untuk pakai):
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {freeSlotSuggestions.map((slot, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => {
                                                                setJamMulai(slot.start);
                                                                setJamSelesai(slot.end);
                                                            }}
                                                            className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all flex items-center gap-1"
                                                        >
                                                            <span>{slot.label}:</span>
                                                            <span>{slot.start} – {slot.end}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* CRITICAL CONFLICT ALERT IF TIME OVERLAPS */}
                                {conflictBooking && (
                                    <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs flex items-start gap-2 animate-pulse-soft">
                                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                        <div className="text-[11px] leading-relaxed">
                                            <strong className="font-extrabold text-rose-300">Jadwal Bentrok!</strong> Jam pilihan ({jamMulai} – {jamSelesai}) bertabrakan dengan{' '}
                                            <strong className="text-white">"{conflictBooking.kegiatan}"</strong> ({formatTimeIndo(conflictBooking.start_time)} – {formatTimeIndo(conflictBooking.end_time)} WIB).
                                            Silakan sesuaikan jam mulai setelah jam {formatTimeIndo(conflictBooking.end_time)} atau sebelum jam {formatTimeIndo(conflictBooking.start_time)}.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== KOLOM KANAN: DETAIL ACARA & PIC ===== */}
                            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-3">
                                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> 2. Detail Acara & Penanggung Jawab
                                </label>

                                <div>
                                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                        Nama Kegiatan / Acara <span className="text-amber-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Latihan Jurus Tunggal & Evaluasi"
                                        value={kegiatan}
                                        onChange={(e) => setKegiatan(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                            Perguruan / Instansi <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Gerak Panca"
                                            value={instansi}
                                            onChange={(e) => setInstansi(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                            Jumlah Peserta (Orang) <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={500}
                                            value={peserta}
                                            onChange={(e) => setPeserta(parseInt(e.target.value, 10) || 1)}
                                            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                            Nama Lengkap PIC <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Burhan"
                                            value={nama}
                                            onChange={(e) => setNama(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                            No. WhatsApp PIC <span className="text-amber-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="081234567890"
                                            value={hp}
                                            onChange={(e) => setHp(e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions (Pinned Bottom) */}
                    <div className="px-5 md:px-7 py-3 border-t border-neutral-800/80 bg-neutral-900/90 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !!conflictBooking}
                            className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                                conflictBooking
                                    ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-60'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                            }`}
                        >
                            {submitting
                                ? 'Mengirim...'
                                : conflictBooking
                                ? 'Jadwal Bentrok — Sesuaikan Jam'
                                : 'Kirim Pengajuan Peminjaman'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Form Modal: Feedback ─────────────────────────────────────────────────
function FeedbackModal({
    booking,
    onClose,
    onSuccess,
}: {
    booking: Booking;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [ratingKeseluruhan, setRatingKeseluruhan] = useState(5);
    const [ratingKebersihan, setRatingKebersihan] = useState(5);
    const [ratingFasilitas, setRatingFasilitas] = useState(5);
    const [komentar, setKomentar] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSubmitting(true);

        try {
            const res = await fetch('/api/pinjamaula/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    nama: booking.nama,
                    instansi: booking.instansi,
                    kegiatan: booking.kegiatan,
                    ratingKeseluruhan,
                    ratingKebersihan,
                    ratingFasilitas,
                    komentar,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setErrorMsg(data.error || 'Gagal mengirim ulasan.');
            } else {
                onSuccess();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Koneksi gagal.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
            <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-5 md:p-6 animate-fade-in-up">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase mb-1">
                        <Star className="w-3 h-3" /> Ulasan Fasilitas
                    </div>
                    <h3 className="text-xl font-extrabold text-white font-display">
                        Beri Masukan untuk Aula KSJ
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">
                        {booking.kegiatan} ({booking.instansi})
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="block font-semibold text-neutral-300 mb-1">
                            Kepuasan Keseluruhan
                        </label>
                        <StarRatingInput value={ratingKeseluruhan} onChange={setRatingKeseluruhan} />
                    </div>

                    <div>
                        <label className="block font-semibold text-neutral-300 mb-1">
                            Kebersihan & Kerapihan Aula
                        </label>
                        <StarRatingInput value={ratingKebersihan} onChange={setRatingKebersihan} />
                    </div>

                    <div>
                        <label className="block font-semibold text-neutral-300 mb-1">
                            Kelengkapan Fasilitas
                        </label>
                        <StarRatingInput value={ratingFasilitas} onChange={setRatingFasilitas} />
                    </div>

                    <div>
                        <label className="block font-semibold text-neutral-300 mb-1">
                            Kritik & Saran
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Pengalaman atau saran perbaikan..."
                            value={komentar}
                            onChange={(e) => setKomentar(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-amber-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all"
                        >
                            {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StarRatingInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="p-1 hover:scale-125 transition-transform"
                >
                    <Star
                        className={`w-5 h-5 transition-colors ${
                            star <= value
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-neutral-800 text-neutral-700'
                        }`}
                    />
                </button>
            ))}
            <span className="text-xs text-amber-400 font-bold ml-1.5">{value} / 5</span>
        </div>
    );
}
