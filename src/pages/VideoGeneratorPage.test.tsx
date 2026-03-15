import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../test/utils';
import pb from '../lib/pocketbase';
import VideoGeneratorPage from './VideoGeneratorPage';

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

const mockJob = {
    id: 'job-1',
    collectionId: 'videojobs00000',
    collectionName: 'video_jobs',
    created: '2026-03-10 10:00:00.000Z',
    updated: '2026-03-10 10:00:00.000Z',
    workspace_id: 'ws-1',
    status: 'queued',
    priority: 5,
    input_json: {},
    input_images: [],
    progress: 0,
    attempt_count: 0,
    max_attempts: 3,
    variant_name: 'A',
} as const;

describe('VideoGeneratorPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const digestMock = vi.fn().mockResolvedValue(new Uint8Array(32).buffer);
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: { subtle: { digest: digestMock } },
        });
    });

    it('loads jobs using workspace filter and -id sorting', async () => {
        const videoCollection = pb.collection('video_jobs') as any;
        videoCollection.getList.mockResolvedValue({ items: [mockJob] });
        videoCollection.subscribe.mockResolvedValue(() => {});

        render(<VideoGeneratorPage />);

        await waitFor(() => {
            expect(screen.getByText('Video Generator')).toBeInTheDocument();
            expect(screen.getByText('queued')).toBeInTheDocument();
        });

        expect(videoCollection.getList).toHaveBeenCalledWith(
            1,
            50,
            expect.objectContaining({
                filter: "workspace_id='ws-1'",
                sort: '-id',
            }),
        );
    });

    it('creates job with 2 products and idempotency key', async () => {
        const videoCollection = pb.collection('video_jobs') as any;
        videoCollection.getList.mockResolvedValue({ items: [] });
        videoCollection.subscribe.mockResolvedValue(() => {});
        videoCollection.create.mockResolvedValue({ id: 'job-created' });

        render(<VideoGeneratorPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Tạo Video' }));

        fireEvent.change(screen.getByPlaceholderText('VD: Top sản phẩm bán chạy tháng 6'), {
            target: { value: 'Top sản phẩm hôm nay' },
        });
        fireEvent.change(screen.getByPlaceholderText('VD: Mua ngay hôm nay!'), {
            target: { value: 'Mua ngay!' },
        });

        const productNameInputs = screen.getAllByPlaceholderText('Tên sản phẩm');
        fireEvent.change(productNameInputs[0], { target: { value: 'Sản phẩm 1' } });
        fireEvent.change(productNameInputs[1], { target: { value: 'Sản phẩm 2' } });

        const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
        const file1 = new File(['f1'], 'p1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['f2'], 'p2.jpg', { type: 'image/jpeg' });
        fireEvent.change(fileInputs[0], { target: { files: [file1] } });
        fireEvent.change(fileInputs[1], { target: { files: [file2] } });

        const submitButtons = screen.getAllByRole('button', { name: 'Tạo Video' });
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(videoCollection.create).toHaveBeenCalledTimes(1);
        });

        const payload = videoCollection.create.mock.calls[0][0] as FormData;
        expect(payload).toBeInstanceOf(FormData);
        expect(payload.get('workspace_id')).toBe('ws-1');
        expect(payload.get('status')).toBe('queued');
        expect(payload.get('variant_name')).toBe('A');
        expect(payload.get('idempotency_key')).toBe('0000000000000000000000000000000000000000000000000000000000000000');
        expect(payload.getAll('input_images')).toHaveLength(2);

        const inputJson = JSON.parse(String(payload.get('input_json')));
        expect(inputJson.products).toHaveLength(2);
        expect(inputJson.products[0].image).toBe('p1.jpg');
        expect(inputJson.products[1].image).toBe('p2.jpg');
    });
});
