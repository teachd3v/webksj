import { client } from './client';

export async function sanityFetch<T>({
    query,
    params = {},
}: {
    query: string;
    params?: Record<string, unknown>;
}): Promise<T> {
    try {
        return await client.fetch<T>(query, params);
    } catch (error) {
        console.error('Error fetching data from Sanity:', error);
        return null as T;
    }
}
