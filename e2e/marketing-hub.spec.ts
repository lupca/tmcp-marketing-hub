
import { test, expect } from '@playwright/test';

test.describe('Marketing Hub End-to-End User Flows', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Mock Auth
        await page.route('**/api/collections/users/auth-with-password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'fake-jwt-token',
                    record: { id: 'user1', email: 'test@example.com', name: 'Test User' }
                })
            });
        });

        // 2. Mock Workspaces
        await page.route('**/api/collections/workspaces/records*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({
                        items: [{ id: 'ws1', name: 'Global Workspace', created: '2023-01-01' }],
                        totalItems: 1
                    })
                });
            } else { await route.continue(); }
        });

        // Login
        await page.goto('/');
        await page.fill('input[type="email"], input[placeholder*="Email"]', 'test@example.com');
        await page.fill('input[type="password"], input[placeholder*="Password"]', 'password123');
        await page.click('button:has-text("Sign in")');

        await expect(page).toHaveURL(/\//);

        // 3. Select workspace
        const wsBtn = page.locator('button:has-text("Select Workspace"), button:has-text("Global Workspace")');
        await expect(wsBtn).toBeVisible();
        const text = await wsBtn.innerText();
        if (text.includes('Select Workspace')) {
            await wsBtn.click();
            await page.click('button:has-text("Global Workspace")');
        }
    });

    async function navigateTo(page, label, urlPart) {
        await page.click(`nav a:has-text("${label}")`);
        await expect(page).toHaveURL(new RegExp(urlPart));
    }

    test('Worksheets CRUD', async ({ page }) => {
        await navigateTo(page, 'Worksheets', '/worksheets');
        await expect(page.locator('h2')).toContainText('Worksheets');

        // Create
        await page.route('**/api/collections/worksheets/records', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'w1', title: 'New WS' }) });
            }
        });
        await page.click('button:has-text("New Worksheet")');
        await page.fill('div:has(> label:has-text("Title")) input', 'New WS');
        await page.click('button:has-text("Save")');

        // MOCK List
        await page.route('**/api/collections/worksheets/records*', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ items: [{ id: 'w1', title: 'New WS', status: 'draft', created: '2023-01-01' }], totalItems: 1 })
            });
        });
        await page.reload();

        // Edit
        await page.route('**/api/collections/worksheets/records/w1', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'w1', title: 'Updated' }) });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Edit"]', { force: true });
        await page.fill('div:has(> label:has-text("Title")) input', 'Updated');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();

        // Delete
        await page.route('**/api/collections/worksheets/records/w1', async route => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Delete"]', { force: true });
        await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    });

    test('Brand Identities CRUD', async ({ page }) => {
        await navigateTo(page, 'My Brand', '/brands');

        // Create
        await page.route('**/api/collections/brand_identities/records', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'b1', brand_name: 'Brand Alpha' }) });
            }
        });
        await page.click('button:has-text("New Brand")');
        await page.fill('div:has(> label:has-text("Brand Name")) input', 'Brand Alpha');
        await page.click('button:has-text("Save")');

        // Mock List
        await page.route('**/api/collections/brand_identities/records*', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ items: [{ id: 'b1', brand_name: 'Brand Alpha' }], totalItems: 1 })
            });
        });
        await page.reload();

        // Edit
        await page.route('**/api/collections/brand_identities/records/b1', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'b1', brand_name: 'Brand Beta' }) });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Edit"]', { force: true });
        await page.fill('div:has(> label:has-text("Brand Name")) input', 'Brand Beta');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();

        // Delete
        await page.route('**/api/collections/brand_identities/records/b1', async route => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Delete"]', { force: true });
        await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    });

    test('Customer Personas CRUD', async ({ page }) => {
        await navigateTo(page, 'Customers', '/customers');

        // Create
        await page.route('**/api/collections/customer_personas/records', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'p1', persona_name: 'Persona A' }) });
            }
        });
        await page.click('button:has-text("New Persona")');
        await page.fill('div:has(> label:has-text("Persona Name")) input', 'Persona A');
        await page.click('button:has-text("Save")');

        // Mock List
        await page.route('**/api/collections/brand_identities/records*', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ items: [], totalItems: 0 })
            });
        });
        await page.route('**/api/collections/customer_personas/records*', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ items: [{ id: 'p1', persona_name: 'Persona A' }], totalItems: 1 })
            });
        });
        await page.reload();

        // Edit
        await page.route('**/api/collections/customer_personas/records/p1', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'p1', persona_name: 'Persona B' }) });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Edit"]', { force: true });
        await page.fill('div:has(> label:has-text("Persona Name")) input', 'Persona B');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();

        // Delete
        await page.route('**/api/collections/customer_personas/records/p1', async route => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Delete"]', { force: true });
        await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    });

    test('Marketing Campaigns CRUD', async ({ page }) => {
        await navigateTo(page, 'Campaigns', '/campaigns');

        // Create
        await page.route('**/api/collections/marketing_campaigns/records', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'c1', name: 'Camp A' }) });
            }
        });
        await page.click('button:has-text("New Campaign")');
        await page.fill('div:has(> label:has-text("Campaign Name")) input', 'Camp A');
        await page.click('button:has-text("Save")');

        // Mock List
        await page.route('**/api/collections/marketing_campaigns/records*', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ items: [{ id: 'c1', name: 'Camp A', status: 'planned' }], totalItems: 1 })
            });
        });
        await page.reload();

        // Edit
        await page.route('**/api/collections/marketing_campaigns/records/c1', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'c1', name: 'Camp B' }) });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Edit"]', { force: true });
        await page.fill('div:has(> label:has-text("Campaign Name")) input', 'Camp B');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();

        // Delete
        await page.route('**/api/collections/marketing_campaigns/records/c1', async route => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
            } else {
                await route.fallback();
            }
        });
        await page.click('button[title="Delete"]', { force: true });
        await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    });

    test('Social Posts CRUD', async ({ page }) => {
        // Mock campaigns for dropdown
        await page.route('**/api/collections/marketing_campaigns/records*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({ items: [{ id: 'c1', name: 'Camp A' }], totalItems: 1 })
                });
                return;
            }
            await route.continue();
        });

        // Dynamic list data
        const masterItems = [{
            id: 'm1',
            core_message: 'Hello master content',
            approval_status: 'pending',
            campaign_id: 'c1',
            created: '2023-01-01'
        }];
        const variantItems: any[] = [];

        await page.route('**/api/collections/master_contents/records*', async route => {
            const method = route.request().method();
            if (method === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'm1' }) });
                return;
            }
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({ items: masterItems, totalItems: masterItems.length })
                });
                return;
            }
            await route.continue();
        });

        await page.route('**/api/collections/platform_variants/records*', async route => {
            const method = route.request().method();
            if (method === 'POST') {
                variantItems.push({
                    id: 'pv1',
                    master_content_id: 'm1',
                    platform: 'facebook',
                    adapted_copy: 'Hello variant',
                    publish_status: 'draft',
                });
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'pv1' }) });
                return;
            }
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({ items: variantItems, totalItems: variantItems.length })
                });
                return;
            }
            await route.continue();
        });

        await navigateTo(page, 'Social Posts', '/social-posts');
        await page.waitForURL('**/social-posts');
        await page.waitForSelector('h2:has-text("Social Posts")');

        // Create Master Content
        await page.click('button:has-text("New Content")');
        await page.fill('textarea[placeholder*="key message"]', 'Hello master content');
        await page.selectOption('select:has(option:has-text("Camp A"))', 'c1');
        await page.click('button:has-text("Save")');

        await expect(page.locator('p:has-text("Hello master content")')).toBeVisible();
        await expect(page.locator('span:has-text("Camp A")')).toBeVisible();

        // Add Variant
        await page.click('button:has-text("Add Variant")');
        await page.fill('textarea[placeholder*="platform-specific"]', 'Hello variant');
        await page.click('button:has-text("Save")');

        // Show variants
        await page.click('button:has-text("Show variants")');
        await expect(page.locator('text=Hello variant')).toBeVisible();

        // Edit variant
        await page.route('**/api/collections/platform_variants/records/pv1', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'pv1', adapted_copy: 'Updated' }) });
                return;
            }
            await route.continue();
        });
        await page.click('table button[title="Edit"]', { force: true });
        await page.fill('textarea[placeholder*="platform-specific"]', 'Updated');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();

        // Delete variant
        await page.route('**/api/collections/platform_variants/records/pv1', async route => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
                return;
            }
            await route.continue();
        });
        await page.click('table button[title="Delete"]', { force: true });
        await page.click('button:has-text("Confirm"), button:has-text("Delete")');
    });

});
