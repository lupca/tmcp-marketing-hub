
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 3,
    reporter: 'list',
    timeout: 60000, // 60s per test
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 15000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
    },
});
