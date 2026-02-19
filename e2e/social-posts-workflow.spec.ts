import { test, expect } from '@playwright/test';

test.describe('Social Posts - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to social posts page
    await page.goto('/social-posts');
    await page.waitForLoadState('networkidle');
  });

  test('complete master content generation and selection workflow', async ({ page }) => {
    // Step 1: Click "New Content"
    await page.click('button:has-text("New Content")');
    
    // Step 2: Select campaign
    await page.selectOption('select[name="campaign"]', { index: 1 });
    
    // Step 3: Select language
    await page.selectOption('select:has-text("Vietnamese")', 'Vietnamese');
    
    // Step 4: Click "Generate AI"
    await page.click('button:has-text("Generate via AI")');
    
    // Step 5: Wait for ActivityLog to show completion
    await page.waitForSelector('text=Generation completed successfully', { timeout: 60000 });
    
    // Step 6: Check that both version buttons are present
    await expect(page.locator('button:has-text("Core Message")')).toBeVisible();
    await expect(page.locator('button:has-text("Extended Message")')).toBeVisible();
    
    // Step 7: Toggle to Extended Message
    await page.click('button:has-text("Extended Message")');
    await expect(page.locator('text=Extended Message:')).toBeVisible();
    
    // Step 8: Toggle back to Core Message
    await page.click('button:has-text("Core Message")');
    await expect(page.locator('text=Core Message:')).toBeVisible();
    
    // Step 9: Verify hashtags and CTA are displayed
    await expect(page.locator('text=Suggested Hashtags:')).toBeVisible();
    await expect(page.locator('text=Call to Action:')).toBeVisible();
    
    // Step 10: Click "Use This Content"
    await page.click('button:has-text("Use This Content")');
    
    // Step 11: Verify form is populated
    const coreMessageTextarea = page.locator('textarea[placeholder*="key message"]');
    await expect(coreMessageTextarea).not.toHaveValue('');
    
    // Step 12: Save
    await page.click('button:has-text("Save")');
    
    // Step 13: Verify success message
    await expect(page.locator('text=Saved successfully')).toBeVisible({ timeout: 5000 });
  });

  test('complete variant generation with all metadata fields', async ({ page }) => {
    // Prerequisite: Ensure at least one master content exists
    // Or create one first
    
    // Step 1: Click "Add Variant" on first master content
    await page.click('button:has-text("Add Variant")').first();
    
    // Step 2: Select multiple platforms
    await page.click('button:has-text("Generate Multiple via AI")');
    
    // Step 3: Select Facebook, Instagram, LinkedIn
    await page.check('input[type="checkbox"][value="facebook"]');
    await page.check('input[type="checkbox"][value="instagram"]');
    await page.check('input[type="checkbox"][value="linkedin"]');
    
    // Step 4: Select language
    await page.selectOption('select:has-text("Vietnamese")', 'Vietnamese');
    
    // Step 5: Click "Generate Variants"
    await page.click('button:has-text("Generate Variants")');
    
    // Step 6: Wait for generation to complete
    await page.waitForSelector('text=Generation completed successfully', { timeout: 90000 });
    
    // Step 7: Verify platform tabs are visible
    await expect(page.locator('button:has-text("FACEBOOK")')).toBeVisible();
    await expect(page.locator('button:has-text("INSTAGRAM")')).toBeVisible();
    await expect(page.locator('button:has-text("LINKEDIN")')).toBeVisible();
    
    // Step 8: Switch to Instagram tab
    await page.click('button:has-text("INSTAGRAM")');
    
    // Step 9: Verify all metadata sections are displayed
    await expect(page.locator('text=Adapted Copy:')).toBeVisible();
    await expect(page.locator('text=Hashtags:')).toBeVisible();
    await expect(page.locator('text=Call to Action:')).toBeVisible();
    await expect(page.locator('text=Summary:')).toBeVisible();
    await expect(page.locator('text=Character Count:')).toBeVisible();
    await expect(page.locator('text=Platform Tips:')).toBeVisible();
    await expect(page.locator('text=Confidence:')).toBeVisible();
    
    // Step 10: Click "Use This Variant"
    await page.click('button:has-text("Use This Variant")');
    
    // Step 11: Verify all form fields are populated
    const adaptedCopyTextarea = page.locator('textarea[placeholder*="platform-specific"]');
    await expect(adaptedCopyTextarea).not.toHaveValue('');
    
    // Check metadata fields
    const hashtagsInput = page.locator('input[placeholder*="hashtags"]');
    await expect(hashtagsInput).not.toHaveValue('');
    
    const ctaInput = page.locator('input[placeholder*="Call to Action"]');
    await expect(ctaInput).not.toHaveValue('');
    
    const summaryTextarea = page.locator('textarea[placeholder*="summary"]');
    await expect(summaryTextarea).not.toHaveValue('');
    
    // Step 12: Save
    await page.click('button:has-text("Save")');
    
    // Step 13: Verify success
    await expect(page.locator('text=Saved successfully')).toBeVisible({ timeout: 5000 });
  });

  test('variant metadata persistence on edit', async ({ page }) => {
    // Step 1: Create a variant with metadata (assumes previous test succeeded)
    
    // Step 2: Find and click edit on first variant
    await page.click('button:has-text("Edit")').first();
    
    // Step 3: Verify all metadata fields are loaded
    const hashtagsInput = page.locator('input[placeholder*="hashtags"]');
    const hashtagsValue = await hashtagsInput.inputValue();
    expect(hashtagsValue).toBeTruthy();
    
    const ctaInput = page.locator('input[placeholder*="Call to Action"]');
    const ctaValue = await ctaInput.inputValue();
    expect(ctaValue).toBeTruthy();
    
    // Step 4: Expand SEO section
    await page.click('summary:has-text("SEO Settings")');
    
    // Step 5: Verify SEO fields if they were set
    const seoTitleInput = page.locator('input[placeholder*="SEO-optimized title"]');
    await expect(seoTitleInput).toBeVisible();
    
    // Step 6: Modify a field
    await hashtagsInput.fill('#updated #hashtags');
    
    // Step 7: Save
    await page.click('button:has-text("Save")');
    
    // Step 8: Reopen edit
    await page.click('button:has-text("Edit")').first();
    
    // Step 9: Verify modification was saved
    const updatedHashtags = await page.locator('input[placeholder*="hashtags"]').inputValue();
    expect(updatedHashtags).toBe('#updated #hashtags');
  });

  test('error handling during generation', async ({ page }) => {
    // Step 1: Create variant with invalid master content ID
    // This will trigger an error
    
    // Step 2: Start generation (will be mocked to fail)
    await page.click('button:has-text("Generate via AI")');
    
    // Step 3: Wait for error message
    await expect(page.locator('text=Error:').first()).toBeVisible({ timeout: 10000 });
    
    // Step 4: Click "Try Again"
    await page.click('button:has-text("Try Again")');
    
    // Step 5: Verify can retry
    await expect(page.locator('button:has-text("Generate via AI")')).toBeVisible();
  });

  test('cancel during generation', async ({ page }) => {
    // Step 1: Start generation
    await page.click('button:has-text("New Content")');
    await page.selectOption('select[name="campaign"]', { index: 1 });
    await page.click('button:has-text("Generate via AI")');
    
    // Step 2: Wait a moment for generation to start
    await page.waitForSelector('text=Generating:', { timeout: 5000 });
    
    // Step 3: Click Cancel
    await page.click('button:has-text("Cancel")');
    
    // Step 4: Verify activity log is hidden
    await expect(page.locator('text=Generation Activity')).not.toBeVisible();
    
    // Step 5: Verify form is not modified
    const coreMessageTextarea = page.locator('textarea[placeholder*="key message"]');
    await expect(coreMessageTextarea).toHaveValue('');
  });
});

test.describe('Social Posts - Platform Variant Tabs', () => {
  test('switches between platform tabs correctly', async ({ page }) => {
    await page.goto('/social-posts');
    
    // Generate multi-platform variants
    await page.click('button:has-text("Add Variant")').first();
    await page.click('button:has-text("Generate Multiple via AI")');
    await page.check('input[value="facebook"]');
    await page.check('input[value="twitter"]');
    await page.click('button:has-text("Generate Variants")');
    
    await page.waitForSelector('text=Generation completed successfully', { timeout: 60000 });
    
    // Initially on Facebook tab
    await expect(page.locator('button:has-text("FACEBOOK")')).toHaveClass(/bg-green-600/);
    
    // Click Twitter tab
    await page.click('button:has-text("TWITTER")');
    
    // Twitter tab should be active
    await expect(page.locator('button:has-text("TWITTER")')).toHaveClass(/bg-green-600/);
    
    // Content should change
    await expect(page.locator('text=TWITTER').first()).toBeVisible();
  });
});
