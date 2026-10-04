import { defineConfig, devices } from '@playwright/test';

// CHROMIUM_PATH points at a pre-installed Chromium (offline CI); unset, Playwright's own browser is used.
const executablePath = process.env.CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  workers: 1, // headless WebGL is software-rendered; one worker keeps frame timing realistic
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Reduced motion also selects the light render tier, which software WebGL can keep up with.
    reducedMotion: 'reduce',
    launchOptions: { executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
