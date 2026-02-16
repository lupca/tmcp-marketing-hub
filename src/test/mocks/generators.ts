import {
    Workspace,
    Worksheet,
    BrandIdentity,
    CustomerPersona,
    InspirationEvent,
} from '../../models/schema';

// Helper for generating random IDs resembling PocketBase IDs (15 chars)
export const generateId = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper for random date
export const generateDate = (startObj: Date = new Date(2023, 0, 1), endObj: Date = new Date()): string => {
    const start = startObj.getTime();
    const end = endObj.getTime();
    const date = new Date(start + Math.random() * (end - start));
    return date.toISOString().replace('T', ' ').substring(0, 19);
};

// Helper to pick random item from array
export const pickRandom = <T>(arr: readonly T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

// Helper to pick multiple random items from array
export const pickRandomMultiple = <T>(arr: readonly T[], count: number = 2): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Mock Data Source
const mockData = {
    workspaceNames: ['Alpha Marketing', 'Beta Creative', 'Gamma Strategies', 'Delta Digital'],
    brandNames: ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp'],
    personaNames: ['Tech Savvy Millennial', 'Budget Conscious Parent', 'Luxury Shopper', 'Enterprise Decision Maker'],
    eventTitles: ['Summer Sale', 'Black Friday Push', 'Product Launch 2024', 'Rebranding Campaign'],
    worksheetTitles: ['Q1 Strategy Planning', 'Social Media revamp', 'Email Drip Campaign Ideation', 'Competitor Analysis'],
    campaignTypes: ['awareness', 'conversion', 'retargeting', 'newsletter', 'social_series'] as const,
    statuses: ['draft', 'processing', 'completed', 'archived'] as const,
};

// Factory Functions

export const createMockWorkspace = (overrides?: Partial<Workspace>): Workspace => {
    const id = generateId();
    const created = generateDate();
    return {
        id,
        created,
        updated: created,
        collectionId: 'pbc_workspaces',
        collectionName: 'workspaces',
        name: pickRandom(mockData.workspaceNames),
        owner_id: generateId(), // Random user
        members: [generateId()],
        settings: {},
        ...overrides
    };
};

export const createMockBrandIdentity = (workspaceId: string, overrides?: Partial<BrandIdentity>): BrandIdentity => {
    const id = generateId();
    const created = generateDate();
    return {
        id,
        created,
        updated: created,
        collectionId: 'pbc_brand_identities',
        collectionName: 'brand_identities',
        workspace_id: workspaceId,
        name: pickRandom(mockData.brandNames),
        voice_tone: 'Professional, Friendly, Innovative',
        mission_statement: 'To revolutionize the industry with cutting-edge solutions.',
        target_audience_summary: 'Professionals aged 25-45 in the tech sector.',
        colors: { primary: '#007bff', secondary: '#6c757d' },
        typography: { heading: 'Inter', body: 'Roboto' },
        ...overrides
    };
};

export const createMockCustomerPersona = (workspaceId: string, overrides?: Partial<CustomerPersona>): CustomerPersona => {
    const id = generateId();
    const created = generateDate();
    return {
        id,
        created,
        updated: created,
        collectionId: 'pbc_customer_personas',
        collectionName: 'customer_personas',
        workspace_id: workspaceId,
        name: pickRandom(mockData.personaNames),
        demographics: { age: '25-34', gender: 'All', location: 'Urban Areas' },
        psychographics: { interests: ['Tech', 'Design', 'Sustainability'] },
        pain_points: 'Lack of time, expensive alternatives, poor support',
        goals: 'Improve efficiency, reduce costs, scale operations',
        buying_behavior: 'Researches thoroughly, values peer reviews',
        ...overrides
    };
};

export const createMockInspirationEvent = (workspaceId: string, overrides?: Partial<InspirationEvent>): InspirationEvent => {
    const id = generateId();
    const created = generateDate();
    return {
        id,
        created,
        updated: created,
        collectionId: 'pbc_inspiration_events',
        collectionName: 'inspiration_events',
        workspace_id: workspaceId,
        title: pickRandom(mockData.eventTitles),
        event_date: generateDate(new Date(), new Date(2025, 11, 31)),
        description: 'An upcoming event that requires marketing focus.',
        tags: 'promotion, seasonal',
        is_recurring: false,
        ...overrides,
    };
};

export const createMockWorksheet = (
    workspaceId: string,
    brandRefs: string[] = [],
    customerRefs: string[] = [],
    eventId?: string,
    overrides?: Partial<Worksheet>
): Worksheet => {
    const id = generateId();
    const created = generateDate();
    return {
        id,
        created,
        updated: created,
        collectionId: 'pbc_worksheets',
        collectionName: 'worksheets',
        workspace_id: workspaceId,
        title: pickRandom(mockData.worksheetTitles),
        event_id: eventId,
        brandRefs: brandRefs,
        customerRefs: customerRefs,
        status: pickRandom(mockData.statuses),
        agent_context: { focus: 'Copywriting', tone: 'Exciting' },
        ...overrides
    };
};

/**
 * Generates a comprehensive mock dataset for a workspace.
 * This ensures referential integrity between the generated items.
 */
export const generateMockWorkspaceData = () => {
    const workspace = createMockWorkspace();

    // Generate related assets
    const brands = Array.from({ length: 3 }, () => createMockBrandIdentity(workspace.id));
    const personas = Array.from({ length: 4 }, () => createMockCustomerPersona(workspace.id));
    const events = Array.from({ length: 2 }, () => createMockInspirationEvent(workspace.id));

    // Generate Worksheets linking to above assets
    const worksheets = Array.from({ length: 5 }, () => {
        const brandIds = pickRandomMultiple(brands, 1).map(b => b.id);
        const personaIds = pickRandomMultiple(personas, 2).map(p => p.id);
        const eventId = Math.random() > 0.5 ? pickRandom(events).id : undefined;

        return createMockWorksheet(workspace.id, brandIds, personaIds, eventId);
    });

    return {
        workspace,
        brands,
        personas,
        events,
        worksheets
    };
};
