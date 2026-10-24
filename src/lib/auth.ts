export async function sha256Hex(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export function getCookie(cookieHeader: string | null | undefined, name: string): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function verifyAdminSession(db: D1Database | null, cookieHeader: string | null | undefined) {
    if (!db) return null;
    const token = getCookie(cookieHeader, 'ksj_session');
    if (!token) return null;

    const now = Math.floor(Date.now() / 1000);
    const row = await db
        .prepare(
            `SELECT u.id, u.email, u.name, COALESCE(u.role, 'cms') as role, s.expires_at
             FROM admin_sessions s
             JOIN admin_users u ON u.id = s.user_id
             WHERE s.token = ? AND s.expires_at > ?
             LIMIT 1`
        )
        .bind(token, now)
        .first<{ id: string; email: string; name: string; role: string; expires_at: number }>();

    return row || null;
}
