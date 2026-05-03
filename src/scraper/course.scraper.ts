import { Page } from 'playwright';
import { ScrapedActivity, ScrapedMaterial } from './types';
import { logger } from '../utils/logger';
import { parseSpanishDate } from '../utils/dates';
import { COURSE_SELECTORS, extractActivityTypeFromUrl, extractTypeFromClassName } from './selectors';
import { saveHtmlSnapshot, saveScreenshot } from './debug.service';

export async function scrapeCourseContent(
  page: Page,
  courseUrl: string,
  courseId: string
): Promise<{ activities: ScrapedActivity[]; materials: ScrapedMaterial[] }> {
  const activities: ScrapedActivity[] = [];
  const materials: ScrapedMaterial[] = [];

  try {
    await page.goto(courseUrl, { waitUntil: 'networkidle' }).catch(() => {});

    // Save debug snapshot
    if (process.env.DEBUG_MODE === 'true') {
      await saveHtmlSnapshot(page, `course-${courseId}.html`);
      await saveScreenshot(page, `course-${courseId}.png`);
    }

    // Get all activities and materials using centralized selector
    const items = await page.$$eval('[data-type], .activity, .resource, [class*="activity"]', (elements) => {
      return elements.map(el => {
        const link = el.querySelector('a');
        const href = link?.getAttribute('href') || '';
        const text = link?.textContent?.trim() || el.textContent?.trim() || '';
        const dataType = el.getAttribute('data-type') || el.className || '';
        const timeInfo = el.querySelector('.due, .duedateinfo, [class*="due"]')?.textContent?.trim() || '';

        return {
          href,
          text,
          dataType,
          timeInfo,
          html: el.outerHTML.substring(0, 200),
        };
      });
    });

    logger.log(`Found ${items.length} items in course ${courseId}`);

    for (const item of items) {
      try {
        if (!item.href) continue;

        // Determine item type
        const isActivity = item.dataType.includes('assign') || item.dataType.includes('quiz') ||
                          item.dataType.includes('forum') || item.href.includes('/mod/');

        const isMaterial = item.dataType.includes('resource') || item.dataType.includes('folder') ||
                          item.dataType.includes('url') || item.href.includes('/resource/');

        // Try to extract ID from URL
        let externalId = '';
        try {
          const url = new URL(item.href, page.url());
          externalId = url.searchParams.get('id') || url.pathname;
        } catch {
          externalId = `${courseId}_${item.text.substring(0, 10)}`;
        }

        if (isActivity) {
          const dueDate = parseSpanishDate(item.timeInfo);
          activities.push({
            externalId,
            courseId,
            title: item.text,
            type: extractActivityType(item.dataType, item.href),
            url: item.href,
            description: undefined,
            dueDate: dueDate || undefined,
            status: 'pending',
          });
        } else if (isMaterial) {
          materials.push({
            externalId,
            courseId,
            title: item.text,
            type: extractMaterialType(item.dataType, item.href),
            url: item.href,
          });
        }
      } catch (error) {
        logger.debug(`Failed to parse item: ${item.text}`);
      }
    }

    logger.success(`✅ Course ${courseId}: ${activities.length} activities, ${materials.length} materials`);
  } catch (error) {
    logger.error(`Course scrape failed for ${courseId}`, error);
  }

  return { activities, materials };
}

function extractActivityType(dataType: string, url: string): string {
  // Use centralized type extraction
  return extractTypeFromClassName(dataType, url);
}

function extractMaterialType(dataType: string, url: string): string {
  // Use centralized type extraction
  const type = extractTypeFromClassName(dataType, url);
  // Enhance with file extension detection
  if (url.includes('.pdf')) return 'pdf';
  if (url.match(/\.(doc|docx)$/i)) return 'document';
  if (url.match(/\.(xls|xlsx)$/i)) return 'spreadsheet';
  return type;
}
