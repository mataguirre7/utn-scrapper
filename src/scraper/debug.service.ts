import { Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const DEBUG_DIR = path.join(process.cwd(), 'storage', 'debug');

export interface DebugSnapshot {
  name: string;
  html?: boolean;
  screenshot?: boolean;
}

/**
 * Enable debug mode to save HTML snapshots and screenshots
 * Useful for adjusting selectors when CVG layout changes
 */
export async function enableDebugMode(): Promise<void> {
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    logger.log(`🐛 Debug mode enabled. Snapshots will be saved to: ${DEBUG_DIR}`);
  }
}

/**
 * Save HTML snapshot of current page (without credentials or sensitive data)
 * Removes script tags and sensitive attributes to reduce noise
 */
export async function saveHtmlSnapshot(
  page: Page,
  filename: string,
  options?: { includeScripts?: boolean }
): Promise<void> {
  try {
    if (!fs.existsSync(DEBUG_DIR)) {
      fs.mkdirSync(DEBUG_DIR, { recursive: true });
    }

    let html = await page.content();

    // Remove script tags to reduce file size
    if (!options?.includeScripts) {
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<!-- script removed -->');
    }

    // Remove sensitive input values
    html = html.replace(/value="[^"]*"/g, 'value="[redacted]"');
    html = html.replace(/placeholder="[^"]*"/g, 'placeholder="[redacted]"');

    const filepath = path.join(DEBUG_DIR, filename);
    fs.writeFileSync(filepath, html);
    logger.log(`📄 HTML snapshot saved: ${filename} (${(html.length / 1024).toFixed(1)} KB)`);
  } catch (error) {
    logger.error(`Failed to save HTML snapshot: ${filename}`, error);
  }
}

/**
 * Save screenshot of current page
 * Useful for visual debugging
 */
export async function saveScreenshot(page: Page, filename: string): Promise<void> {
  try {
    if (!fs.existsSync(DEBUG_DIR)) {
      fs.mkdirSync(DEBUG_DIR, { recursive: true });
    }

    const filepath = path.join(DEBUG_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    logger.log(`📸 Screenshot saved: ${filename}`);
  } catch (error) {
    logger.error(`Failed to save screenshot: ${filename}`, error);
  }
}

/**
 * Save debug info about detected elements
 */
export async function saveSelectorDebugInfo(
  page: Page,
  selector: string,
  context: string
): Promise<{ count: number; preview: string[] }> {
  try {
    const elements = await page.$$(selector);
    const count = elements.length;

    const preview: string[] = [];
    for (let i = 0; i < Math.min(3, count); i++) {
      const text = await page.evaluate(el => el.textContent?.trim() || '', elements[i]);
      const html = await page.evaluate(el => el.outerHTML.substring(0, 100), elements[i]);
      preview.push(`${text || html}`);
    }

    if (count > 0) {
      logger.log(`  ✓ ${context}: ${count} found`);
      preview.forEach(p => logger.debug(`    → ${p.substring(0, 60)}`));
    } else {
      logger.warn(`  ✗ ${context}: 0 found (selector may need updating)`);
    }

    return { count, preview };
  } catch (error) {
    logger.debug(`Selector debug info failed for: ${selector}`);
    return { count: 0, preview: [] };
  }
}

/**
 * Generate a debug report with selector test results
 */
export async function generateSelectorReport(page: Page, filename: string): Promise<void> {
  try {
    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      selectors: {},
    };

    // Test some common selectors
    const testSelectors = {
      'Course links': 'a[href*="/course/view.php"]',
      'Activities': '[data-type], .activity',
      'Calendar': '[class*="calendar"]',
      'User menu': '.usermenu',
    };

    for (const [name, selector] of Object.entries(testSelectors)) {
      const count = await page.$$(selector).then(els => els.length);
      report.selectors[name] = { selector, found: count };
    }

    const filepath = path.join(DEBUG_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    logger.log(`📊 Selector report saved: ${filename}`);
  } catch (error) {
    logger.error('Failed to generate selector report', error);
  }
}

export function getDebugDir(): string {
  return DEBUG_DIR;
}
