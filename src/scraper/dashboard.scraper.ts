import { Page } from 'playwright';
import { ScrapedCourse } from './types';
import { logger } from '../utils/logger';
import { DASHBOARD_SELECTORS, extractCourseIdFromUrl } from './selectors';
import { saveHtmlSnapshot, saveScreenshot } from './debug.service';

export async function scrapeDashboard(page: Page): Promise<ScrapedCourse[]> {
  const courses: ScrapedCourse[] = [];

  try {
    logger.log('📚 Scraping dashboard for courses...');

    // Save debug snapshot
    if (process.env.DEBUG_MODE === 'true') {
      await saveHtmlSnapshot(page, 'dashboard.html');
      await saveScreenshot(page, 'dashboard.png');
    }

    // Get all course links using centralized selector
    const courseLinks = await page.$$eval('a', (links) => {
      return links
        .map(link => ({
          href: link.getAttribute('href') || '',
          text: link.textContent?.trim() || '',
        }))
        .filter(item =>
          item.href.includes('/course/view.php') && item.text.length > 0
        );
    });

    if (courseLinks.length === 0) {
      logger.warn('⚠️  No courses found. Check DASHBOARD_SELECTORS.courseLinks');
      return [];
    }

    logger.log(`  Found ${courseLinks.length} courses`);

    for (const link of courseLinks) {
      try {
        const courseId = extractCourseIdFromUrl(link.href);

        if (courseId) {
          courses.push({
            externalId: courseId,
            name: link.text,
            url: link.href,
          });
          logger.debug(`    ✓ ${link.text} (ID: ${courseId})`);
        }
      } catch (error) {
        logger.debug(`Failed to parse course link: ${link.href}`);
      }
    }

    logger.success(`✅ Scraped ${courses.length} courses`);
    return courses;
  } catch (error) {
    logger.error('Dashboard scrape failed', error);
    if (process.env.DEBUG_MODE === 'true') {
      await saveScreenshot(page, 'dashboard-error.png').catch(() => {});
    }
    return [];
  }
}
