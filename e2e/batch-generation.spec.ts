import { test, expect } from '@playwright/test';

test.describe('Batch Generation Workflow', () => {
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
      } else {
        await route.continue();
      }
    });

    // 3. Mock Social Posts page data
    await page.route('**/api/collections/marketing_campaigns/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [
              { id: 'c1', name: 'Camp A', workspace_id: 'ws1' },
              { id: 'c2', name: 'Camp B', workspace_id: 'ws1' }
            ],
            totalItems: 2
          })
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/collections/master_contents/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/collections/platform_variants/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }
      await route.continue();
    });

    // Login
    await page.goto('/');
    await page.fill('input[type="email"], input[placeholder*="Email"]', 'test@example.com');
    await page.fill('input[type="password"], input[placeholder*="Password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await expect(page).toHaveURL(/\//);

    // Select workspace
    const wsBtn = page.locator('button:has-text("Select Workspace"), button:has-text("Global Workspace")');
    await expect(wsBtn).toBeVisible();
    const text = await wsBtn.innerText();
    if (text.includes('Select Workspace')) {
      await wsBtn.click();
      await page.click('button:has-text("Global Workspace")');
    }

    // Navigate to Social Posts page
    await page.click('nav a:has-text("Social Posts")');
    await expect(page).toHaveURL(/social-posts/);
    await page.waitForSelector('h2:has-text("Social Posts")');
  });

  test('batch generate modal opens and shows form elements', async ({ page }) => {
    // Click "Batch Generate" button in header
    await page.click('button:has-text("Batch Generate")');

    // Verify modal is open
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).toBeVisible();

    // Verify form elements exist
    await expect(page.locator('label:has-text("Campaign")')).toBeVisible();
    await expect(page.locator('label:has-text("Language")')).toBeVisible();
    await expect(page.locator('label:has-text("Number of Master Posts")')).toBeVisible();
    await expect(page.locator('label:has-text("Platforms")')).toBeVisible();

    // Verify campaign dropdown has options
    const campaignSelect = page.locator('select').first();
    await expect(campaignSelect).toBeVisible();
    await expect(campaignSelect.locator('option:has-text("Camp A")')).toBeAttached();
    await expect(campaignSelect.locator('option:has-text("Camp B")')).toBeAttached();

    // Verify number input exists with default value
    const numInput = page.locator('input[type="number"]');
    await expect(numInput).toBeVisible();
    await expect(numInput).toHaveValue('3');

    // Verify platform checkboxes
    await expect(page.locator('label:has-text("facebook")')).toBeVisible();
    await expect(page.locator('label:has-text("instagram")')).toBeVisible();
    await expect(page.locator('label:has-text("linkedin")')).toBeVisible();

    // Verify Generate button in modal footer
    const modalFooter = page.locator('.rounded-b-2xl');
    await expect(modalFooter.locator('button:has-text("Generate")')).toBeVisible();
    await expect(modalFooter.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('batch generate modal form interaction', async ({ page }) => {
    await page.click('button:has-text("Batch Generate")');
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).toBeVisible();

    // Select campaign
    const campaignSelect = page.locator('select').first();
    await campaignSelect.selectOption('c1');
    await expect(campaignSelect).toHaveValue('c1');

    // Change language
    const langSelect = page.locator('select').nth(1);
    await langSelect.selectOption('English');
    await expect(langSelect).toHaveValue('English');

    // Change number of master posts
    const numInput = page.locator('input[type="number"]');
    await numInput.fill('5');
    await expect(numInput).toHaveValue('5');

    // Toggle platform checkboxes
    const fbCheckbox = page.locator('label:has-text("facebook") input[type="checkbox"]');
    await fbCheckbox.check();
    await expect(fbCheckbox).toBeChecked();

    const igCheckbox = page.locator('label:has-text("instagram") input[type="checkbox"]');
    await igCheckbox.check();
    await expect(igCheckbox).toBeChecked();

    // Uncheck facebook
    await fbCheckbox.uncheck();
    await expect(fbCheckbox).not.toBeChecked();
  });

  test('batch generate modal closes on Cancel', async ({ page }) => {
    await page.click('button:has-text("Batch Generate")');
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).toBeVisible();

    // Click Cancel in footer
    const modalFooter = page.locator('.rounded-b-2xl');
    await modalFooter.locator('button:has-text("Cancel")').click();

    // Modal should be closed
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).not.toBeVisible();
  });

  test('batch generate modal closes on X button', async ({ page }) => {
    await page.click('button:has-text("Batch Generate")');
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).toBeVisible();

    // Click X button in modal header
    const modalHeader = page.locator('.flex.justify-between.items-center.p-5');
    await modalHeader.locator('button').click();

    // Modal should be closed
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).not.toBeVisible();
  });
});
