'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Course, Activity, NotificationLog } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDate, getDaysUntilDue, isDueSoon } from '@/lib/utils';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesData, notificationsData] = await Promise.all([
          api.courses.getAll(),
          api.notifications.getAll(7),
        ]);
        setCourses(coursesData);
        setNotifications(notificationsData);

        const allActivities = await Promise.all(
          coursesData.map(c => api.activities.getByCourse(c.id))
        ).then(results => results.flat());
        setActivities(allActivities);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const upcomingActivities = activities
    .filter(a => isDueSoon(a.dueDate, 7))
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Cursos" value={courses.length} />
        <StatCard label="Actividades" value={activities.length} />
        <StatCard label="Próximos (7 días)" value={upcomingActivities.length} />
        <StatCard label="Cambios (7 días)" value={notifications.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Próximas Actividades</h2>
          <div className="space-y-3">
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map(activity => (
                <div key={activity.id} className="p-3 border rounded-lg bg-white hover:shadow-md">
                  <p className="font-semibold">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.type}</p>
                  {activity.dueDate && (
                    <p className="text-sm font-medium text-orange-600">
                      Vence: {formatDate(activity.dueDate)} ({getDaysUntilDue(activity.dueDate)} días)
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No hay actividades próximas</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Cambios Recientes</h2>
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notif => (
              <div key={notif.id} className="p-3 border rounded-lg bg-white text-sm">
                <p className="font-semibold">{notif.entityType}</p>
                <p className="text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-500">{formatDate(notif.sentAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/courses" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Ver Cursos
        </Link>
        <Link href="/calendar" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Calendario
        </Link>
        <Link href="/changes" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Cambios
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 bg-white border rounded-lg">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
