import { test, expect } from '@playwright/test';

test.describe('Batch Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to social posts page
    await page.goto('/social-posts');
    await page.waitForLoadState('networkidle');
  });

  test('complete batch generation workflow', async ({ page }) => {
    // Step 1: Click "Batch Generate"
    await page.click('button:has-text("Batch Generate")');
    
    // Verify modal is open
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).toBeVisible();
    
    // Step 2: Select campaign
    // Assuming there's at least one campaign in the dropdown
    await page.selectOption('select:has-text("Select a Campaign")', { index: 1 });
    
    // Step 3: Select language
    await page.selectOption('select:has-text("Vietnamese")', 'Vietnamese');
    
    // Step 4: Set number of master posts
    const numMastersInput = page.locator('input[type="number"]');
    await numMastersInput.fill('2');
    
    // Step 5: Select platforms
    await page.check('input[type="checkbox"] >> nth=0'); // facebook
    await page.check('input[type="checkbox"] >> nth=1'); // instagram
    
    // Step 6: Click "Generate"
    await page.click('button:has-text("Generate")');
    
    // Step 7: Wait for ActivityLog to show completion
    // Batch generation might take a while, so we increase the timeout
    await page.waitForSelector('text=Batch generation completed.', { timeout: 120000 });
    
    // Step 8: Verify success message and counts
    await expect(page.locator('text=Master posts:')).toBeVisible();
    await expect(page.locator('text=Variants:')).toBeVisible();
    
    // Step 9: Close modal
    await page.click('button:has-text("Cancel")');
    
    // Verify modal is closed
    await expect(page.locator('h2:has-text("Batch Generate Posts")')).not.toBeVisible();
  });
});
