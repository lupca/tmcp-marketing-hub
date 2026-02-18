export const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'blog', 'email'] as const;

export const PLATFORM_COLORS: Record<string, string> = {
    facebook: 'bg-blue-100 text-blue-800',
    twitter: 'bg-sky-100 text-sky-800',
    linkedin: 'bg-indigo-100 text-indigo-800',
    instagram: 'bg-pink-100 text-pink-800',
    tiktok: 'bg-gray-800 text-white',
    youtube: 'bg-red-100 text-red-800',
    blog: 'bg-orange-100 text-orange-800',
    email: 'bg-purple-100 text-purple-800',
};

export const APPROVAL_BADGE: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    revision_needed: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const PUBLISH_STATUS_BADGE: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-600 border-gray-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    published: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Sort Options ────────────────────────────────────────────────────────────

export type SortOption = {
    value: string;
    label: string;
    icon: string; // emoji shorthand
};

export const SORT_OPTIONS: SortOption[] = [
    { value: 'newest',         label: 'Newest first',          icon: '🕐' },
    { value: 'oldest',         label: 'Oldest first',          icon: '🕐' },
    { value: 'updated',        label: 'Recently updated',      icon: '✏️' },
    { value: 'most-variants',  label: 'Most variants',         icon: '📊' },
    { value: 'least-variants', label: 'Least variants',        icon: '📊' },
    { value: 'alpha-asc',      label: 'A → Z',                 icon: '🔤' },
    { value: 'alpha-desc',     label: 'Z → A',                 icon: '🔤' },
    { value: 'pending-first',  label: 'Pending first',         icon: '⏳' },
    { value: 'approved-first', label: 'Approved first',        icon: '✅' },
];

export const APPROVAL_SORT_ORDER: Record<string, number> = {
    pending: 0,
    revision_needed: 1,
    approved: 2,
    rejected: 3,
};
