export interface ScrapedCourse {
  externalId: string;
  name: string;
  url: string;
}

export interface ScrapedActivity {
  externalId: string;
  courseId: string;
  title: string;
  type: string;
  url?: string;
  description?: string;
  dueDate?: Date;
  status?: string;
}

export interface ScrapedMaterial {
  externalId: string;
  courseId: string;
  title: string;
  type: string;
  url?: string;
}

export interface ScrapedCalendarEvent {
  externalId: string;
  courseId?: string;
  title: string;
  url?: string;
  startDate?: Date;
  dueDate?: Date;
}

export interface ScrapedTask {
  externalId: string;
  activityId: string;
  title: string;
  type?: string;
  url?: string;
  description?: string;
  dueDate?: Date;
  status?: string;
}

export interface SyncResult {
  coursesFound: number;
  activitiesFound: number;
  materialsFound: number;
  eventsFound: number;
  tasksFound: number;
  errors: string[];
}
