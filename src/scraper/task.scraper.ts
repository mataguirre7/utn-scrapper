import { Page } from 'playwright';
import { ScrapedTask } from './types';
import { logger } from '../utils/logger';

export async function scrapeActivityTasks(
  page: Page,
  activityUrl: string,
  activityExternalId: string
): Promise<ScrapedTask[]> {
  try {
    await page.goto(activityUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const tasks: ScrapedTask[] = [];

    // Get all task containers within activity
    // Structure: div.contenido > section > div.task or similar
    const taskElements = await page.locator(
      '[data-type="activity"] [role="region"], .activity-item, .task-item, li:has([href*="view.php"])'
    ).all();

    logger.log(`  Found ${taskElements.length} task containers in activity ${activityExternalId}`);

    for (const element of taskElements) {
      try {
        const titleEl = await element.locator('h3, h4, .activity-name, strong').first();
        const title = await titleEl?.textContent();
        if (!title || title.trim().length === 0) continue;

        const linkEl = await element.locator('a[href*="view.php"], a[href*="course"]').first();
        const url = await linkEl?.getAttribute('href');

        const statusEl = await element.locator('[class*="status"], [aria-label*="status"]');
        const status = await statusEl?.textContent();

        // Extract description if available
        const descEl = await element.locator('p, .description, .activity-description').first();
        const description = await descEl?.textContent();

        // Try to find due date
        const dateEl = await element.locator('[class*="date"], time, .due-date').first();
        const dateText = await dateEl?.textContent();
        let dueDate: Date | undefined;
        if (dateText) {
          const parsed = new Date(dateText);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed;
          }
        }

        // Generate external ID from title + activity ID
        const externalId = `${activityExternalId}-${title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .substring(0, 50)}`;

        tasks.push({
          externalId,
          activityId: activityExternalId,
          title: title.trim(),
          description: description?.trim(),
          type: 'subtask',
          url: url ? (url.startsWith('http') ? url : `https://frsn.cvg.utn.edu.ar${url}`) : undefined,
          status: status?.trim(),
          dueDate,
        });
      } catch (error) {
        logger.debug(`Error parsing task element: ${error}`);
      }
    }

    return tasks;
  } catch (error) {
    logger.warn(`Failed to scrape tasks for activity ${activityExternalId}: ${error}`);
    return [];
  }
}
