import { APPROVAL_SORT_ORDER } from '../constants/platforms';

export const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

export const truncate = (text: string, max = 120): string => {
    const plain = stripHtml(text);
    return plain.length > max ? plain.slice(0, max) + '...' : plain;
};

export const convertScheduledAtToISO = (scheduled_at: string): string | null => {
    if (!scheduled_at) return null;
    // Input is 'YYYY-MM-DDTHH:mm' (datetime-local), convert to ISO
    const dt = new Date(scheduled_at);
    if (!isNaN(dt.getTime())) return dt.toISOString();
    return null;
};

export const parseDate = (dateStr: string | Date | null | undefined): Date => {
    if (!dateStr) return new Date(0);
    const dt = new Date(dateStr);
    return isNaN(dt.getTime()) ? new Date(0) : dt;
};

export const sortByCreatedDesc = <T extends { created: any }>(items: T[]): T[] => {
    return [...items].sort((a, b) =>
        parseDate(b.created).getTime() - parseDate(a.created).getTime()
    );
};

/**
 * Sort master contents by selected option.
 * variantCounts: Map<master_content_id, number_of_variants>
 */
export const sortMasterContents = <T extends { created: any; updated?: any; core_message?: string; approval_status?: string; id: string }>(
    items: T[],
    sortBy: string,
    variantCounts: Map<string, number>,
): T[] => {
    const arr = [...items];

    switch (sortBy) {
        case 'newest':
            return arr.sort((a, b) => parseDate(b.created).getTime() - parseDate(a.created).getTime());
        case 'oldest':
            return arr.sort((a, b) => parseDate(a.created).getTime() - parseDate(b.created).getTime());
        case 'updated':
            return arr.sort((a, b) => parseDate(b.updated || b.created).getTime() - parseDate(a.updated || a.created).getTime());
        case 'most-variants':
            return arr.sort((a, b) => (variantCounts.get(b.id) || 0) - (variantCounts.get(a.id) || 0));
        case 'least-variants':
            return arr.sort((a, b) => (variantCounts.get(a.id) || 0) - (variantCounts.get(b.id) || 0));
        case 'alpha-asc':
            return arr.sort((a, b) => stripHtml(a.core_message || '').localeCompare(stripHtml(b.core_message || '')));
        case 'alpha-desc':
            return arr.sort((a, b) => stripHtml(b.core_message || '').localeCompare(stripHtml(a.core_message || '')));
        case 'pending-first':
            return arr.sort((a, b) => (APPROVAL_SORT_ORDER[a.approval_status || 'pending'] ?? 9) - (APPROVAL_SORT_ORDER[b.approval_status || 'pending'] ?? 9));
        case 'approved-first':
            return arr.sort((a, b) => {
                const orderA = a.approval_status === 'approved' ? 0 : 1;
                const orderB = b.approval_status === 'approved' ? 0 : 1;
                return orderA - orderB || parseDate(b.created).getTime() - parseDate(a.created).getTime();
            });
        default:
            return arr.sort((a, b) => parseDate(b.created).getTime() - parseDate(a.created).getTime());
    }
};
