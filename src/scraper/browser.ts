import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export async function createBrowserContext(): Promise<BrowserContext> {
  const browser = await chromium.launch({
    headless: config.debug.headless,
  });

  // Create storage directory if it doesn't exist
  if (!fs.existsSync(config.storage.storageDirPath)) {
    fs.mkdirSync(config.storage.storageDirPath, { recursive: true });
  }

  // Load existing session if available
  let storageState;
  if (fs.existsSync(config.storage.sessionPath)) {
    try {
      const sessionData = fs.readFileSync(config.storage.sessionPath, 'utf-8');
      storageState = JSON.parse(sessionData);
      logger.log('📦 Using saved session');
    } catch (e) {
      logger.warn('Failed to load saved session, will create new one');
    }
  }

  const context = await browser.newContext({
    storageState,
  });

  return context;
}

export async function saveSessionState(context: BrowserContext): Promise<void> {
  const storageState = await context.storageState();
  fs.writeFileSync(config.storage.sessionPath, JSON.stringify(storageState, null, 2));
  logger.log('💾 Session saved');
}

export async function closeBrowserContext(context: BrowserContext): Promise<void> {
  await context.browser()?.close();
}

export async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      return;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Navigation attempt ${i + 1}/${maxRetries} failed: ${url}`);
      await page.waitForTimeout(1000);
    }
  }

  throw lastError || new Error(`Failed to navigate to ${url} after ${maxRetries} attempts`);
}
