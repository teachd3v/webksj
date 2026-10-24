import { useState, useEffect, useRef } from 'react';
import {
    Mail,
    Inbox,
    Star,
    Send,
    LogOut,
    Search,
    RefreshCw,
    Trash2,
    CornerUpLeft,
    CheckCircle2,
    AlertCircle,
    Clock,
    User as UserIcon,
    ArrowLeft,
    ExternalLink,
    Sparkles,
    Paperclip,
    FileText,
    File,
    Download,
    PenSquare,
    X,
    SendHorizonal,
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
}

interface Attachment {
    name: string;
    url: string;
    size?: number;
    type?: string;
}

interface Reply {
    id: string;
    email_id: string;
    from_email: string;
    to_email: string;
    subject: string;
    body: string;
    status: string;
    attachments?: Attachment[] | string;
    sent_at: string;
}

interface EmailItem {
    id: string;
    message_id?: string;
    from_name?: string;
    from_email: string;
    to_email: string;
    subject: string;
    snippet?: string;
    body?: string;
    body_text?: string;
    body_html?: string;
    is_read?: number;
    is_starred?: number;
    received_at?: string;
    sent_at?: string;
    attachments?: Attachment[] | string;
    replies?: Reply[];
}

export default function MailApp({ user, onLogout }: { user: User; onLogout: () => void }) {
    const [emails, setEmails] = useState<EmailItem[]>([]);
    const [sentEmails, setSentEmails] = useState<EmailItem[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'sent'>('all');
    
    // Compose Modal State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
    const [uploadingComposeFile, setUploadingComposeFile] = useState(false);
    const [sendingCompose, setSendingCompose] = useState(false);

    // Quick Reply State
    const [replyText, setReplyText] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
    const [uploadingReplyFile, setUploadingReplyFile] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);

    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const composeFileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const parseAttachments = (raw?: Attachment[] | string): Attachment[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const fetchEmails = async (silently = false) => {
        if (!silently) setRefreshing(true);
        try {
            const [inboxRes, sentRes] = await Promise.all([
                fetch('/api/admin/mail/inbox'),
                fetch('/api/admin/mail/sent'),
            ]);

            if (inboxRes.ok) {
                const inboxData = await inboxRes.json<{ emails: EmailItem[] }>();
                setEmails(inboxData.emails || []);
            }
            if (sentRes.ok) {
                const sentData = await sentRes.json<{ emails: EmailItem[] }>();
                setSentEmails(sentData.emails || []);
            }

            if (selectedEmail) {
                const updated = (filter === 'sent' ? sentEmails : emails).find((e) => e.id === selectedEmail.id);
                if (updated) {
                    setSelectedEmail((prev) => (prev ? { ...prev, ...updated } : null));
                }
            }
        } catch (err: any) {
            showToast(err.message || 'Gagal memuat kotak surat', 'err');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const openEmail = async (email: EmailItem) => {
        setSelectedEmail(email);
        if (filter !== 'sent') {
            try {
                const res = await fetch(`/api/admin/mail/inbox/${email.id}`);
                if (res.ok) {
                    const data = await res.json<{ email: EmailItem }>();
                    setSelectedEmail(data.email);
                    setEmails((prev) =>
                        prev.map((e) => (e.id === email.id ? { ...e, is_read: 1 } : e))
                    );
                }
            } catch {
                // keep optimistic
            }
        }
    };

    const toggleStar = async (e: React.MouseEvent, email: EmailItem) => {
        e.stopPropagation();
        const newStarred = email.is_starred ? 0 : 1;
        setEmails((prev) =>
            prev.map((item) => (item.id === email.id ? { ...item, is_starred: newStarred } : item))
        );
        if (selectedEmail?.id === email.id) {
            setSelectedEmail((prev) => (prev ? { ...prev, is_starred: newStarred } : null));
        }

        try {
            await fetch(`/api/admin/mail/inbox/${email.id}/toggle-star`, { method: 'PUT' });
        } catch {
            showToast('Gagal mengubah status bintang', 'err');
        }
    };

    const deleteEmail = async (id: string) => {
        if (!confirm('Yakin ingin menghapus email ini?')) return;
        try {
            const res = await fetch(`/api/admin/mail/inbox/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus');
            setEmails((prev) => prev.filter((e) => e.id !== id));
            if (selectedEmail?.id === id) {
                setSelectedEmail(null);
            }
            showToast('Email berhasil dihapus');
        } catch (err: any) {
            showToast(err.message, 'err');
        }
    };

    // Upload attachment helper
    const uploadFile = async (file: File): Promise<Attachment | null> => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Upload file gagal');
            const data = await res.json<{ url: string; name?: string; size?: number; type?: string }>();
            return {
                name: file.name,
                url: data.url,
                size: file.size,
                type: file.type,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const handleUploadComposeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingComposeFile(true);
        const uploaded: Attachment[] = [];
        for (let i = 0; i < files.length; i++) {
            const res = await uploadFile(files[i]);
            if (res) uploaded.push(res);
        }
        setComposeAttachments((prev) => [...prev, ...uploaded]);
        setUploadingComposeFile(false);
        if (composeFileInputRef.current) composeFileInputRef.current.value = '';
    };

    const handleUploadReplyFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingReplyFile(true);
        const uploaded: Attachment[] = [];
        for (let i = 0; i < files.length; i++) {
            const res = await uploadFile(files[i]);
            if (res) uploaded.push(res);
        }
        setReplyAttachments((prev) => [...prev, ...uploaded]);
        setUploadingReplyFile(false);
        if (replyFileInputRef.current) replyFileInputRef.current.value = '';
    };

    // Send Composed Email
    const handleSendCompose = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
            showToast('Lengkapi penerima, subjek, dan isi pesan', 'err');
            return;
        }

        setSendingCompose(true);
        try {
            const res = await fetch('/api/admin/mail/compose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: composeTo.trim(),
                    subject: composeSubject.trim(),
                    body: composeBody.trim(),
                    attachments: composeAttachments,
                }),
            });

            const data = await res.json<{ ok: boolean; email?: EmailItem; error?: string }>();
            if (!res.ok) throw new Error(data.error || 'Gagal mengirim email');

            showToast('Email baru berhasil dikirim!');
            if (data.email) {
                setSentEmails((prev) => [data.email!, ...prev]);
            }

            // reset form & close modal
            setComposeTo('');
            setComposeSubject('');
            setComposeBody('');
            setComposeAttachments([]);
            setIsComposeOpen(false);
        } catch (err: any) {
            showToast(err.message || 'Gagal mengirim email', 'err');
        } finally {
            setSendingCompose(false);
        }
    };

    // Send Quick Reply
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmail || !replyText.trim()) return;

        setSendingReply(true);
        try {
            const res = await fetch('/api/admin/mail/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailId: selectedEmail.id,
                    to: selectedEmail.from_email,
                    subject: selectedEmail.subject.startsWith('Re:')
                        ? selectedEmail.subject
                        : `Re: ${selectedEmail.subject}`,
                    body: replyText.trim(),
                    attachments: replyAttachments,
                }),
            });

            const data = await res.json<{ ok: boolean; reply?: Reply; error?: string }>();
            if (!res.ok) throw new Error(data.error || 'Gagal mengirim balasan');

            showToast('Balasan email berhasil dikirim!');
            setReplyText('');
            setReplyAttachments([]);

            if (data.reply && selectedEmail) {
                setSelectedEmail({
                    ...selectedEmail,
                    replies: [...(selectedEmail.replies || []), data.reply],
                });
            }
        } catch (err: any) {
            showToast(err.message || 'Gagal mengirim email balasan', 'err');
        } finally {
            setSendingReply(false);
        }
    };

    // Filtered list
    const sourceList = filter === 'sent' ? sentEmails : emails;
    const filteredEmails = sourceList.filter((item) => {
        if (filter === 'unread' && item.is_read) return false;
        if (filter === 'starred' && !item.is_starred) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchSubject = item.subject?.toLowerCase().includes(q);
            const matchFrom = (item.from_name || item.from_email || '')?.toLowerCase().includes(q);
            const matchTo = item.to_email?.toLowerCase().includes(q);
            const matchSnippet = (item.snippet || item.body_text || '')?.toLowerCase().includes(q);
            return matchSubject || matchFrom || matchTo || matchSnippet;
        }
        return true;
    });

    const unreadCount = emails.filter((e) => !e.is_read).length;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-medium shadow-2xl border flex items-center gap-2 ${
                        toast.type === 'ok'
                            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/90 border-red-500/40 text-red-300'
                    }`}
                >
                    {toast.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Topbar */}
            <header className="h-16 border-b border-white/10 bg-neutral-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-display font-bold text-base sm:text-lg text-white">KSJ Webmail</h1>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                CLOUDFLARE LIVE
                            </span>
                        </div>
                        <p className="text-xs text-neutral-400 hidden sm:block">
                            Official: <code className="text-amber-400 font-mono">mail@kampungsilatjampang.id</code>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Tulis Email Button Header (Mobile only shortcut) */}
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs"
                    >
                        <PenSquare size={14} />
                        <span>Tulis</span>
                    </button>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300">
                        <UserIcon size={14} className="text-amber-400" />
                        <span>{user.name || user.email}</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded font-mono">
                            {user.role}
                        </span>
                    </div>

                    <a
                        href="/"
                        target="_blank"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        title="Buka Website"
                    >
                        <ExternalLink size={18} />
                    </a>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors"
                    >
                        <LogOut size={14} />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </header>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Compose & Folders */}
                <aside className="w-60 bg-neutral-900/50 border-r border-white/10 p-3 hidden md:flex flex-col shrink-0 gap-1.5">
                    {/* Prominent Compose Button */}
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all mb-2"
                    >
                        <PenSquare size={18} />
                        <span>Tulis Email Baru</span>
                    </button>

                    <div className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        Kotak Surat
                    </div>

                    <button
                        onClick={() => {
                            setFilter('all');
                            setSelectedEmail(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-neutral-300 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Inbox size={16} />
                            <span>Kotak Masuk</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                            {emails.length}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setFilter('unread');
                            setSelectedEmail(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            filter === 'unread'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-neutral-300 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Mail size={16} />
                            <span>Belum Dibaca</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setFilter('starred');
                            setSelectedEmail(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            filter === 'starred'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-neutral-300 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Star size={16} />
                            <span>Berbintang</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                            {emails.filter((e) => e.is_starred).length}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setFilter('sent');
                            setSelectedEmail(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            filter === 'sent'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-neutral-300 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <SendHorizonal size={16} />
                            <span>Pesan Terkirim</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                            {sentEmails.length}
                        </span>
                    </button>

                    <div className="mt-auto p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 text-xs text-neutral-300 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                            <Sparkles size={14} />
                            <span>Cloudflare R2 Media</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Semua lampiran file email otomatis disimpan secara aman di bucket <strong className="text-white">ksj-media</strong> Cloudflare R2.
                        </p>
                    </div>
                </aside>

                {/* Middle Pane: Email List (Hidden on mobile if email is selected) */}
                <div
                    className={`w-full md:w-96 lg:w-[420px] border-r border-white/10 flex flex-col bg-neutral-950 shrink-0 ${
                        selectedEmail ? 'hidden md:flex' : 'flex'
                    }`}
                >
                    {/* Search & Actions Bar */}
                    <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-neutral-900/40">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                placeholder={`Cari di ${filter === 'sent' ? 'pesan terkirim' : 'kotak surat'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <button
                            onClick={() => fetchEmails()}
                            disabled={refreshing}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors shrink-0"
                            title="Segarkan Kotak Surat"
                        >
                            <RefreshCw size={15} className={refreshing ? 'animate-spin text-amber-400' : ''} />
                        </button>
                    </div>

                    {/* Email List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                        {loading ? (
                            <div className="p-8 text-center text-xs text-neutral-500">Memuat email...</div>
                        ) : filteredEmails.length === 0 ? (
                            <div className="p-8 text-center">
                                <Inbox size={32} className="mx-auto text-neutral-600 mb-2" />
                                <p className="text-xs text-neutral-400 font-medium">Kotak surat kosong</p>
                                <p className="text-[11px] text-neutral-600 mt-1">Tidak ada email dalam kategori ini.</p>
                            </div>
                        ) : (
                            filteredEmails.map((email) => {
                                const isSelected = selectedEmail?.id === email.id;
                                const atts = parseAttachments(email.attachments);
                                const hasAttachments = atts.length > 0;

                                return (
                                    <div
                                        key={email.id}
                                        onClick={() => openEmail(email)}
                                        className={`p-3.5 cursor-pointer transition-colors relative flex items-start gap-3 ${
                                            isSelected
                                                ? 'bg-amber-500/10 border-l-2 border-amber-500'
                                                : filter !== 'sent' && !email.is_read
                                                ? 'bg-neutral-900/60 hover:bg-neutral-900 border-l-2 border-blue-500'
                                                : 'bg-neutral-950 hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        {filter !== 'sent' ? (
                                            <button
                                                onClick={(e) => toggleStar(e, email)}
                                                className={`mt-0.5 transition-colors ${
                                                    email.is_starred ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                                                }`}
                                            >
                                                <Star size={15} fill={email.is_starred ? 'currentColor' : 'none'} />
                                            </button>
                                        ) : (
                                            <SendHorizonal size={15} className="mt-1 text-emerald-400 shrink-0" />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span
                                                    className={`text-xs truncate ${
                                                        filter !== 'sent' && !email.is_read
                                                            ? 'font-bold text-white'
                                                            : 'font-medium text-neutral-300'
                                                    }`}
                                                >
                                                    {filter === 'sent'
                                                        ? `Kepada: ${email.to_email}`
                                                        : email.from_name || email.from_email}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 shrink-0">
                                                    {formatDate(email.received_at || email.sent_at)}
                                                </span>
                                            </div>

                                            <div
                                                className={`text-xs truncate mb-1 ${
                                                    filter !== 'sent' && !email.is_read
                                                        ? 'font-semibold text-neutral-200'
                                                        : 'text-neutral-400'
                                                }`}
                                            >
                                                {email.subject}
                                            </div>

                                            <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                                                {email.snippet || email.body_text || email.body || '(Tidak ada teks ringkas)'}
                                            </p>

                                            {/* Attachment badge */}
                                            {hasAttachments && (
                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md w-fit border border-amber-500/20">
                                                    <Paperclip size={11} />
                                                    <span>{atts.length} lampiran</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Pane: Email Detail & Reply */}
                <div
                    className={`flex-1 flex flex-col bg-neutral-900/30 overflow-y-auto ${
                        !selectedEmail ? 'hidden md:flex items-center justify-center' : 'flex'
                    }`}
                >
                    {!selectedEmail ? (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-500">
                                <Mail size={28} />
                            </div>
                            <h2 className="text-sm font-semibold text-neutral-300">Pilih pesan untuk dibaca</h2>
                            <p className="text-xs text-neutral-500 max-w-sm mt-1">
                                Klik salah satu pesan di sebelah kiri untuk melihat isi pesan, mengunduh lampiran, atau menulis balasan.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl w-full mx-auto">
                            {/* Header Actions */}
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white md:hidden"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Kembali ke Daftar</span>
                                </button>

                                <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
                                    <Clock size={14} />
                                    <span>
                                        {selectedEmail.sent_at
                                            ? `Terkirim: ${formatDate(selectedEmail.sent_at)}`
                                            : `Diterima: ${formatDate(selectedEmail.received_at)}`}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {filter !== 'sent' && (
                                        <button
                                            onClick={(e) => toggleStar(e, selectedEmail)}
                                            className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${
                                                selectedEmail.is_starred ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                                            }`}
                                            title="Tandai Bintang"
                                        >
                                            <Star size={16} fill={selectedEmail.is_starred ? 'currentColor' : 'none'} />
                                        </button>
                                    )}
                                    {filter !== 'sent' && (
                                        <button
                                            onClick={() => deleteEmail(selectedEmail.id)}
                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                                            title="Hapus Email"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Message Heading */}
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                                {selectedEmail.subject}
                            </h2>

                            {/* Sender / Recipient Card */}
                            <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-neutral-950 font-bold flex items-center justify-center text-sm shrink-0">
                                        {(selectedEmail.from_name || selectedEmail.from_email || 'K').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white">
                                            {selectedEmail.from_name || selectedEmail.from_email}
                                        </div>
                                        <div className="text-xs text-neutral-400">
                                            Dari: <span className="text-neutral-200">{selectedEmail.from_email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-neutral-400 text-left sm:text-right">
                                    Kepada: <span className="text-amber-400 font-mono">{selectedEmail.to_email}</span>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 text-neutral-200 text-sm leading-relaxed mb-6 whitespace-pre-wrap font-sans">
                                {selectedEmail.body_html ? (
                                    <div
                                        className="prose prose-invert max-w-none text-sm"
                                        dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                                    />
                                ) : (
                                    selectedEmail.body || selectedEmail.body_text || selectedEmail.snippet || '(Tidak ada isi pesan)'
                                )}
                            </div>

                            {/* Attachments Section */}
                            {parseAttachments(selectedEmail.attachments).length > 0 && (
                                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 mb-6 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                                        <Paperclip size={15} className="text-amber-400" />
                                        <span>Lampiran File ({parseAttachments(selectedEmail.attachments).length}):</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {parseAttachments(selectedEmail.attachments).map((att, idx) => (
                                            <a
                                                key={idx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                download={att.name}
                                                className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <FileText size={18} className="text-amber-400 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-neutral-200 truncate group-hover:text-amber-300">
                                                            {att.name}
                                                        </p>
                                                        {att.size && (
                                                            <p className="text-[10px] text-neutral-500">
                                                                {formatFileSize(att.size)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Download size={15} className="text-neutral-500 group-hover:text-amber-400 shrink-0 ml-2" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reply History / Thread */}
                            {selectedEmail.replies && selectedEmail.replies.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                        <CornerUpLeft size={14} className="text-emerald-400" />
                                        <span>Riwayat Balasan ({selectedEmail.replies.length})</span>
                                    </div>
                                    {selectedEmail.replies.map((reply) => {
                                        const rAtts = parseAttachments(reply.attachments);
                                        return (
                                            <div
                                                key={reply.id}
                                                className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-emerald-400">
                                                        Dibalas oleh: {reply.from_email}
                                                    </span>
                                                    <span className="text-neutral-400">{formatDate(reply.sent_at)}</span>
                                                </div>
                                                <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed mb-2">
                                                    {reply.body}
                                                </p>
                                                {rAtts.length > 0 && (
                                                    <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap gap-2">
                                                        {rAtts.map((att, aIdx) => (
                                                            <a
                                                                key={aIdx}
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-emerald-500/30 text-[11px] text-emerald-300 hover:text-white"
                                                            >
                                                                <Paperclip size={12} />
                                                                <span>{att.name}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Quick Reply Form (Only if not already viewing sent message) */}
                            {filter !== 'sent' && (
                                <form
                                    onSubmit={handleSendReply}
                                    className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-amber-500/30 shadow-lg mt-auto"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                                            <CornerUpLeft size={16} />
                                            <span>Balas ke: {selectedEmail.from_email}</span>
                                        </div>
                                        <span className="text-[11px] text-neutral-500 font-mono">
                                            From: mail@kampungsilatjampang.id
                                        </span>
                                    </div>

                                    <textarea
                                        rows={4}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Tulis balasan pesan di sini..."
                                        className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
                                        required
                                    />

                                    {/* Uploaded Attachments in Reply */}
                                    {replyAttachments.length > 0 && (
                                        <div className="mt-2.5 flex flex-wrap gap-2">
                                            {replyAttachments.map((att, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-950 border border-amber-500/30 text-xs text-amber-300"
                                                >
                                                    <Paperclip size={12} />
                                                    <span className="truncate max-w-[150px]">{att.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setReplyAttachments((prev) =>
                                                                prev.filter((_, idx) => idx !== i)
                                                            )
                                                        }
                                                        className="text-neutral-500 hover:text-red-400 ml-1"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Templates & Action Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            {/* File Attachment Input Button */}
                                            <input
                                                type="file"
                                                ref={replyFileInputRef}
                                                onChange={handleUploadReplyFiles}
                                                multiple
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => replyFileInputRef.current?.click()}
                                                disabled={uploadingReplyFile}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium border border-white/10 transition-colors"
                                            >
                                                {uploadingReplyFile ? (
                                                    <RefreshCw size={13} className="animate-spin text-amber-400" />
                                                ) : (
                                                    <Paperclip size={13} className="text-amber-400" />
                                                )}
                                                <span>{uploadingReplyFile ? 'Mengunggah...' : 'Lampirkan File'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setReplyText(
                                                        'Terima kasih telah menghubungi Kampung Silat Jampang. Kami telah menerima pesan Anda dan akan segera menindaklanjutinya.'
                                                    )
                                                }
                                                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors hidden sm:block"
                                            >
                                                Template Cepat
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={sendingReply || !replyText.trim()}
                                            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-50"
                                        >
                                            {sendingReply ? (
                                                <>
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    <span>Mengirim...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={14} />
                                                    <span>Kirim Balasan</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* COMPOSE EMAIL MODAL */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-neutral-950">
                            <div className="flex items-center gap-2.5 text-white font-bold text-base">
                                <PenSquare size={18} className="text-amber-400" />
                                <span>Tulis Email Baru</span>
                            </div>
                            <button
                                onClick={() => setIsComposeOpen(false)}
                                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleSendCompose} className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                    Dari (Pengirim Resmi):
                                </label>
                                <input
                                    type="text"
                                    value="mail@kampungsilatjampang.id"
                                    disabled
                                    className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                    Kepada (Email Penerima) <span className="text-amber-400">*</span>:
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="contoh: info@organisasi.com / mitra@gmail.com"
                                    value={composeTo}
                                    onChange={(e) => setComposeTo(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                    Subjek Email <span className="text-amber-400">*</span>:
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Judul atau perihal pesan..."
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                                    Isi Pesan <span className="text-amber-400">*</span>:
                                </label>
                                <textarea
                                    rows={6}
                                    required
                                    placeholder="Tuliskan isi surat atau pesan Anda di sini..."
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                                />
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                                        <Paperclip size={14} className="text-amber-400" />
                                        <span>Lampiran File:</span>
                                    </label>
                                    <input
                                        type="file"
                                        ref={composeFileInputRef}
                                        onChange={handleUploadComposeFiles}
                                        multiple
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => composeFileInputRef.current?.click()}
                                        disabled={uploadingComposeFile}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                                    >
                                        {uploadingComposeFile ? (
                                            <RefreshCw size={12} className="animate-spin" />
                                        ) : (
                                            <Paperclip size={12} />
                                        )}
                                        <span>{uploadingComposeFile ? 'Mengunggah...' : '+ Pilih File'}</span>
                                    </button>
                                </div>

                                {composeAttachments.length > 0 ? (
                                    <div className="space-y-2 mt-2">
                                        {composeAttachments.map((att, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-xs text-neutral-200"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <File size={15} className="text-amber-400 shrink-0" />
                                                    <span className="truncate">{att.name}</span>
                                                    {att.size && (
                                                        <span className="text-[10px] text-neutral-500 shrink-0">
                                                            ({formatFileSize(att.size)})
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setComposeAttachments((prev) =>
                                                            prev.filter((_, i) => i !== idx)
                                                        )
                                                    }
                                                    className="text-neutral-500 hover:text-red-400 p-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-neutral-500 italic">
                                        Belum ada file terlampir. Bisa lampirkan dokumen (PDF, Docx), foto, atau arsip.
                                    </p>
                                )}
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsComposeOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-medium hover:bg-white/5 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingCompose || uploadingComposeFile}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                                >
                                    {sendingCompose ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" />
                                            <span>Mengirim...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} />
                                            <span>Kirim Email</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
