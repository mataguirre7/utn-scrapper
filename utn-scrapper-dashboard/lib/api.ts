import { supabase } from './supabase';
import { Course, Activity, Material, CalendarEvent, NotificationLog, CourseDetail } from './types';

export const api = {
  courses: {
    async getAll(): Promise<Course[]> {
      const { data, error } = await supabase
        .from('Course')
        .select('*');
      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        activitiesCount: 0,
        materialsCount: 0,
      }));
    },

    async getById(id: string): Promise<CourseDetail> {
      const { data: course, error: courseError } = await supabase
        .from('Course')
        .select('*')
        .eq('id', id)
        .single();
      if (courseError) throw courseError;

      const { data: activities } = await supabase
        .from('Activity')
        .select('*')
        .eq('courseId', id);

      const { data: materials } = await supabase
        .from('Material')
        .select('*')
        .eq('courseId', id);

      const { data: calendarEvents } = await supabase
        .from('CalendarEvent')
        .select('*')
        .eq('courseId', id);

      return {
        ...course,
        activities: (activities || []).map(a => ({
          ...a,
          dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : undefined,
        })),
        materials: materials || [],
        calendarEvents: (calendarEvents || []).map(e => ({
          ...e,
          dueDate: e.dueDate ? new Date(e.dueDate).toISOString() : undefined,
        })),
        activitiesCount: activities?.length || 0,
        materialsCount: materials?.length || 0,
      };
    },
  },

  activities: {
    async getByCourse(courseId: string): Promise<Activity[]> {
      const { data, error } = await supabase
        .from('Activity')
        .select('*')
        .eq('courseId', courseId);
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : undefined,
      }));
    },
  },

  materials: {
    async getByCourse(courseId: string): Promise<Material[]> {
      const { data, error } = await supabase
        .from('Material')
        .select('*')
        .eq('courseId', courseId);
      if (error) throw error;
      return data || [];
    },
  },

  events: {
    async getAll(): Promise<CalendarEvent[]> {
      const { data, error } = await supabase
        .from('CalendarEvent')
        .select('*');
      if (error) throw error;
      return (data || []).map(e => ({
        ...e,
        dueDate: e.dueDate ? new Date(e.dueDate).toISOString() : undefined,
        startDate: e.startDate ? new Date(e.startDate).toISOString() : undefined,
      }));
    },
  },

  notifications: {
    async getAll(days: number = 30): Promise<NotificationLog[]> {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('NotificationLog')
        .select('*')
        .gte('sentAt', since.toISOString())
        .order('sentAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  },
};
