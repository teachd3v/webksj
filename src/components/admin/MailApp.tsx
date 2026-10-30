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
    ArrowLeft,
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
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-2xl border flex items-center gap-2 max-w-[90vw] transition-all animate-in fade-in slide-in-from-bottom-2 ${
                        toast.type === 'ok'
                            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
                            : 'bg-red-950/95 border-red-500/40 text-red-200'
                    }`}
                >
                    {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="truncate">{toast.msg}</span>
                </div>
            )}

            {/* Topbar (Hidden on mobile if email detail is open, to give full space to detail navbar) */}
            <header className={`h-14 border-b border-white/10 bg-neutral-950 px-4 sm:px-6 flex items-center justify-between shrink-0 ${selectedEmail ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center gap-3">
                    <h1 className="font-semibold text-base sm:text-lg text-white tracking-tight">KSJ Webmail</h1>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Refresh shortcut for mobile in topbar */}
                    <button
                        onClick={() => fetchEmails()}
                        disabled={refreshing}
                        className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                        title="Segarkan Kotak Surat"
                        aria-label="Segarkan"
                    >
                        <RefreshCw size={17} className={refreshing ? 'animate-spin text-amber-400' : ''} />
                    </button>

                    <button
                        onClick={onLogout}
                        title="Keluar"
                        aria-label="Keluar"
                        className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Compose & Folders */}
                <aside className="w-56 bg-neutral-950 border-r border-white/10 p-3 hidden md:flex flex-col shrink-0">
                    {/* Minimalist Compose Button */}
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors mb-4 shadow-sm"
                    >
                        <PenSquare size={15} />
                        <span>Tulis Pesan</span>
                    </button>

                    <nav className="space-y-1">
                        <button
                            onClick={() => {
                                setFilter('all');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                filter === 'all'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Inbox size={15} className={filter === 'all' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Kotak Masuk</span>
                            </div>
                            {emails.length > 0 && (
                                <span className={`text-[11px] font-mono ${filter === 'all' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {emails.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFilter('unread');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                filter === 'unread'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Mail size={15} className={filter === 'unread' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Belum Dibaca</span>
                            </div>
                            {unreadCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFilter('starred');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                filter === 'starred'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Star size={15} className={filter === 'starred' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Berbintang</span>
                            </div>
                            {emails.filter((e) => e.is_starred).length > 0 && (
                                <span className={`text-[11px] font-mono ${filter === 'starred' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {emails.filter((e) => e.is_starred).length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFilter('sent');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                filter === 'sent'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <SendHorizonal size={15} className={filter === 'sent' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Terkirim</span>
                            </div>
                            {sentEmails.length > 0 && (
                                <span className={`text-[11px] font-mono ${filter === 'sent' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {sentEmails.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </aside>

                {/* Middle Pane: Email List (Hidden on mobile if email is selected) */}
                <div
                    className={`w-full md:w-88 lg:w-96 border-r border-white/10 flex flex-col bg-neutral-950 shrink-0 ${
                        selectedEmail ? 'hidden md:flex' : 'flex'
                    }`}
                >
                    {/* Search & Actions Bar */}
                    <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-neutral-950 sticky top-0 z-10">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                                type="text"
                                placeholder={`Cari di ${filter === 'sent' ? 'pesan terkirim' : 'kotak surat'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-sm sm:text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white"
                                    aria-label="Hapus pencarian"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => fetchEmails()}
                            disabled={refreshing}
                            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-white/5 active:scale-95 transition-all shrink-0"
                            title="Segarkan Kotak Surat"
                            aria-label="Segarkan"
                        >
                            <RefreshCw size={15} className={refreshing ? 'animate-spin text-amber-400' : ''} />
                        </button>
                    </div>

                    {/* Email List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/5 pb-24 md:pb-0">
                        {loading ? (
                            <div className="p-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
                                <RefreshCw size={20} className="animate-spin text-amber-400" />
                                <span>Memuat email...</span>
                            </div>
                        ) : filteredEmails.length === 0 ? (
                            <div className="p-12 text-center">
                                <Inbox size={36} className="mx-auto text-neutral-600 mb-2.5 stroke-[1.5]" />
                                <p className="text-sm text-neutral-300 font-medium">Kotak surat kosong</p>
                                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                                    {searchQuery ? 'Tidak ada pesan yang sesuai kata kunci pencarian.' : 'Tidak ada pesan dalam kategori ini.'}
                                </p>
                            </div>
                        ) : (
                            filteredEmails.map((email) => {
                                const isSelected = selectedEmail?.id === email.id;
                                const atts = parseAttachments(email.attachments);
                                const hasAttachments = atts.length > 0;
                                const isUnread = filter !== 'sent' && !email.is_read;
                                const senderDisplay = filter === 'sent' ? `Kepada: ${email.to_email}` : (email.from_name || email.from_email);
                                const initial = (email.from_name || email.from_email || 'K').charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={email.id}
                                        onClick={() => openEmail(email)}
                                        className={`p-3.5 sm:p-3 cursor-pointer transition-colors relative flex items-start gap-3 border-b border-white/[0.04] active:bg-white/[0.04] ${
                                            isSelected
                                                ? 'bg-amber-500/10 border-l-2 border-amber-500'
                                                : isUnread
                                                ? 'bg-neutral-900/60 hover:bg-neutral-900/80 border-l-2 border-amber-500'
                                                : 'bg-transparent hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        {/* Mobile Avatar */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                                            isUnread
                                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                                : 'bg-neutral-900 border-white/5 text-neutral-400'
                                        }`}>
                                            {initial}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    {isUnread && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                                    )}
                                                    <span
                                                        className={`text-xs truncate ${
                                                            isUnread ? 'font-bold text-white' : 'font-medium text-neutral-300'
                                                        }`}
                                                    >
                                                        {senderDisplay}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                                                    {formatDate(email.received_at || email.sent_at)}
                                                </span>
                                            </div>

                                            <div
                                                className={`text-xs truncate mb-1 ${
                                                    isUnread ? 'font-semibold text-neutral-100' : 'text-neutral-400'
                                                }`}
                                            >
                                                {email.subject}
                                            </div>

                                            <p className="text-[11px] text-neutral-500 line-clamp-1 leading-relaxed">
                                                {email.snippet || email.body_text || email.body || '(Tidak ada teks)'}
                                            </p>

                                            {/* Attachment badge */}
                                            {hasAttachments && (
                                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 w-fit">
                                                    <Paperclip size={10} className="text-amber-400" />
                                                    <span>{atts.length} lampiran</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Star button with ample touch target */}
                                        {filter !== 'sent' && (
                                            <button
                                                onClick={(e) => toggleStar(e, email)}
                                                className={`p-2 -mr-1.5 mt-0.5 transition-colors active:scale-90 ${
                                                    email.is_starred ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                                                }`}
                                                aria-label={email.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                                            >
                                                <Star size={15} fill={email.is_starred ? 'currentColor' : 'none'} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Mobile Floating Action Button (FAB) for Compose */}
                {!selectedEmail && (
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
                        aria-label="Tulis Pesan Baru"
                    >
                        <PenSquare size={17} />
                        <span>Tulis</span>
                    </button>
                )}

                {/* Mobile Bottom Navigation Bar (Shown on list view) */}
                {!selectedEmail && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around pb-safe">
                        <button
                            onClick={() => {
                                setFilter('all');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] transition-all relative ${
                                filter === 'all' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <Inbox size={18} />
                            <span className="text-[10px] mt-0.5">Masuk</span>
                            {emails.length > 0 && (
                                <span className="text-[9px] px-1 bg-white/10 rounded-full text-neutral-300 absolute top-0.5 right-2">
                                    {emails.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFilter('unread');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] transition-all relative ${
                                filter === 'unread' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <Mail size={18} />
                            <span className="text-[10px] mt-0.5">Belum Baca</span>
                            {unreadCount > 0 && (
                                <span className="text-[9px] px-1 bg-amber-500 text-neutral-950 font-bold rounded-full absolute top-0.5 right-1.5">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFilter('starred');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] transition-all relative ${
                                filter === 'starred' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <Star size={18} fill={filter === 'starred' ? 'currentColor' : 'none'} />
                            <span className="text-[10px] mt-0.5">Bintang</span>
                        </button>

                        <button
                            onClick={() => {
                                setFilter('sent');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] transition-all relative ${
                                filter === 'sent' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <SendHorizonal size={18} />
                            <span className="text-[10px] mt-0.5">Terkirim</span>
                        </button>
                    </nav>
                )}

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
                            {/* Header Actions: Native-like sticky header on mobile */}
                            <div className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md -mx-4 -mt-4 px-4 py-3 sm:mx-0 sm:mt-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none flex items-center justify-between border-b border-white/10 mb-4">
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="flex items-center gap-1.5 py-1.5 px-2.5 -ml-1 rounded-xl text-neutral-300 hover:text-white bg-white/5 sm:bg-transparent text-xs font-medium active:scale-95 transition-all"
                                    aria-label="Kembali ke daftar pesan"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Kembali</span>
                                </button>

                                <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
                                    <Clock size={14} />
                                    <span>
                                        {selectedEmail.sent_at
                                            ? `Terkirim: ${formatDate(selectedEmail.sent_at)}`
                                            : `Diterima: ${formatDate(selectedEmail.received_at)}`}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    {filter !== 'sent' && (
                                        <button
                                            onClick={(e) => toggleStar(e, selectedEmail)}
                                            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all ${
                                                selectedEmail.is_starred ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                                            }`}
                                            title="Tandai Bintang"
                                            aria-label="Tandai Bintang"
                                        >
                                            <Star size={16} fill={selectedEmail.is_starred ? 'currentColor' : 'none'} />
                                        </button>
                                    )}
                                    {filter !== 'sent' && (
                                        <button
                                            onClick={() => deleteEmail(selectedEmail.id)}
                                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:scale-90 transition-all"
                                            title="Hapus Email"
                                            aria-label="Hapus Email"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Message Heading */}
                            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mb-3 break-words">
                                {selectedEmail.subject}
                            </h2>

                            {/* Sender / Recipient Card */}
                            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm shrink-0">
                                        {(selectedEmail.from_name || selectedEmail.from_email || 'K').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs sm:text-sm font-semibold text-white truncate">
                                            {selectedEmail.from_name || selectedEmail.from_email}
                                        </div>
                                        <div className="text-[11px] text-neutral-400 truncate">
                                            Dari: <span className="text-neutral-200">{selectedEmail.from_email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[11px] text-neutral-400 text-left sm:text-right shrink-0">
                                    <div className="sm:hidden text-[10px] text-neutral-500 mb-0.5">
                                        {formatDate(selectedEmail.received_at || selectedEmail.sent_at)}
                                    </div>
                                    Kepada: <span className="text-neutral-200 font-mono">{selectedEmail.to_email}</span>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="p-4 sm:p-6 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-200 text-sm leading-relaxed mb-5 whitespace-pre-wrap font-sans overflow-x-auto break-words">
                                {selectedEmail.body_html ? (
                                    <div
                                        className="prose prose-invert max-w-none text-sm break-words"
                                        dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                                    />
                                ) : (
                                    selectedEmail.body || selectedEmail.body_text || selectedEmail.snippet || '(Tidak ada isi pesan)'
                                )}
                            </div>

                            {/* Attachments Section */}
                            {parseAttachments(selectedEmail.attachments).length > 0 && (
                                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 mb-5 space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                                        <Paperclip size={14} className="text-amber-400" />
                                        <span>Lampiran File ({parseAttachments(selectedEmail.attachments).length}):</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {parseAttachments(selectedEmail.attachments).map((att, idx) => (
                                            <a
                                                key={idx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                download={att.name}
                                                className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 active:scale-[0.99] transition-all group"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <FileText size={16} className="text-amber-400 shrink-0" />
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
                                <div className="space-y-3 mb-5">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                        <CornerUpLeft size={13} className="text-emerald-400" />
                                        <span>Riwayat Balasan ({selectedEmail.replies.length})</span>
                                    </div>
                                    {selectedEmail.replies.map((reply) => {
                                        const rAtts = parseAttachments(reply.attachments);
                                        return (
                                            <div
                                                key={reply.id}
                                                className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs"
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="font-semibold text-emerald-400 truncate">
                                                        Dibalas oleh: {reply.from_email}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400 shrink-0 ml-2">{formatDate(reply.sent_at)}</span>
                                                </div>
                                                <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed mb-2">
                                                    {reply.body}
                                                </p>
                                                {rAtts.length > 0 && (
                                                    <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap gap-1.5">
                                                        {rAtts.map((att, aIdx) => (
                                                            <a
                                                                key={aIdx}
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-emerald-500/30 text-[11px] text-emerald-300 hover:text-white"
                                                            >
                                                                <Paperclip size={11} />
                                                                <span className="truncate max-w-[150px]">{att.name}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Quick Reply Form */}
                            {filter !== 'sent' && (
                                <form
                                    onSubmit={handleSendReply}
                                    className="p-3.5 sm:p-4 rounded-xl bg-neutral-900/60 border border-white/10 mt-auto"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 truncate">
                                            <CornerUpLeft size={14} className="text-amber-400 shrink-0" />
                                            <span className="truncate">Balas ke: <span className="text-white font-mono">{selectedEmail.from_email}</span></span>
                                        </div>
                                    </div>

                                    <textarea
                                        rows={3}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Tulis balasan pesan di sini..."
                                        className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-[15px] sm:text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                                        required
                                    />

                                    {/* Uploaded Attachments in Reply */}
                                    {replyAttachments.length > 0 && (
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            {replyAttachments.map((att, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-amber-500/30 text-xs text-amber-300"
                                                >
                                                    <Paperclip size={11} />
                                                    <span className="truncate max-w-[140px]">{att.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setReplyAttachments((prev) =>
                                                                prev.filter((_, idx) => idx !== i)
                                                            )
                                                        }
                                                        className="text-neutral-500 hover:text-red-400 p-0.5 ml-0.5"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Templates & Action Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-3 pt-2.5 border-t border-white/5">
                                        <div className="flex items-center gap-2">
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
                                                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-neutral-300 text-xs font-medium border border-white/10 transition-all"
                                            >
                                                {uploadingReplyFile ? (
                                                    <RefreshCw size={12} className="animate-spin text-amber-400" />
                                                ) : (
                                                    <Paperclip size={12} className="text-amber-400" />
                                                )}
                                                <span>{uploadingReplyFile ? 'Mengunggah...' : 'Lampirkan'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setReplyText(
                                                        'Terima kasih telah menghubungi Kampung Silat Jampang. Kami telah menerima pesan Anda dan akan segera menindaklanjutinya.'
                                                    )
                                                }
                                                className="text-[11px] px-2.5 py-2 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-neutral-400 hover:text-white transition-all hidden sm:block"
                                            >
                                                Template Cepat
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={sendingReply || !replyText.trim()}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold sm:font-semibold text-xs transition-all disabled:opacity-50"
                                        >
                                            {sendingReply ? (
                                                <>
                                                    <RefreshCw size={13} className="animate-spin" />
                                                    <span>Mengirim...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={13} />
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

            {/* COMPOSE EMAIL MODAL: Fullscreen sheet on mobile, dialog on desktop */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
                    <div className="w-full h-full sm:h-auto max-w-xl bg-neutral-950 border-0 sm:border sm:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-neutral-950 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsComposeOpen(false)}
                                className="sm:hidden text-neutral-400 hover:text-white text-xs font-medium py-1 px-2 -ml-2 active:scale-95 transition-all"
                            >
                                Batal
                            </button>
                            <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                <PenSquare size={16} className="text-amber-400" />
                                <span>Pesan Baru</span>
                            </div>
                            {/* Mobile send button right in topbar for ergonomic thumb access */}
                            <button
                                type="button"
                                onClick={handleSendCompose}
                                disabled={sendingCompose || uploadingComposeFile}
                                className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                            >
                                {sendingCompose ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                    <Send size={12} />
                                )}
                                <span>Kirim</span>
                            </button>
                            {/* Desktop close button */}
                            <button
                                onClick={() => setIsComposeOpen(false)}
                                className="hidden sm:block p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleSendCompose} className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">
                                    Dari
                                </label>
                                <input
                                    type="text"
                                    value="mail@kampungsilatjampang.id"
                                    disabled
                                    className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">
                                    Kepada <span className="text-amber-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="contoh: mitra@gmail.com"
                                    value={composeTo}
                                    onChange={(e) => setComposeTo(e.target.value)}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-[15px] sm:text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">
                                    Subjek <span className="text-amber-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Perihal pesan..."
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-[15px] sm:text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">
                                    Isi Pesan <span className="text-amber-400">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    required
                                    placeholder="Tuliskan pesan Anda di sini..."
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 text-[15px] sm:text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                                />
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                                        <Paperclip size={13} className="text-amber-400" />
                                        <span>Lampiran File</span>
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
                                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        {uploadingComposeFile ? (
                                            <RefreshCw size={11} className="animate-spin text-amber-400" />
                                        ) : (
                                            <Paperclip size={11} className="text-amber-400" />
                                        )}
                                        <span>{uploadingComposeFile ? 'Mengunggah...' : '+ Pilih File'}</span>
                                    </button>
                                </div>

                                {composeAttachments.length > 0 ? (
                                    <div className="space-y-1.5 mt-2">
                                        {composeAttachments.map((att, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-neutral-200"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <File size={14} className="text-amber-400 shrink-0" />
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
                                                    className="text-neutral-500 hover:text-red-400 p-1 active:scale-90"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-neutral-500">
                                        Bisa lampirkan dokumen (PDF, Docx), foto, atau arsip.
                                    </p>
                                )}
                            </div>

                            {/* Modal Footer Actions for desktop */}
                            <div className="hidden sm:flex pt-3 border-t border-white/10 items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsComposeOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs font-medium hover:bg-white/5 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingCompose || uploadingComposeFile}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors disabled:opacity-50"
                                >
                                    {sendingCompose ? (
                                        <>
                                            <RefreshCw size={13} className="animate-spin" />
                                            <span>Mengirim...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={13} />
                                            <span>Kirim Pesan</span>
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
