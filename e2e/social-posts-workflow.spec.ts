import { test, expect } from '@playwright/test';

test.describe('Social Posts - Complete Workflow', () => {
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

    // 3. Mock Social Posts page data BEFORE navigation
    await page.route('**/api/collections/marketing_campaigns/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [
              { id: 'c1', name: 'Summer Campaign', workspace_id: 'ws1' },
              { id: 'c2', name: 'Winter Campaign', workspace_id: 'ws1' }
            ],
            totalItems: 2
          })
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/collections/master_contents/records*', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'm1', ...body })
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/collections/platform_variants/records*', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'pv1', ...body })
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

    // Navigate to Social Posts
    await page.click('nav a:has-text("Social Posts")');
    await expect(page).toHaveURL(/social-posts/);
    await page.waitForSelector('h2:has-text("Social Posts")');
  });

  test('create master content with all form fields', async ({ page }) => {
    // Open the New Content modal
    await page.click('button:has-text("New Content")');
    await expect(page.locator('h2:has-text("Create Content")')).toBeVisible();

    // Verify form fields are present
    await expect(page.locator('label:has-text("Campaign")')).toBeVisible();
    await expect(page.locator('label:has-text("Core Message")')).toBeVisible();
    await expect(page.locator('label:has-text("Approval Status")')).toBeVisible();

    // Select campaign
    const campaignSelect = page.locator('select').first();
    await campaignSelect.selectOption('c1');
    await expect(campaignSelect).toHaveValue('c1');

    // Fill core message
    const coreMessage = page.locator('textarea[placeholder*="key message"]');
    await coreMessage.fill('Summer sale: 50% off all items this weekend only!');
    await expect(coreMessage).toHaveValue('Summer sale: 50% off all items this weekend only!');

    // Change approval status
    const approvalSelect = page.locator('select:has(option:has-text("Pending"))');
    await approvalSelect.selectOption('approved');
    await expect(approvalSelect).toHaveValue('approved');

    // Save
    await page.click('button:has-text("Save")');

    // Modal should close
    await expect(page.locator('h2:has-text("Create Content")')).not.toBeVisible();
  });

  test('create variant with metadata fields', async ({ page }) => {
    // First, set up a master content in mocked data
    await page.route('**/api/collections/master_contents/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [{
              id: 'm1',
              core_message: 'Summer sale content',
              approval_status: 'approved',
              campaign_id: 'c1',
              created: '2023-01-01'
            }],
            totalItems: 1
          })
        });
        return;
      }
      await route.continue();
    });
    await page.reload();
    await page.waitForSelector('h2:has-text("Social Posts")');

    // Wait for master content to appear
    await expect(page.locator('p:has-text("Summer sale content")')).toBeVisible();

    // Click "Add Variant"
    await page.click('button[title="Add Variant"]');
    await expect(page.locator('h2:has-text("Add Platform Variant")')).toBeVisible();

    // Select platform
    const platformSelect = page.locator('select:has(option:has-text("Facebook"))');
    await platformSelect.selectOption('facebook');

    // Fill adapted copy
    const adaptedCopy = page.locator('textarea[placeholder*="platform-specific"]');
    await adaptedCopy.fill('🔥 SUMMER SALE! 50% off everything this weekend!');

    // Fill metadata fields
    const hashtags = page.locator('input[placeholder*="#example"]');
    await hashtags.fill('#summersale #deals #50off');

    const cta = page.locator('input[placeholder*="Shop Now"]');
    await cta.fill('Shop Now');

    const summary = page.locator('textarea[placeholder*="Brief summary"]');
    await summary.fill('Weekend summer sale promotion');

    // Expand SEO settings
    await page.click('summary:has-text("SEO Settings")');
    await expect(page.locator('input[placeholder*="SEO-optimized title"]')).toBeVisible();

    const seoTitle = page.locator('input[placeholder*="SEO-optimized title"]');
    await seoTitle.fill('Summer Sale - 50% Off');

    const seoDesc = page.locator('textarea[placeholder*="SEO meta description"]');
    await seoDesc.fill('Get 50% off all items this weekend');

    const seoKeywords = page.locator('input[placeholder*="keyword1"]');
    await seoKeywords.fill('summer sale, discount, deals');

    // Change publish status
    const statusSelect = page.locator('select:has(option:has-text("Draft"))');
    await statusSelect.selectOption('scheduled');

    // Save the variant
    await page.click('button:has-text("Save")');

    // Modal should close
    await expect(page.locator('h2:has-text("Add Platform Variant")')).not.toBeVisible();
  });

  test('master content modal shows Generate AI button only when campaign is selected', async ({ page }) => {
    // Open New Content modal
    await page.click('button:has-text("New Content")');
    await expect(page.locator('h2:has-text("Create Content")')).toBeVisible();

    // Without campaign: Generate via AI button should NOT be visible
    await expect(page.locator('button:has-text("Generate via AI")')).not.toBeVisible();

    // Select a campaign
    const campaignSelect = page.locator('select').first();
    await campaignSelect.selectOption('c1');

    // Now the Generate AI button and language select should appear
    await expect(page.locator('button:has-text("Generate via AI")')).toBeVisible();
    await expect(page.locator('select:has(option:has-text("Vietnamese"))')).toBeVisible();

    // Cancel the modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h2:has-text("Create Content")')).not.toBeVisible();
  });

  test('variant modal shows platform-dependent AI generation options', async ({ page }) => {
    // Load a master content
    await page.route('**/api/collections/master_contents/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [{
              id: 'm1',
              core_message: 'Test content for variants',
              approval_status: 'approved',
              campaign_id: 'c1',
              created: '2023-01-01'
            }],
            totalItems: 1
          })
        });
        return;
      }
      await route.continue();
    });
    await page.reload();
    await page.waitForSelector('h2:has-text("Social Posts")');
    await expect(page.locator('p:has-text("Test content for variants")')).toBeVisible();

    // Click Add Variant
    await page.click('button[title="Add Variant"]');
    await expect(page.locator('h2:has-text("Add Platform Variant")')).toBeVisible();

    // Verify "Generate Multiple via AI" button is visible
    await expect(page.locator('button:has-text("Generate Multiple via AI")')).toBeVisible();

    // Click "Generate Multiple via AI" to see platform selection view
    await page.click('button:has-text("Generate Multiple via AI")');
    await expect(page.locator('label:has-text("Select Platforms to Generate")')).toBeVisible();

    // Verify all 8 platform checkboxes are shown
    for (const platform of ['Facebook', 'Instagram', 'Linkedin', 'Twitter', 'Tiktok', 'Youtube', 'Blog', 'Email']) {
      await expect(page.locator(`label:has-text("${platform}")`)).toBeVisible();
    }

    // Select some platforms
    await page.locator('label:has-text("Facebook") input[type="checkbox"]').check();
    await page.locator('label:has-text("Instagram") input[type="checkbox"]').check();

    // Verify "Generate Variants" button is enabled
    const genBtn = page.locator('button:has-text("Generate Variants")');
    await expect(genBtn).toBeEnabled();

    // Click "Back" to return to single-variant form
    await page.click('button:has-text("Back")');
    await expect(page.locator('label:text-is("Platform")')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="platform-specific"]')).toBeVisible();

    // Cancel modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h2:has-text("Add Platform Variant")')).not.toBeVisible();
  });

  test('edit and delete variant workflow', async ({ page }) => {
    // Pre-load master content with a variant
    await page.route('**/api/collections/master_contents/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [{
              id: 'm1',
              core_message: 'Content with variants',
              approval_status: 'approved',
              campaign_id: 'c1',
              created: '2023-01-01'
            }],
            totalItems: 1
          })
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/collections/platform_variants/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [{
              id: 'pv1',
              master_content_id: 'm1',
              platform: 'facebook',
              adapted_copy: 'Original FB post content',
              publish_status: 'draft',
              hashtags: '#original',
              call_to_action: 'Learn More'
            }],
            totalItems: 1
          })
        });
        return;
      }
      await route.continue();
    });

    await page.reload();
    await page.waitForSelector('h2:has-text("Social Posts")');
    await expect(page.locator('p:has-text("Content with variants")')).toBeVisible();

    // Show variants
    await page.click('button:has-text("Show variants")');
    await expect(page.locator('text=Original FB post content')).toBeVisible();

    // Edit variant
    await page.route('**/api/collections/platform_variants/records/pv1', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'pv1', adapted_copy: 'Updated FB content' })
        });
        return;
      }
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
        return;
      }
      await route.continue();
    });

    await page.click('table button[title="Edit"]');
    await expect(page.locator('h2:has-text("Edit Platform Variant")')).toBeVisible();

    // Modify adapted copy
    const adaptedCopy = page.locator('textarea[placeholder*="platform-specific"]');
    await adaptedCopy.fill('Updated FB content');
    await page.click('button:has-text("Save")');
    await expect(page.locator('h2:has-text("Edit Platform Variant")')).not.toBeVisible();

    // Delete variant
    await page.click('table button[title="Delete"]');
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');
  });
});
