import cron from 'node-cron';
import { createBrowserContext, closeBrowserContext } from './scraper/browser';
import { chromium } from 'playwright';
import { ensureAuthenticated } from './scraper/auth';
import { enableDebugMode, saveHtmlSnapshot, saveScreenshot } from './scraper/debug.service';
import { performSync } from './services/sync.service';
import { config } from './config/env';
import { logger } from './utils/logger';

const COMMAND = process.argv[2];

async function runSync(): Promise<void> {
  logger.log('🔄 Starting sync...');
  const startTime = Date.now();

  const context = await createBrowserContext();

  try {
    const result = await performSync(context);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.log(`\n📊 Sync Results (${duration}s):`);
    logger.log(`  Courses: ${result.coursesFound}`);
    logger.log(`  Activities: ${result.activitiesFound}`);
    logger.log(`  Materials: ${result.materialsFound}`);
    logger.log(`  Events: ${result.eventsFound}`);

    if (result.errors.length > 0) {
      logger.warn(`  Errors: ${result.errors.length}`);
      result.errors.forEach(err => logger.warn(`    - ${err}`));
    }
  } finally {
    await closeBrowserContext(context);
  }
}

async function startWatcher(): Promise<void> {
  logger.log(`⏱️  Starting watcher (interval: ${config.scraping.intervalMinutes} minutes)`);
  logger.log('Press Ctrl+C to stop\n');

  // Run sync immediately
  await runSync().catch(err => logger.error('Sync error', err));

  // Then schedule repeating task
  const cronExpression = `*/${config.scraping.intervalMinutes} * * * *`;
  cron.schedule(cronExpression, async () => {
    logger.log('\n---');
    await runSync().catch(err => logger.error('Sync error', err));
  });

  // Keep process alive
  process.on('SIGINT', async () => {
    logger.log('\n👋 Shutting down...');
    process.exit(0);
  });
}

async function debugBrowser(): Promise<void> {
  logger.log('🐛 Opening browser in debug mode...');
  logger.log(`URL: ${config.cvg.url}`);

  if (config.debug.mode) {
    await enableDebugMode();
  }

  const browser = await chromium.launch({
    headless: config.debug.headless,
  });

  const context = await browser.newContext();

  try {
    const page = await ensureAuthenticated(context);

    if (config.debug.mode) {
      await saveHtmlSnapshot(page, 'debug-after-login.html');
      await saveScreenshot(page, 'debug-after-login.png');
      logger.log('📸 Snapshots saved to storage/debug/');
    }

    logger.log('Browser window open. Inspect and debug, then close manually.');

    // Keep process alive
    process.on('SIGINT', async () => {
      logger.log('\n👋 Closing...');
      await browser.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Debug login failed', error);
    await browser.close();
    throw error;
  }
}

async function main(): Promise<void> {
  logger.log('🚀 CVG UTN Assistant\n');

  switch (COMMAND) {
    case 'sync':
      await runSync();
      process.exit(0);
      break;

    case 'start':
      await startWatcher();
      break;

    case 'debug:browser':
      await debugBrowser();
      break;

    default:
      logger.log('Available commands:');
      logger.log('  npm run sync          - Run sync once');
      logger.log('  npm start             - Start watcher daemon');
      logger.log('  npm run debug:browser - Open browser in debug mode\n');
      logger.log('Example: npm run sync');
      process.exit(0);
  }
}

main().catch(error => {
  logger.error('Fatal error', error);
  process.exit(1);
});
