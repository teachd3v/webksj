export { metadata, viewport } from 'next-sanity/studio';
export const dynamic = 'force-static';

import Studio from './Studio';

export default function StudioPage() {
    return <Studio />;
}
