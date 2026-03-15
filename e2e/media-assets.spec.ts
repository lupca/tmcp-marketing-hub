import { expect, test } from '@playwright/test';

test.describe('Media Assets - End to End', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/api/collections/users/auth-with-password', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'fake-jwt-token',
                    record: { id: 'user1', email: 'test@example.com', name: 'Test User' },
                }),
            });
        });

        await page.route('**/api/collections/workspaces/records*', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        items: [{ id: 'ws1', name: 'Global Workspace', created: '2023-01-01' }],
                        totalItems: 1,
                    }),
                });
                return;
            }
            await route.continue();
        });

        const mediaAssets = [
            {
                id: 'asset-1',
                collectionId: 'pbc_media_assets',
                collectionName: 'media_assets',
                workspace_id: 'ws1',
                file: 'hero.png',
                file_type: 'image',
                aspect_ratio: '16:9',
                tags: ['launch'],
                created: '2026-03-01 00:00:00.000Z',
                updated: '2026-03-01 00:00:00.000Z',
            },
        ];

        const cleanupPatches: Array<{ collection: string; body: unknown }> = [];

        await page.route('**/api/collections/media_assets/records**', async (route) => {
            const method = route.request().method();
            const url = route.request().url();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        items: mediaAssets,
                        page: 1,
                        perPage: 200,
                        totalItems: mediaAssets.length,
                        totalPages: 1,
                    }),
                });
                return;
            }

            if (method === 'POST') {
                mediaAssets.push({
                    id: 'asset-2',
                    collectionId: 'pbc_media_assets',
                    collectionName: 'media_assets',
                    workspace_id: 'ws1',
                    file: 'campaign.mp4',
                    file_type: 'video',
                    aspect_ratio: '16:9',
                    tags: ['promo'],
                    created: '2026-03-02 00:00:00.000Z',
                    updated: '2026-03-02 00:00:00.000Z',
                });
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'asset-2' }) });
                return;
            }

            if (method === 'PATCH' && url.includes('/asset-1')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ...mediaAssets[0], tags: ['updated'] }),
                });
                return;
            }

            if (method === 'DELETE' && url.includes('/asset-1')) {
                mediaAssets.splice(
                    mediaAssets.findIndex((item) => item.id === 'asset-1'),
                    1,
                );
                await route.fulfill({ status: 204, body: '' });
                return;
            }

            await route.continue();
        });

        const usageGetHandler = async (collection: string, route: any) => {
            if (route.request().method() === 'GET') {
                let items: any[] = [];
                if (collection === 'brand_identities') items = [{ id: 'brand-1' }];
                if (collection === 'customer_personas') items = [{ id: 'customer-1' }];
                if (collection === 'master_contents') items = [{ id: 'master-1', primaryMediaIds: ['asset-1', 'keep'] }];
                if (collection === 'platform_variants') items = [{ id: 'variant-1', platformMediaIds: ['asset-1'] }];
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ items, totalItems: items.length, page: 1, perPage: 200, totalPages: 1 }),
                });
                return true;
            }
            return false;
        };

        await page.route('**/api/collections/brand_identities/records**', async (route) => {
            if (await usageGetHandler('brand_identities', route)) return;
            if (route.request().method() === 'PATCH') {
                cleanupPatches.push({ collection: 'brand_identities', body: route.request().postDataJSON() });
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'brand-1' }) });
                return;
            }
            await route.continue();
        });

        await page.route('**/api/collections/customer_personas/records**', async (route) => {
            if (await usageGetHandler('customer_personas', route)) return;
            if (route.request().method() === 'PATCH') {
                cleanupPatches.push({ collection: 'customer_personas', body: route.request().postDataJSON() });
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'customer-1' }) });
                return;
            }
            await route.continue();
        });

        await page.route('**/api/collections/master_contents/records**', async (route) => {
            if (await usageGetHandler('master_contents', route)) return;
            if (route.request().method() === 'PATCH') {
                cleanupPatches.push({ collection: 'master_contents', body: route.request().postDataJSON() });
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'master-1' }) });
                return;
            }
            await route.continue();
        });

        await page.route('**/api/collections/platform_variants/records**', async (route) => {
            if (await usageGetHandler('platform_variants', route)) return;
            if (route.request().method() === 'PATCH') {
                cleanupPatches.push({ collection: 'platform_variants', body: route.request().postDataJSON() });
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'variant-1' }) });
                return;
            }
            await route.continue();
        });

        await page.addInitScript(() => {
            (window as any).__mediaCleanupPatches = [];
        });

        await page.goto('/');
        await page.fill('input[type="email"], input[placeholder*="Email"]', 'test@example.com');
        await page.fill('input[type="password"], input[placeholder*="Password"]', 'password123');
        await page.click('button:has-text("Sign in")');
        await expect(page).toHaveURL(/\//);

        const wsBtn = page.locator('button:has-text("Select Workspace"), button:has-text("Global Workspace")');
        await expect(wsBtn).toBeVisible();
        const text = await wsBtn.innerText();
        if (text.includes('Select Workspace')) {
            await wsBtn.click();
            await page.click('button:has-text("Global Workspace")');
        }

        await page.click('nav a:has-text("Media Assets")');
        await expect(page).toHaveURL(/media-assets/);
        await expect(page.locator('h2:has-text("Media Assets")')).toBeVisible();

        await page.exposeFunction('__getCleanupPatches', async () => cleanupPatches);
    });

    test('create, edit and delete with relation cleanup', async ({ page }) => {
        await expect(page.locator('text=hero.png')).toBeVisible();

        await page.click('button:has-text("New Asset")');
        await page.setInputFiles('#media-file', {
            name: 'campaign.mp4',
            mimeType: 'video/mp4',
            buffer: Buffer.from('fake-video-content'),
        });
        await page.selectOption('#media-file-type', 'video');
        await page.fill('#media-tags', 'promo, social');
        await page.click('button:has-text("Save")');

        await expect(page.locator('text=campaign.mp4')).toBeVisible();

        const heroRow = page.locator('tbody tr', { hasText: 'hero.png' });
        await heroRow.locator('button[title="Edit"]').click();
        await page.fill('#media-tags', 'updated');
        await page.selectOption('#media-aspect-ratio', '1:1');
        await page.click('button:has-text("Save")');
        await expect(page.locator('h2:has-text("Edit Media Asset")')).not.toBeVisible();

        await heroRow.locator('button[title="Delete"]').click({ force: true });
        await expect(page.locator('h2:has-text("Delete Media Asset")')).toBeVisible();
        await page.click('button:has-text("Delete Asset")');

        await expect(page.locator('tbody tr', { hasText: 'hero.png' })).toHaveCount(0);

        const cleanupCalls = await page.evaluate(async () => {
            return (window as any).__getCleanupPatches();
        });

        expect(cleanupCalls).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ collection: 'brand_identities', body: { logo: null } }),
                expect.objectContaining({ collection: 'customer_personas', body: { avatar: null } }),
                expect.objectContaining({ collection: 'master_contents' }),
                expect.objectContaining({ collection: 'platform_variants' }),
            ]),
        );
    });
});
