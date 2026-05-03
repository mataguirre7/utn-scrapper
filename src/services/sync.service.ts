import { BrowserContext } from 'playwright';
import { randomUUID } from 'crypto';
import { supabase } from '../db/supabase';
import { ensureAuthenticated } from '../scraper/auth';
import { scrapeDashboard } from '../scraper/dashboard.scraper';
import { scrapeCourseContent } from '../scraper/course.scraper';
import { scrapeCalendarEvents } from '../scraper/calendar.scraper';
import { SyncResult } from '../scraper/types';
import {
  detectCourseChanges,
  detectActivityChanges,
  detectMaterialChanges,
  detectEventChanges,
  Change,
} from './change-detector.service';
import { notifyChanges } from './notification.service';
import { summarizeChangesWithOpenAI } from './openai.service';
import { hashObject } from '../utils/hash';
import { logger } from '../utils/logger';

export async function performSync(browserContext: BrowserContext): Promise<SyncResult> {
  const result: SyncResult = {
    coursesFound: 0,
    activitiesFound: 0,
    materialsFound: 0,
    eventsFound: 0,
    errors: [],
  };

  let page;
  const allChanges: Change[] = [];
  const startTime = Date.now();

  try {
    // Authenticate
    logger.log('Step 1/4: Authenticating...');
    page = await ensureAuthenticated(browserContext);

    // Step 2: Scrape dashboard for courses
    logger.log('Step 2/4: Scraping dashboard for courses...');
    const scrapedCourses = await scrapeDashboard(page);
    result.coursesFound = scrapedCourses.length;
    logger.log(`  Found ${scrapedCourses.length} courses`);

    // Detect course changes and save courses
    const courseChanges = await detectCourseChanges(scrapedCourses);
    allChanges.push(...courseChanges);

    for (const course of scrapedCourses) {
      const hash = hashObject(course);
      const { data: existing, error: findError } = await supabase
        .from('Course')
        .select()
        .eq('externalId', course.externalId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (!existing) {
        const { error: createError } = await supabase
          .from('Course')
          .insert({
            id: randomUUID(),
            externalId: course.externalId,
            name: course.name,
            url: course.url,
            rawHash: hash,
          });

        if (createError) throw createError;
      } else if (existing.rawHash !== hash) {
        const { error: updateError } = await supabase
          .from('Course')
          .update({
            name: course.name,
            url: course.url,
            rawHash: hash,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      }
    }

    // Step 3: Scrape each course's content (resilient to errors)
    logger.log('Step 3/4: Scraping course contents...');
    for (const course of scrapedCourses) {
      try {
        logger.log(`  Processing: ${course.name}`);
        const { activities, materials } = await scrapeCourseContent(page, course.url, course.externalId);

        result.activitiesFound += activities.length;
        result.materialsFound += materials.length;
        logger.log(`    → ${activities.length} activities, ${materials.length} materials`);

        // Get internal course ID from database
        const { data: savedCourse, error: courseError } = await supabase
          .from('Course')
          .select()
          .eq('externalId', course.externalId)
          .single();

        if (courseError || !savedCourse) {
          throw new Error(`Course not found in database: ${course.externalId}`);
        }

        // Detect and save activities
        const activityChanges = await detectActivityChanges(activities);
        allChanges.push(...activityChanges);

        for (const activity of activities) {
          const hash = hashObject(activity);
          const { data: existingActivities, error: findActivityError } = await supabase
            .from('Activity')
            .select()
            .eq('externalId', activity.externalId)
            .eq('courseId', savedCourse.id)
            .limit(1);

          if (findActivityError) throw findActivityError;

          const existing = existingActivities && existingActivities.length > 0 ? existingActivities[0] : null;

          if (!existing) {
            const { error: createError } = await supabase
              .from('Activity')
              .insert({
                id: randomUUID(),
                externalId: activity.externalId,
                courseId: savedCourse.id,
                title: activity.title,
                type: activity.type,
                url: activity.url,
                description: activity.description,
                dueDate: activity.dueDate,
                status: activity.status,
                rawHash: hash,
              });

            if (createError) throw createError;
          } else if (existing.rawHash !== hash) {
            const { error: updateError } = await supabase
              .from('Activity')
              .update({
                title: activity.title,
                type: activity.type,
                url: activity.url,
                description: activity.description,
                dueDate: activity.dueDate,
                status: activity.status,
                rawHash: hash,
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          }
        }

        // Detect and save materials
        const materialChanges = await detectMaterialChanges(materials);
        allChanges.push(...materialChanges);

        for (const material of materials) {
          const hash = hashObject(material);
          const { data: existingMaterials, error: findMaterialError } = await supabase
            .from('Material')
            .select()
            .eq('externalId', material.externalId)
            .eq('courseId', savedCourse.id)
            .limit(1);

          if (findMaterialError) throw findMaterialError;

          const existing = existingMaterials && existingMaterials.length > 0 ? existingMaterials[0] : null;

          if (!existing) {
            const { error: createError } = await supabase
              .from('Material')
              .insert({
                id: randomUUID(),
                externalId: material.externalId,
                courseId: savedCourse.id,
                title: material.title,
                type: material.type,
                url: material.url,
                rawHash: hash,
              });

            if (createError) throw createError;
          } else if (existing.rawHash !== hash) {
            const { error: updateError } = await supabase
              .from('Material')
              .update({
                title: material.title,
                type: material.type,
                url: material.url,
                rawHash: hash,
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          }
        }
      } catch (error) {
        const msg = `Failed to scrape course ${course.externalId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(msg);
        result.errors.push(msg);
      }
    }

    // Step 4: Scrape calendar events
    logger.log('Step 4/4: Scraping calendar events...');
    const events = await scrapeCalendarEvents(page);
    result.eventsFound = events.length;
    logger.log(`  Found ${events.length} calendar events`);

    const eventChanges = await detectEventChanges(events);
    allChanges.push(...eventChanges);
    logger.log(`  Detected ${eventChanges.length} changes`);

    for (const event of events) {
      const hash = hashObject(event);
      const { data: existing, error: findError } = await supabase
        .from('CalendarEvent')
        .select()
        .eq('externalId', event.externalId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (!existing) {
        const { error: createError } = await supabase
          .from('CalendarEvent')
          .insert({
            id: randomUUID(),
            externalId: event.externalId,
            courseId: event.courseId,
            title: event.title,
            url: event.url,
            startDate: event.startDate,
            dueDate: event.dueDate,
            rawHash: hash,
          });

        if (createError) throw createError;
      } else if (existing.rawHash !== hash) {
        const { error: updateError } = await supabase
          .from('CalendarEvent')
          .update({
            courseId: event.courseId,
            title: event.title,
            url: event.url,
            startDate: event.startDate,
            dueDate: event.dueDate,
            rawHash: hash,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      }
    }

    // Handle notifications if there are changes (idempotent: check if already notified)
    if (allChanges.length > 0) {
      logger.log(`📢 Found ${allChanges.length} changes`);

      // Build notification message
      const changesHash = hashObject(allChanges);
      const { data: notificationLogs, error: notifError } = await supabase
        .from('NotificationLog')
        .select()
        .eq('entityId', changesHash)
        .order('sentAt', { ascending: false })
        .limit(1);

      if (notifError) throw notifError;

      const lastNotif = notificationLogs && notificationLogs.length > 0 ? notificationLogs[0] : null;
      const alreadyNotified = lastNotif && (Date.now() - new Date(lastNotif.sentAt).getTime()) < 3600000; // 1 hour

      if (!alreadyNotified) {
        logger.log('Preparing and sending notifications...');

        // Get OpenAI summary (safe: only sends change summaries, not credentials)
        const summary = await summarizeChangesWithOpenAI(allChanges);

        const notifications = [
          {
            title: summary?.summary || `${allChanges.length} cambios detectados`,
            description: summary?.action || allChanges.slice(0, 3).map(c => `• ${c.entityName}`).join('\n'),
            priority: summary?.priority || ('medium' as const),
            emoji: summary?.urgent ? '🔴' : undefined,
            entityId: changesHash,
          },
        ];

        await notifyChanges(notifications);
      } else {
        logger.log(`⊘ Skipping duplicate notification (last sent ${Math.floor((Date.now() - new Date(lastNotif!.sentAt).getTime()) / 60000)} min ago)`);
      }
    } else {
      logger.log('No changes detected');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.success(`✅ Sync completed in ${duration}s`);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown sync error';
    result.errors.push(msg);
    logger.error('❌ Sync failed during main flow', error);
    return result;
  } finally {
    try {
      if (page) {
        await page.close();
        logger.debug('Browser page closed');
      }
    } catch (cleanupError) {
      logger.warn('Failed to close browser page', cleanupError);
    }
  }
}
