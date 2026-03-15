import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../test/utils';
import pb from '../lib/pocketbase';
import MediaAssetsPage from './MediaAssetsPage';

vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => ({
            user: { id: 'test-user', email: 'test@example.com' },
            isAuthenticated: true,
            isLoading: false,
        }),
    };
});

vi.mock('../contexts/WorkspaceContext', async () => {
    const actual = await vi.importActual('../contexts/WorkspaceContext');
    return {
        ...actual,
        useWorkspace: () => ({
            workspaces: [{ id: 'ws-1', name: 'Test WS' }],
            currentWorkspace: { id: 'ws-1', name: 'Test WS' },
            isLoading: false,
        }),
    };
});

const mockAsset = {
    id: 'asset-1',
    collectionId: 'pbc_media_assets',
    collectionName: 'media_assets',
    created: '2026-03-10 10:00:00.000Z',
    updated: '2026-03-10 10:00:00.000Z',
    workspace_id: 'ws-1',
    file: 'hero.jpg',
    file_type: 'image',
    aspect_ratio: '16:9',
    tags: ['banner', 'social'],
} as const;

describe('MediaAssetsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads and displays media assets', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        mediaCollection.getList.mockResolvedValue({ items: [mockAsset] });

        render(<MediaAssetsPage />);

        await waitFor(() => {
            expect(screen.getByText('hero.jpg')).toBeInTheDocument();
            expect(screen.getByText('16:9')).toBeInTheDocument();
        });

        expect(mediaCollection.getList).toHaveBeenCalledWith(
            1,
            200,
            expect.objectContaining({
                filter: 'workspace_id = "ws-1"',
            }),
        );
    });

    it('creates media asset with file upload', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        mediaCollection.getList.mockResolvedValue({ items: [] });

        render(<MediaAssetsPage />);

        fireEvent.click(screen.getByText('New Asset'));

        const file = new File(['binary'], 'new-banner.png', { type: 'image/png' });
        fireEvent.change(screen.getByLabelText('File *'), { target: { files: [file] } });
        fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'new, launch' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(mediaCollection.create).toHaveBeenCalledTimes(1);
        });

        const payload = mediaCollection.create.mock.calls[0][0] as FormData;
        expect(payload).toBeInstanceOf(FormData);
        expect(payload.get('workspace_id')).toBe('ws-1');
        expect(payload.get('file_type')).toBe('image');
        expect(payload.get('tags')).toBe('["new","launch"]');
        expect(payload.get('file')).toBe(file);
    });

    it('updates media asset metadata', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        mediaCollection.getList.mockResolvedValue({ items: [mockAsset] });

        render(<MediaAssetsPage />);

        await waitFor(() => {
            expect(screen.getByText('hero.jpg')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle('Edit'));
        fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'updated' } });
        fireEvent.change(screen.getByLabelText('Aspect Ratio'), { target: { value: '1:1' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(mediaCollection.update).toHaveBeenCalledWith(
                'asset-1',
                expect.objectContaining({
                    file_type: 'image',
                    aspect_ratio: '1:1',
                    tags: ['updated'],
                }),
            );
        });
    });

    it('cleans references before deleting media asset', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        const brandCollection = pb.collection('brand_identities') as any;
        const customerCollection = pb.collection('customer_personas') as any;
        const masterCollection = pb.collection('master_contents') as any;
        const variantCollection = pb.collection('platform_variants') as any;
        const sharedGetFullList = brandCollection.getFullList;

        const deleteAsset = { ...mockAsset };
        mediaCollection.getList
            .mockResolvedValueOnce({ items: [deleteAsset] })
            .mockResolvedValueOnce({ items: [] });
        sharedGetFullList
            .mockResolvedValueOnce([{ id: 'brand-1', logo: 'asset-1' }])
            .mockResolvedValueOnce([{ id: 'customer-1', avatar: 'asset-1' }])
            .mockResolvedValueOnce([{ id: 'mc-1', primaryMediaIds: ['asset-1', 'other'] }])
            .mockResolvedValueOnce([{ id: 'pv-1', platformMediaIds: ['asset-1'] }])
            .mockResolvedValueOnce([{ id: 'brand-1', logo: 'asset-1' }])
            .mockResolvedValueOnce([{ id: 'customer-1', avatar: 'asset-1' }])
            .mockResolvedValueOnce([{ id: 'mc-1', primaryMediaIds: ['asset-1', 'other'] }])
            .mockResolvedValueOnce([{ id: 'pv-1', platformMediaIds: ['asset-1'] }]);

        render(<MediaAssetsPage />);

        await waitFor(() => {
            expect(screen.getByTitle('Delete')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle('Delete'));

        await waitFor(() => {
            expect(screen.getByText('Delete Media Asset', { selector: 'h2' })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete Asset'));

        await waitFor(() => {
            expect(mediaCollection.delete).toHaveBeenCalledWith('asset-1');
        });

        const updateCalls = [
            ...brandCollection.update.mock.calls,
            ...customerCollection.update.mock.calls,
            ...masterCollection.update.mock.calls,
            ...variantCollection.update.mock.calls,
        ];
        expect(updateCalls).toEqual(
            expect.arrayContaining([
                expect.arrayContaining([expect.any(String), { logo: null }]),
                expect.arrayContaining([expect.any(String), { avatar: null }]),
                expect.arrayContaining([expect.any(String), { primaryMediaIds: expect.any(Array) }]),
                expect.arrayContaining([expect.any(String), { platformMediaIds: expect.any(Array) }]),
            ]),
        );
    });

    it('filters assets by type and search', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        mediaCollection.getList.mockResolvedValue({
            items: [
                mockAsset,
                {
                    ...mockAsset,
                    id: 'asset-2',
                    file: 'walkthrough.mp4',
                    file_type: 'video',
                    tags: ['demo'],
                },
            ],
        });

        render(<MediaAssetsPage />);

        await waitFor(() => {
            expect(screen.getByText('hero.jpg')).toBeInTheDocument();
            expect(screen.getByText('walkthrough.mp4')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Filter by type'), { target: { value: 'video' } });
        expect(screen.queryByText('hero.jpg')).not.toBeInTheDocument();
        expect(screen.getByText('walkthrough.mp4')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Search file/tags...'), { target: { value: 'demo' } });
        expect(screen.getByText('walkthrough.mp4')).toBeInTheDocument();
    });

    it('supports pagination controls', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        const manyAssets = Array.from({ length: 13 }).map((_, index) => ({
            ...mockAsset,
            id: `asset-${index}`,
            file: `asset-${index}.png`,
            updated: `2026-03-${String(index + 1).padStart(2, '0')} 00:00:00.000Z`,
        }));
        mediaCollection.getList.mockResolvedValue({ items: manyAssets, totalPages: 1 });

        render(<MediaAssetsPage />);

        await waitFor(() => {
            expect(screen.getByText(/Page 1 \/ 2/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Next'));
        expect(screen.getByText(/Page 2 \/ 2/)).toBeInTheDocument();
    });

    it('bulk deletes selected assets', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        mediaCollection.getList
            .mockResolvedValueOnce({
                items: [
                    mockAsset,
                    { ...mockAsset, id: 'asset-2', file: 'two.png' },
                ],
                totalPages: 1,
            })
            .mockResolvedValue({ items: [], totalPages: 1 });

        render(<MediaAssetsPage />);

        await waitFor(() => {
            expect(screen.getByText('hero.jpg')).toBeInTheDocument();
            expect(screen.getByText('two.png')).toBeInTheDocument();
        });

        const selectButtons = screen.getAllByTitle('Select asset');
        fireEvent.click(selectButtons[0]);
        fireEvent.click(selectButtons[1]);

        fireEvent.click(screen.getByText(/Delete Selected \(2\)/));
        await waitFor(() => {
            expect(screen.getByText('Delete 2 Media Assets', { selector: 'h2' })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Delete 2 Assets'));

        await waitFor(() => {
            expect(mediaCollection.delete).toHaveBeenCalledTimes(2);
        });
    });
});
