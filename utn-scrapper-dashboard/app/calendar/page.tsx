'use client';

import { useEffect, useState } from 'react';
import { CalendarEvent, Activity } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDate, getDaysUntilDue, isDueSoon, isOverdue } from '@/lib/utils';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, allCourses] = await Promise.all([
          api.events.getAll(),
          api.courses.getAll(),
        ]);

        setEvents(eventsData);

        const allActivities = await Promise.all(
          allCourses.map(c => api.activities.getByCourse(c.id))
        ).then(results => results.flat());
        setActivities(allActivities);
      } catch (error) {
        console.error('Error loading calendar:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const upcomingActivities = activities
    .filter(a => a.dueDate && (isDueSoon(a.dueDate, 30) || isOverdue(a.dueDate)))
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());

  const upcomingEvents = events
    .filter(e => e.dueDate && (isDueSoon(e.dueDate, 30) || isOverdue(e.dueDate)))
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());

  if (loading) return <div>Cargando calendario...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Calendario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Actividades Próximas</h2>
          <div className="space-y-3">
            {upcomingActivities.map(activity => {
              const daysUntil = getDaysUntilDue(activity.dueDate);
              const overdue = isOverdue(activity.dueDate);

              return (
                <div
                  key={activity.id}
                  className={`p-4 border rounded-lg ${
                    overdue ? 'bg-red-50 border-red-300' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{activity.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        overdue
                          ? 'bg-red-200 text-red-800'
                          : daysUntil! <= 3
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {overdue
                        ? 'Vencida'
                        : `${daysUntil} ${daysUntil === 1 ? 'día' : 'días'}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{activity.type}</p>
                  <p className="text-sm font-medium">{formatDate(activity.dueDate!)}</p>
                </div>
              );
            })}
            {upcomingActivities.length === 0 && (
              <p className="text-gray-500">No hay actividades próximas</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Eventos de Calendario</h2>
          <div className="space-y-3">
            {upcomingEvents.map(event => {
              const daysUntil = getDaysUntilDue(event.dueDate);
              const overdue = isOverdue(event.dueDate);

              return (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg ${
                    overdue ? 'bg-red-50 border-red-300' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    {event.dueDate && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          overdue
                            ? 'bg-red-200 text-red-800'
                            : daysUntil! <= 3
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-purple-200 text-purple-800'
                        }`}
                      >
                        {overdue
                          ? 'Vencido'
                          : `${daysUntil} ${daysUntil === 1 ? 'día' : 'días'}`}
                      </span>
                    )}
                  </div>
                  {event.dueDate && (
                    <p className="text-sm font-medium">{formatDate(event.dueDate)}</p>
                  )}
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 block"
                    >
                      Ver evento →
                    </a>
                  )}
                </div>
              );
            })}
            {upcomingEvents.length === 0 && (
              <p className="text-gray-500">No hay eventos próximos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
