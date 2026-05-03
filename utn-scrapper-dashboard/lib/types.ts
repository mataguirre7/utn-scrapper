export interface Course {
  id: string;
  externalId: string;
  name: string;
  url: string;
  active: boolean;
  activitiesCount: number;
  materialsCount: number;
  lastSeenAt: string;
  firstSeenAt: string;
}

export interface Activity {
  id: string;
  externalId: string;
  courseId: string;
  title: string;
  type: string;
  url?: string;
  description?: string;
  dueDate?: string;
  status: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Task {
  id: string;
  externalId: string;
  activityId: string;
  title: string;
  type?: string;
  url?: string;
  description?: string;
  dueDate?: string;
  status?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Material {
  id: string;
  externalId: string;
  courseId: string;
  title: string;
  type: string;
  url?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface CalendarEvent {
  id: string;
  externalId: string;
  courseId?: string;
  title: string;
  url?: string;
  startDate?: string;
  dueDate?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface NotificationLog {
  id: string;
  entityType: string;
  entityId: string;
  notificationType: string;
  message: string;
  sent: boolean;
  sentAt: string;
  createdAt: string;
}

export interface CourseDetail extends Course {
  activities: Activity[];
  materials: Material[];
  calendarEvents: CalendarEvent[];
}
