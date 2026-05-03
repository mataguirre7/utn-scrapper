import { Page } from 'playwright';
import { ScrapedCalendarEvent } from './types';
import { logger } from '../utils/logger';
import { parseSpanishDate } from '../utils/dates';
import { CALENDAR_SELECTORS } from './selectors';
import { saveHtmlSnapshot, saveScreenshot } from './debug.service';

export async function scrapeCalendarEvents(page: Page): Promise<ScrapedCalendarEvent[]> {
  const events: ScrapedCalendarEvent[] = [];

  try {
    logger.log('📅 Scraping calendar events...');

    // Try to find calendar section using centralized selector
    const calendarSection = await page.$(CALENDAR_SELECTORS.calendarSection);

    if (!calendarSection) {
      logger.debug('No calendar section found. Check CALENDAR_SELECTORS.calendarSection');
      return [];
    }

    // Save debug snapshot
    if (process.env.DEBUG_MODE === 'true') {
      await saveHtmlSnapshot(page, 'calendar.html');
      await saveScreenshot(page, 'calendar.png');
    }

    // Get event elements
    const eventElements = await calendarSection.$$(CALENDAR_SELECTORS.eventItem);

    for (const el of eventElements) {
      try {
        const link = await el.$('a');
        const href = await link?.getAttribute('href');
        const text = await el.textContent();

        if (!text) continue;

        // Try to extract date from text or attributes
        let dueDate: Date | undefined;
        const dateAttr = await el.getAttribute('data-date');
        if (dateAttr) {
          const parsed = parseSpanishDate(dateAttr);
          if (parsed) dueDate = parsed;
        }

        const textDate = parseSpanishDate(text);
        if (textDate && !dueDate) {
          dueDate = textDate;
        }

        events.push({
          externalId: `cal_${Date.now()}_${Math.random()}`,
          title: text.trim(),
          url: href || undefined,
          dueDate: dueDate,
        });
      } catch (error) {
        logger.debug('Failed to parse calendar event');
      }
    }

    logger.success(`✅ Found ${events.length} calendar events`);
    return events;
  } catch (error) {
    logger.error('Calendar scrape failed', error);
    return [];
  }
}
