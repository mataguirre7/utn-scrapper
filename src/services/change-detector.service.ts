import { supabase } from '../db/supabase';
import { hashObject } from '../utils/hash';
import { ScrapedCourse, ScrapedActivity, ScrapedMaterial, ScrapedCalendarEvent } from '../scraper/types';

export interface Change {
  type: 'new' | 'updated' | 'deleted';
  entityType: 'course' | 'activity' | 'material' | 'event';
  entityId: string;
  entityName: string;
  details?: string;
}

export async function detectCourseChanges(scrapedCourses: ScrapedCourse[]): Promise<Change[]> {
  const changes: Change[] = [];

  // Get existing courses for comparison
  const { data: existingCourses, error } = await supabase.from('Course').select('externalId, rawHash');
  if (error) throw error;
  const existingMap = new Map((existingCourses || []).map((c: any) => [c.externalId, c]));

  for (const scraped of scrapedCourses) {
    // Hash used for idempotent change detection (SHA256 of entire object)
    // Allows detecting if anything changed without storing raw data
    const hash = hashObject(scraped);
    const existing = existingMap.get(scraped.externalId);

    if (!existing) {
      // New course
      changes.push({
        type: 'new',
        entityType: 'course',
        entityId: scraped.externalId,
        entityName: scraped.name,
      });
    } else if (existing.rawHash !== hash) {
      // Updated course (something changed)
      changes.push({
        type: 'updated',
        entityType: 'course',
        entityId: scraped.externalId,
        entityName: scraped.name,
        details: `Name or URL changed`,
      });
    }
  }

  return changes;
}

export async function detectActivityChanges(activities: ScrapedActivity[]): Promise<Change[]> {
  const changes: Change[] = [];

  const { data: existingActivities, error } = await supabase.from('Activity').select('externalId, rawHash, title, dueDate, description');
  if (error) throw error;
  const existingMap = new Map(
    (existingActivities || []).map((a: any) => [a.externalId, a])
  );

  for (const scraped of activities) {
    const hash = hashObject(scraped);
    const existing = existingMap.get(scraped.externalId);

    if (!existing) {
      changes.push({
        type: 'new',
        entityType: 'activity',
        entityId: scraped.externalId,
        entityName: scraped.title,
        details: `Type: ${scraped.type}`,
      });
    } else if ((existing as any).rawHash !== hash) {
      const details = [];
      if ((existing as any).title !== scraped.title) details.push('title');
      if ((existing as any).dueDate !== scraped.dueDate) details.push('due date');
      if ((existing as any).description !== scraped.description) details.push('description');

      changes.push({
        type: 'updated',
        entityType: 'activity',
        entityId: scraped.externalId,
        entityName: scraped.title,
        details: details.length > 0 ? `Changed: ${details.join(', ')}` : undefined,
      });
    }
  }

  return changes;
}

export async function detectMaterialChanges(materials: ScrapedMaterial[]): Promise<Change[]> {
  const changes: Change[] = [];

  const { data: existingMaterials, error } = await supabase.from('Material').select('externalId, rawHash, title');
  if (error) throw error;
  const existingMap = new Map(
    (existingMaterials || []).map((m: any) => [m.externalId, m])
  );

  for (const scraped of materials) {
    const hash = hashObject(scraped);
    const existing = existingMap.get(scraped.externalId);

    if (!existing) {
      changes.push({
        type: 'new',
        entityType: 'material',
        entityId: scraped.externalId,
        entityName: scraped.title,
        details: `Type: ${scraped.type}`,
      });
    } else if ((existing as any).rawHash !== hash) {
      changes.push({
        type: 'updated',
        entityType: 'material',
        entityId: scraped.externalId,
        entityName: scraped.title,
      });
    }
  }

  return changes;
}

export async function detectEventChanges(events: ScrapedCalendarEvent[]): Promise<Change[]> {
  const changes: Change[] = [];

  const { data: existingEvents, error } = await supabase.from('CalendarEvent').select('externalId, rawHash, title');
  if (error) throw error;
  const existingMap = new Map(
    (existingEvents || []).map((e: any) => [e.externalId, e])
  );

  for (const scraped of events) {
    const hash = hashObject(scraped);
    const existing = existingMap.get(scraped.externalId);

    if (!existing) {
      changes.push({
        type: 'new',
        entityType: 'event',
        entityId: scraped.externalId,
        entityName: scraped.title,
      });
    } else if ((existing as any).rawHash !== hash) {
      changes.push({
        type: 'updated',
        entityType: 'event',
        entityId: scraped.externalId,
        entityName: scraped.title,
      });
    }
  }

  return changes;
}
