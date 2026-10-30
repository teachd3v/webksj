import { useState, useEffect, useRef, useMemo } from 'react';
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
    RotateCcw,
    FileEdit,
    Check,
    Tag,
    User as UserIcon,
    AlertTriangle,
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

interface DraftItem {
    id: string;
    to_recipients: string[];
    subject: string;
    body: string;
    attachments?: Attachment[];
    updated_at: string;
}

interface ContactItem {
    name: string;
    email: string;
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
    replies_count?: number;
    origin?: 'inbox' | 'sent';
    deleted_at?: string;
}

type FolderType = 'inbox' | 'unread' | 'starred' | 'sent' | 'drafts' | 'trash';
type QuickFilterType = 'all' | 'starred' | 'replied' | 'has_attachment';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MailApp({ user, onLogout }: { user: User; onLogout: () => void }) {
    // Email collections
    const [emails, setEmails] = useState<EmailItem[]>([]);
    const [sentEmails, setSentEmails] = useState<EmailItem[]>([]);
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [trashEmails, setTrashEmails] = useState<EmailItem[]>([]);
    const [contacts, setContacts] = useState<ContactItem[]>([]);

    // Navigation & Selection
    const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
    const [folder, setFolder] = useState<FolderType>('inbox');
    const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Compose Modal State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [composeRecipients, setComposeRecipients] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
    const [uploadingComposeFile, setUploadingComposeFile] = useState(false);
    const [sendingCompose, setSendingCompose] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

    // Contact suggestion popup state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

    // Quick Reply State
    const [replyText, setReplyText] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
    const [uploadingReplyFile, setUploadingReplyFile] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);

    // Toast Alert (Always top-level z-[9999])
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null);

    const composeFileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRef = useRef<HTMLInputElement>(null);
    const recipientInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, type: 'ok' | 'err' | 'warn' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3800);
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

    // Fetch all primary datasets
    const fetchAllData = async (silently = false) => {
        if (!silently) setRefreshing(true);
        try {
            const [inboxRes, sentRes, draftsRes, trashRes, contactsRes] = await Promise.all([
                fetch('/api/admin/mail/inbox'),
                fetch('/api/admin/mail/sent'),
                fetch('/api/admin/mail/drafts'),
                fetch('/api/admin/mail/trash'),
                fetch('/api/admin/mail/contacts'),
            ]);

            if (inboxRes.ok) {
                const data = await inboxRes.json<{ emails: EmailItem[] }>();
                setEmails(data.emails || []);
            }
            if (sentRes.ok) {
                const data = await sentRes.json<{ emails: EmailItem[] }>();
                setSentEmails(data.emails || []);
            }
            if (draftsRes.ok) {
                const data = await draftsRes.json<{ drafts: DraftItem[] }>();
                setDrafts(data.drafts || []);
            }
            if (trashRes.ok) {
                const data = await trashRes.json<{ emails: EmailItem[] }>();
                setTrashEmails(data.emails || []);
            }
            if (contactsRes.ok) {
                const data = await contactsRes.json<{ contacts: ContactItem[] }>();
                setContacts(data.contacts || []);
            }

            if (selectedEmail) {
                let currentPool: EmailItem[] = [];
                if (folder === 'inbox' || folder === 'unread' || folder === 'starred') currentPool = emails;
                else if (folder === 'sent') currentPool = sentEmails;
                else if (folder === 'trash') currentPool = trashEmails;

                const updated = currentPool.find((e) => e.id === selectedEmail.id);
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
        fetchAllData();
    }, []);

    // Open an email and mark as read
    const openEmail = async (email: EmailItem) => {
        setSelectedEmail(email);
        if (folder !== 'sent' && folder !== 'trash') {
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
                // Keep optimistic
            }
        }
    };

    // Toggle Star
    const toggleStar = async (e: React.MouseEvent, email: EmailItem) => {
        e.stopPropagation();
        const newStarred = email.is_starred ? 0 : 1;
        const isSentOrigin = folder === 'sent' || email.origin === 'sent';

        if (isSentOrigin) {
            setSentEmails((prev) =>
                prev.map((item) => (item.id === email.id ? { ...item, is_starred: newStarred } : item))
            );
        } else {
            setEmails((prev) =>
                prev.map((item) => (item.id === email.id ? { ...item, is_starred: newStarred } : item))
            );
        }

        if (selectedEmail?.id === email.id) {
            setSelectedEmail((prev) => (prev ? { ...prev, is_starred: newStarred } : null));
        }

        try {
            const endpoint = isSentOrigin
                ? `/api/admin/mail/sent/${email.id}/toggle-star`
                : `/api/admin/mail/inbox/${email.id}/toggle-star`;
            await fetch(endpoint, { method: 'PUT' });
        } catch {
            showToast('Gagal mengubah status bintang', 'err');
        }
    };

    // Soft delete (Move to Trash)
    const softDeleteEmail = async (id: string, originHint?: 'inbox' | 'sent') => {
        const isSentOrigin = originHint === 'sent' || folder === 'sent';
        try {
            const endpoint = isSentOrigin ? `/api/admin/mail/sent/${id}` : `/api/admin/mail/inbox/${id}`;
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal memindahkan ke sampah');

            if (isSentOrigin) {
                setSentEmails((prev) => prev.filter((e) => e.id !== id));
            } else {
                setEmails((prev) => prev.filter((e) => e.id !== id));
            }

            if (selectedEmail?.id === id) {
                setSelectedEmail(null);
            }

            showToast('Email dipindahkan ke Kotak Sampah');
            // Refresh trash in background
            fetch('/api/admin/mail/trash')
                .then((r) => r.json<{ emails: EmailItem[] }>())
                .then((d) => setTrashEmails(d.emails || []));
        } catch (err: any) {
            showToast(err.message, 'err');
        }
    };

    // Restore from Trash
    const restoreEmail = async (id: string, origin: 'inbox' | 'sent' = 'inbox') => {
        try {
            const endpoint = `/api/admin/mail/${origin}/${id}/restore`;
            const res = await fetch(endpoint, { method: 'PUT' });
            if (!res.ok) throw new Error('Gagal memulihkan email');

            setTrashEmails((prev) => prev.filter((e) => e.id !== id));
            if (selectedEmail?.id === id) {
                setSelectedEmail(null);
            }
            showToast('Email berhasil dipulihkan ke ' + (origin === 'sent' ? 'Pesan Terkirim' : 'Kotak Masuk'));
            fetchAllData(true);
        } catch (err: any) {
            showToast(err.message, 'err');
        }
    };

    // Permanent Delete
    const permanentDeleteEmail = async (id: string, origin: 'inbox' | 'sent' = 'inbox') => {
        if (!confirm('Hapus permanen email ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            const endpoint = `/api/admin/mail/${origin}/${id}/permanent`;
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus permanen');

            setTrashEmails((prev) => prev.filter((e) => e.id !== id));
            if (selectedEmail?.id === id) {
                setSelectedEmail(null);
            }
            showToast('Email telah dihapus permanen');
        } catch (err: any) {
            showToast(err.message, 'err');
        }
    };

    // Empty entire trash
    const emptyTrash = async () => {
        if (trashEmails.length === 0) return;
        if (!confirm('Yakin ingin mengosongkan semua email di Kotak Sampah?')) return;
        try {
            const res = await fetch('/api/admin/mail/trash/empty', { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal mengosongkan sampah');
            setTrashEmails([]);
            if (selectedEmail) setSelectedEmail(null);
            showToast('Kotak sampah berhasil dikosongkan');
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

    // ==========================================
    // RECIPIENT CHIPS / PASTE / AUTOCOMPLETE
    // ==========================================
    const addRecipientChip = (raw: string) => {
        const cleaned = raw.trim().replace(/^<|>$/g, '');
        if (!cleaned) return false;

        if (!EMAIL_REGEX.test(cleaned)) {
            showToast(`Format email "${cleaned}" tidak valid`, 'warn');
            return false;
        }

        if (composeRecipients.includes(cleaned)) {
            setRecipientInput('');
            return true;
        }

        setComposeRecipients((prev) => [...prev, cleaned]);
        setRecipientInput('');
        setShowSuggestions(false);
        return true;
    };

    const removeRecipientChip = (emailToRemove: string) => {
        setComposeRecipients((prev) => prev.filter((e) => e !== emailToRemove));
    };

    // Bulk Copy-Paste handling
    const handleRecipientPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        if (!pastedText) return;

        // Split by commas, semicolons, whitespace, tabs, or newlines
        const candidates = pastedText
            .split(/[,;\s\n\r]+/)
            .map((item) => item.trim().replace(/^<|>$/g, ''))
            .filter(Boolean);

        const validAdded: string[] = [];
        let invalidCount = 0;

        candidates.forEach((cand) => {
            if (EMAIL_REGEX.test(cand)) {
                if (!composeRecipients.includes(cand) && !validAdded.includes(cand)) {
                    validAdded.push(cand);
                }
            } else {
                invalidCount++;
            }
        });

        if (validAdded.length > 0) {
            setComposeRecipients((prev) => [...prev, ...validAdded]);
            setRecipientInput('');
            showToast(`${validAdded.length} alamat email berhasil ditambahkan!`);
        }

        if (invalidCount > 0) {
            showToast(`${invalidCount} teks diabaikan karena bukan format email valid`, 'warn');
        }
    };

    const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
            e.preventDefault();
            if (showSuggestions && filteredSuggestions.length > 0) {
                const picked = filteredSuggestions[selectedSuggestionIndex] || filteredSuggestions[0];
                addRecipientChip(picked.email);
            } else if (recipientInput.trim()) {
                addRecipientChip(recipientInput);
            }
        } else if (e.key === 'Backspace' && !recipientInput && composeRecipients.length > 0) {
            // Remove last chip on backspace
            setComposeRecipients((prev) => prev.slice(0, -1));
        } else if (e.key === 'ArrowDown' && showSuggestions) {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) => Math.min(prev + 1, filteredSuggestions.length - 1));
        } else if (e.key === 'ArrowUp' && showSuggestions) {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Filter contacts autocomplete
    const filteredSuggestions = useMemo(() => {
        if (!recipientInput.trim()) return [];
        const q = recipientInput.toLowerCase();
        return contacts
            .filter(
                (c) =>
                    !composeRecipients.includes(c.email) &&
                    (c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
            )
            .slice(0, 5);
    }, [recipientInput, contacts, composeRecipients]);

    // ==========================================
    // DRAFTS (SAVE, RESUME, DELETE)
    // ==========================================
    const handleSaveDraft = async (silently = false) => {
        if (composeRecipients.length === 0 && !composeSubject.trim() && !composeBody.trim()) {
            if (!silently) showToast('Draf kosong tidak dapat disimpan', 'warn');
            return;
        }

        setSavingDraft(true);
        try {
            const res = await fetch('/api/admin/mail/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentDraftId || undefined,
                    toRecipients: composeRecipients,
                    subject: composeSubject,
                    body: composeBody,
                    attachments: composeAttachments,
                }),
            });

            const data = await res.json<{ ok: boolean; draftId?: string }>();
            if (data.ok && data.draftId) {
                setCurrentDraftId(data.draftId);
                const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                setDraftSavedAt(now);
                if (!silently) showToast('Draf berhasil disimpan');

                // Refresh drafts list in background
                fetch('/api/admin/mail/drafts')
                    .then((r) => r.json<{ drafts: DraftItem[] }>())
                    .then((d) => setDrafts(d.drafts || []));
            }
        } catch {
            if (!silently) showToast('Gagal menyimpan draf', 'err');
        } finally {
            setSavingDraft(false);
        }
    };

    const handleOpenDraft = (draft: DraftItem) => {
        setCurrentDraftId(draft.id);
        setComposeRecipients(draft.to_recipients || []);
        setComposeSubject(draft.subject || '');
        setComposeBody(draft.body || '');
        setComposeAttachments(draft.attachments || []);
        setIsComposeOpen(true);
    };

    const handleDeleteDraft = async (e: React.MouseEvent, draftId: string) => {
        e.stopPropagation();
        try {
            await fetch(`/api/admin/mail/drafts/${draftId}`, { method: 'DELETE' });
            setDrafts((prev) => prev.filter((d) => d.id !== draftId));
            showToast('Draf berhasil dihapus');
        } catch {
            showToast('Gagal menghapus draf', 'err');
        }
    };

    const resetComposeState = () => {
        setComposeRecipients([]);
        setRecipientInput('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        setCurrentDraftId(null);
        setDraftSavedAt(null);
        setIsComposeOpen(false);
    };

    // Close compose with prompt if unsaved
    const handleCloseCompose = () => {
        if (composeRecipients.length > 0 || composeSubject.trim() || composeBody.trim()) {
            if (confirm('Simpan pesan ini ke Draf sebelum menutup?')) {
                handleSaveDraft(true).then(() => resetComposeState());
                return;
            }
        }
        resetComposeState();
    };

    // Send Composed Email
    const handleSendCompose = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // If there's pending text in recipient input, attempt to add it
        if (recipientInput.trim()) {
            addRecipientChip(recipientInput);
        }

        const effectiveRecipients = [...composeRecipients];
        if (recipientInput.trim() && EMAIL_REGEX.test(recipientInput.trim()) && !effectiveRecipients.includes(recipientInput.trim())) {
            effectiveRecipients.push(recipientInput.trim());
        }

        if (effectiveRecipients.length === 0) {
            showToast('Masukkan minimal satu alamat email penerima', 'err');
            recipientInputRef.current?.focus();
            return;
        }

        if (!composeSubject.trim() || !composeBody.trim()) {
            showToast('Subjek dan isi pesan wajib diisi', 'err');
            return;
        }

        setSendingCompose(true);
        try {
            const res = await fetch('/api/admin/mail/compose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: effectiveRecipients,
                    subject: composeSubject.trim(),
                    body: composeBody.trim(),
                    attachments: composeAttachments,
                    draftId: currentDraftId || undefined,
                }),
            });

            const data = await res.json<{ ok: boolean; email?: EmailItem; error?: string }>();
            if (!res.ok) throw new Error(data.error || 'Gagal mengirim email');

            showToast('Email berhasil dikirim ke ' + effectiveRecipients.length + ' penerima!');
            if (data.email) {
                setSentEmails((prev) => [data.email!, ...prev]);
            }

            // Remove draft from state if was draft
            if (currentDraftId) {
                setDrafts((prev) => prev.filter((d) => d.id !== currentDraftId));
            }

            resetComposeState();
            fetchAllData(true);
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
                const updatedReplies = [...(selectedEmail.replies || []), data.reply];
                setSelectedEmail({
                    ...selectedEmail,
                    replies: updatedReplies,
                    replies_count: updatedReplies.length,
                });
                setEmails((prev) =>
                    prev.map((item) =>
                        item.id === selectedEmail.id
                            ? { ...item, replies: updatedReplies, replies_count: updatedReplies.length }
                            : item
                    )
                );
            }
        } catch (err: any) {
            showToast(err.message || 'Gagal mengirim email balasan', 'err');
        } finally {
            setSendingReply(false);
        }
    };

    // ==========================================
    // FILTERED LIST COMPUTATION
    // ==========================================
    let activeSourceList: EmailItem[] = [];
    if (folder === 'inbox' || folder === 'unread' || folder === 'starred') {
        activeSourceList = emails;
    } else if (folder === 'sent') {
        activeSourceList = sentEmails;
    } else if (folder === 'trash') {
        activeSourceList = trashEmails;
    }

    const filteredEmails = activeSourceList.filter((item) => {
        // Folder level filter
        if (folder === 'unread' && item.is_read) return false;
        if (folder === 'starred' && !item.is_starred) return false;

        // Quick Filter Pills
        if (quickFilter === 'starred' && !item.is_starred) return false;
        if (quickFilter === 'replied') {
            const hasReplies = (item.replies_count && item.replies_count > 0) || (item.replies && item.replies.length > 0);
            if (!hasReplies) return false;
        }
        if (quickFilter === 'has_attachment') {
            const atts = parseAttachments(item.attachments);
            if (atts.length === 0) return false;
        }

        // Search Query
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
    const starredCount = emails.filter((e) => e.is_starred).length;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none sm:select-auto">
            {/* TOAST NOTIFICATION: Always highest z-index layer (z-[9999]) */}
            {toast && (
                <div
                    className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-2xl border flex items-center gap-2 max-w-[90vw] transition-all animate-in fade-in slide-in-from-bottom-2 ${
                        toast.type === 'ok'
                            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
                            : toast.type === 'warn'
                            ? 'bg-amber-950/95 border-amber-500/40 text-amber-200'
                            : 'bg-red-950/95 border-red-500/40 text-red-200'
                    }`}
                >
                    {toast.type === 'ok' ? (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : toast.type === 'warn' ? (
                        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    ) : (
                        <AlertCircle size={16} className="text-red-400 shrink-0" />
                    )}
                    <span className="truncate">{toast.msg}</span>
                </div>
            )}

            {/* Topbar: Hidden on mobile when email detail is open */}
            <header
                className={`h-14 border-b border-white/10 bg-neutral-950 px-4 sm:px-6 flex items-center justify-between shrink-0 ${
                    selectedEmail ? 'hidden md:flex' : 'flex'
                }`}
            >
                <div className="flex items-center gap-3">
                    <h1 className="font-semibold text-base sm:text-lg text-white tracking-tight">KSJ Webmail</h1>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => fetchAllData()}
                        disabled={refreshing}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
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
                {/* Left Sidebar (Desktop) */}
                <aside className="w-56 bg-neutral-950 border-r border-white/10 p-3 hidden md:flex flex-col shrink-0">
                    <button
                        onClick={() => {
                            resetComposeState();
                            setIsComposeOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors mb-3 shadow-md"
                    >
                        <PenSquare size={15} />
                        <span>Tulis Pesan Baru</span>
                    </button>

                    <nav className="space-y-1">
                        {/* Inbox */}
                        <button
                            onClick={() => {
                                setFolder('inbox');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                folder === 'inbox'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Inbox size={15} className={folder === 'inbox' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Kotak Masuk</span>
                            </div>
                            {emails.length > 0 && (
                                <span className={`text-[11px] font-mono ${folder === 'inbox' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {emails.length}
                                </span>
                            )}
                        </button>

                        {/* Unread */}
                        <button
                            onClick={() => {
                                setFolder('unread');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                folder === 'unread'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Mail size={15} className={folder === 'unread' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Belum Dibaca</span>
                            </div>
                            {unreadCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Starred */}
                        <button
                            onClick={() => {
                                setFolder('starred');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                folder === 'starred'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Star size={15} className={folder === 'starred' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Berbintang</span>
                            </div>
                            {starredCount > 0 && (
                                <span className={`text-[11px] font-mono ${folder === 'starred' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {starredCount}
                                </span>
                            )}
                        </button>

                        {/* Sent */}
                        <button
                            onClick={() => {
                                setFolder('sent');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                folder === 'sent'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <SendHorizonal size={15} className={folder === 'sent' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Terkirim</span>
                            </div>
                            {sentEmails.length > 0 && (
                                <span className={`text-[11px] font-mono ${folder === 'sent' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {sentEmails.length}
                                </span>
                            )}
                        </button>

                        {/* Drafts */}
                        <button
                            onClick={() => {
                                setFolder('drafts');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                folder === 'drafts'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <FileEdit size={15} className={folder === 'drafts' ? 'text-amber-400' : 'text-neutral-400'} />
                                <span>Draf</span>
                            </div>
                            {drafts.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-neutral-300 font-mono">
                                    {drafts.length}
                                </span>
                            )}
                        </button>

                        {/* Trash */}
                        <button
                            onClick={() => {
                                setFolder('trash');
                                setSelectedEmail(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                folder === 'trash'
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Trash2 size={15} className={folder === 'trash' ? 'text-red-400' : 'text-neutral-400'} />
                                <span>Sampah</span>
                            </div>
                            {trashEmails.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
                                    {trashEmails.length}
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
                                placeholder={`Cari di ${
                                    folder === 'inbox'
                                        ? 'kotak masuk'
                                        : folder === 'sent'
                                        ? 'pesan terkirim'
                                        : folder === 'drafts'
                                        ? 'draf pesan'
                                        : folder === 'trash'
                                        ? 'kotak sampah'
                                        : folder
                                }...`}
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
                    </div>

                    {/* Quick Filter Pills (Except in Drafts & Trash) */}
                    {folder !== 'drafts' && folder !== 'trash' && (
                        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-neutral-900/30 shrink-0">
                            <button
                                onClick={() => setQuickFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                                    quickFilter === 'all'
                                        ? 'bg-amber-500 text-neutral-950 font-bold'
                                        : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setQuickFilter('starred')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                                    quickFilter === 'starred'
                                        ? 'bg-amber-500 text-neutral-950 font-bold'
                                        : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                Berbintang
                            </button>
                            <button
                                onClick={() => setQuickFilter('replied')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                                    quickFilter === 'replied'
                                        ? 'bg-amber-500 text-neutral-950 font-bold'
                                        : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                Sudah Dibalas
                            </button>
                            <button
                                onClick={() => setQuickFilter('has_attachment')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                                    quickFilter === 'has_attachment'
                                        ? 'bg-amber-500 text-neutral-950 font-bold'
                                        : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                Lampiran
                            </button>
                        </div>
                    )}

                    {/* Trash Action Header: Empty Trash Button */}
                    {folder === 'trash' && trashEmails.length > 0 && (
                        <div className="px-3 py-2 border-b border-red-500/20 bg-red-950/20 flex items-center justify-between shrink-0 text-xs">
                            <span className="text-neutral-400 text-[11px]">{trashEmails.length} email di sampah</span>
                            <button
                                onClick={emptyTrash}
                                className="text-[11px] text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                            >
                                Kosongkan Sampah
                            </button>
                        </div>
                    )}

                    {/* LIST SECTION: Drafts or Emails */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/5 pb-24 md:pb-0">
                        {loading ? (
                            <div className="p-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
                                <RefreshCw size={20} className="animate-spin text-amber-400" />
                                <span>Memuat data...</span>
                            </div>
                        ) : folder === 'drafts' ? (
                            /* DRAFTS LIST VIEW */
                            drafts.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileEdit size={36} className="mx-auto text-neutral-600 mb-2.5 stroke-[1.5]" />
                                    <p className="text-sm text-neutral-300 font-medium">Tidak ada draf tersimpan</p>
                                    <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                                        Pesan yang Anda simpan sebagai draf akan muncul di sini.
                                    </p>
                                </div>
                            ) : (
                                drafts.map((draft) => (
                                    <div
                                        key={draft.id}
                                        onClick={() => handleOpenDraft(draft)}
                                        className="p-3.5 sm:p-3 cursor-pointer transition-colors relative flex items-start gap-3 border-b border-white/[0.04] hover:bg-white/[0.03] active:bg-white/[0.05]"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                            <FileEdit size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-xs font-semibold text-amber-400 truncate">
                                                    Draf: {draft.to_recipients?.length > 0 ? draft.to_recipients.join(', ') : '(Tanpa Penerima)'}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                                                    {formatDate(draft.updated_at)}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-neutral-200 truncate mb-1">
                                                {draft.subject || '(Tanpa Subjek)'}
                                            </div>
                                            <p className="text-[11px] text-neutral-500 line-clamp-1 leading-relaxed">
                                                {draft.body || '(Draf kosong)'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteDraft(e, draft.id)}
                                            className="p-1.5 text-neutral-500 hover:text-red-400 active:scale-90 transition-all ml-1 shrink-0"
                                            title="Hapus Draf"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )
                        ) : filteredEmails.length === 0 ? (
                            <div className="p-12 text-center">
                                <Inbox size={36} className="mx-auto text-neutral-600 mb-2.5 stroke-[1.5]" />
                                <p className="text-sm text-neutral-300 font-medium">Kotak surat kosong</p>
                                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                                    {searchQuery ? 'Tidak ada pesan yang sesuai kata kunci.' : 'Tidak ada pesan dalam kategori ini.'}
                                </p>
                            </div>
                        ) : (
                            filteredEmails.map((email) => {
                                const isSelected = selectedEmail?.id === email.id;
                                const atts = parseAttachments(email.attachments);
                                const hasAttachments = atts.length > 0;
                                const isUnread = folder !== 'sent' && folder !== 'trash' && !email.is_read;
                                const senderDisplay =
                                    folder === 'sent' ? `Kepada: ${email.to_email}` : email.from_name || email.from_email;
                                const initial = (email.from_name || email.from_email || 'K').charAt(0).toUpperCase();
                                const isReplied =
                                    (email.replies_count && email.replies_count > 0) ||
                                    (email.replies && email.replies.length > 0);

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
                                        {/* Avatar */}
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                                                isUnread
                                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                                    : 'bg-neutral-900 border-white/5 text-neutral-400'
                                            }`}
                                        >
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

                                            {/* Badges: Replied & Attachments */}
                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                {isReplied && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                        <CornerUpLeft size={10} />
                                                        <span>Dibalas</span>
                                                    </span>
                                                )}

                                                {hasAttachments && (
                                                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                        <Paperclip size={10} className="text-amber-400" />
                                                        <span>{atts.length} lampiran</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Star button */}
                                        {folder !== 'trash' && (
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
                {!selectedEmail && folder !== 'drafts' && (
                    <button
                        onClick={() => {
                            resetComposeState();
                            setIsComposeOpen(true);
                        }}
                        className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
                        aria-label="Tulis Pesan Baru"
                    >
                        <PenSquare size={17} />
                        <span>Tulis</span>
                    </button>
                )}

                {/* Mobile Bottom Navigation Bar (Shown on list view) */}
                {!selectedEmail && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/95 backdrop-blur-lg border-t border-white/10 px-1.5 py-1.5 flex items-center justify-around pb-safe">
                        <button
                            onClick={() => {
                                setFolder('inbox');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[54px] transition-all relative ${
                                folder === 'inbox' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <Inbox size={17} />
                            <span className="text-[10px] mt-0.5">Masuk</span>
                            {emails.length > 0 && (
                                <span className="text-[9px] px-1 bg-white/10 rounded-full text-neutral-300 absolute top-0.5 right-1">
                                    {emails.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFolder('unread');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[54px] transition-all relative ${
                                folder === 'unread' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <Mail size={17} />
                            <span className="text-[10px] mt-0.5">Belum Baca</span>
                            {unreadCount > 0 && (
                                <span className="text-[9px] px-1 bg-amber-500 text-neutral-950 font-bold rounded-full absolute top-0.5 right-1">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFolder('sent');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[54px] transition-all relative ${
                                folder === 'sent' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <SendHorizonal size={17} />
                            <span className="text-[10px] mt-0.5">Terkirim</span>
                        </button>

                        <button
                            onClick={() => {
                                setFolder('drafts');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[54px] transition-all relative ${
                                folder === 'drafts' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <FileEdit size={17} />
                            <span className="text-[10px] mt-0.5">Draf</span>
                            {drafts.length > 0 && (
                                <span className="text-[9px] px-1 bg-white/10 rounded-full text-neutral-300 absolute top-0.5 right-1">
                                    {drafts.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setFolder('trash');
                                setSelectedEmail(null);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[54px] transition-all relative ${
                                folder === 'trash' ? 'text-red-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            <Trash2 size={17} />
                            <span className="text-[10px] mt-0.5">Sampah</span>
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
                                    {folder === 'trash' ? (
                                        <>
                                            <button
                                                onClick={() => restoreEmail(selectedEmail.id, selectedEmail.origin || 'inbox')}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium active:scale-95 transition-all"
                                                title="Pulihkan Email"
                                            >
                                                <RotateCcw size={14} />
                                                <span>Pulihkan</span>
                                            </button>
                                            <button
                                                onClick={() => permanentDeleteEmail(selectedEmail.id, selectedEmail.origin || 'inbox')}
                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:scale-90 transition-all"
                                                title="Hapus Permanen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
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

                                            <button
                                                onClick={() => softDeleteEmail(selectedEmail.id, selectedEmail.origin)}
                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:scale-90 transition-all"
                                                title="Pindahkan ke Sampah"
                                                aria-label="Hapus Email"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Message Heading */}
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    {((selectedEmail.replies_count && selectedEmail.replies_count > 0) ||
                                        (selectedEmail.replies && selectedEmail.replies.length > 0)) && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            <CornerUpLeft size={11} />
                                            <span>Sudah Dibalas</span>
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">
                                    {selectedEmail.subject}
                                </h2>
                            </div>

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

                            {/* Quick Reply Form (Only if not in sent or trash) */}
                            {folder !== 'sent' && folder !== 'trash' && (
                                <form
                                    onSubmit={handleSendReply}
                                    className="p-3.5 sm:p-4 rounded-xl bg-neutral-900/60 border border-white/10 mt-auto"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 truncate">
                                            <CornerUpLeft size={14} className="text-amber-400 shrink-0" />
                                            <span className="truncate">
                                                Balas ke: <span className="text-white font-mono">{selectedEmail.from_email}</span>
                                            </span>
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

            {/* ======================================================== */}
            {/* COMPOSE / DRAFT MODAL: FULLSCREEN SHEET ON MOBILE        */}
            {/* ======================================================== */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
                    <div className="w-full h-full sm:h-auto max-w-2xl bg-neutral-950 border-0 sm:border sm:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between bg-neutral-950 shrink-0">
                            <button
                                type="button"
                                onClick={handleCloseCompose}
                                className="sm:hidden text-neutral-400 hover:text-white text-xs font-medium py-1 px-2 -ml-2 active:scale-95 transition-all"
                            >
                                Batal
                            </button>

                            <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                <PenSquare size={16} className="text-amber-400" />
                                <span>{currentDraftId ? 'Edit Draf Pesan' : 'Pesan Baru'}</span>
                                {draftSavedAt && (
                                    <span className="hidden sm:inline-block text-[11px] text-neutral-500 font-normal">
                                        (Draf tersimpan {draftSavedAt})
                                    </span>
                                )}
                            </div>

                            {/* Mobile Send & Save Buttons */}
                            <div className="flex items-center gap-1 sm:hidden">
                                <button
                                    type="button"
                                    onClick={() => handleSaveDraft(false)}
                                    disabled={savingDraft}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 active:scale-95 transition-all text-xs"
                                    title="Simpan Draf"
                                >
                                    <FileEdit size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSendCompose()}
                                    disabled={sendingCompose || uploadingComposeFile}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {sendingCompose ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                                    <span>Kirim</span>
                                </button>
                            </div>

                            {/* Desktop Close */}
                            <button
                                onClick={handleCloseCompose}
                                className="hidden sm:block p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleSendCompose} className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto">
                            {/* Dari (From) */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">Dari</label>
                                <input
                                    type="text"
                                    value="mail@kampungsilatjampang.id"
                                    disabled
                                    className="w-full bg-neutral-900/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-neutral-400 font-mono"
                                />
                            </div>

                            {/* Kepada (Multi-Recipient Tag/Chip Input + Paste Support + Autocomplete) */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-neutral-400">
                                        Kepada <span className="text-amber-400">*</span>
                                    </label>
                                    <span className="text-[10px] text-neutral-500">
                                        Bisa paste banyak email (koma/spasi/baris baru)
                                    </span>
                                </div>

                                <div className="min-h-[44px] p-2 bg-neutral-900 border border-white/10 rounded-xl focus-within:border-amber-500/50 flex flex-wrap items-center gap-1.5 transition-colors">
                                    {/* Recipient Chips */}
                                    {composeRecipients.map((rec) => (
                                        <span
                                            key={rec}
                                            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono"
                                        >
                                            <span>{rec}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeRecipientChip(rec)}
                                                className="p-0.5 hover:text-red-400 rounded transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}

                                    {/* Text Input for Typing / Pasting */}
                                    <input
                                        ref={recipientInputRef}
                                        type="text"
                                        placeholder={composeRecipients.length === 0 ? 'Ketik nama / email atau paste massal...' : ''}
                                        value={recipientInput}
                                        onChange={(e) => {
                                            setRecipientInput(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                                        onKeyDown={handleRecipientKeyDown}
                                        onPaste={handleRecipientPaste}
                                        className="flex-1 min-w-[140px] bg-transparent text-[15px] sm:text-xs text-white placeholder-neutral-500 focus:outline-none py-1 px-1"
                                    />
                                </div>

                                {/* Autocomplete Suggestions Dropdown */}
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-neutral-900 border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1">
                                        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                            Saran Kontak
                                        </div>
                                        {filteredSuggestions.map((item, idx) => (
                                            <div
                                                key={item.email}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    addRecipientChip(item.email);
                                                }}
                                                className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                                    idx === selectedSuggestionIndex ? 'bg-amber-500/20 text-white' : 'hover:bg-white/5 text-neutral-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-amber-400">
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-white truncate">{item.name}</span>
                                                    <span className="text-[11px] text-neutral-400 font-mono truncate">&lt;{item.email}&gt;</span>
                                                </div>
                                                <span className="text-[10px] text-amber-400 shrink-0 font-medium">+ Tambah</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Subjek (Subject) */}
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

                            {/* Isi Pesan (Body) */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">
                                    Isi Pesan <span className="text-amber-400">*</span>
                                </label>
                                <textarea
                                    rows={7}
                                    required
                                    placeholder="Tuliskan pesan Anda di sini..."
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 text-[15px] sm:text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                                />
                            </div>

                            {/* Lampiran File (Attachments) */}
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

                            {/* Desktop Footer Actions */}
                            <div className="hidden sm:flex pt-3 border-t border-white/10 items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSaveDraft(false)}
                                        disabled={savingDraft}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs font-medium active:scale-95 transition-all"
                                    >
                                        <FileEdit size={13} className="text-amber-400" />
                                        <span>{savingDraft ? 'Menyimpan...' : 'Simpan Draf'}</span>
                                    </button>
                                    {draftSavedAt && (
                                        <span className="text-[11px] text-neutral-500">
                                            Tersimpan jam {draftSavedAt}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseCompose}
                                        className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white text-xs font-medium hover:bg-white/5 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingCompose || uploadingComposeFile}
                                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors disabled:opacity-50 active:scale-95 shadow-md"
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
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
