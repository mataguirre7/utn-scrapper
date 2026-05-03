'use client';

import { useEffect, useState, use } from 'react';
import { CourseDetail, Activity, Material } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDate, getDaysUntilDue, getActivityTypeColor, getStatusColor, isOverdue } from '@/lib/utils';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activities' | 'materials' | 'info'>('activities');

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await api.courses.getById(id);
        setCourse(data);
      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [id]);

  if (loading) return <div>Cargando...</div>;
  if (!course) return <div>Curso no encontrado</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">{course.name}</h1>
        {course.url && (
          <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Ir al curso →
          </a>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Actividades</p>
            <p className="text-3xl font-bold">{course.activities.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Materiales</p>
            <p className="text-3xl font-bold">{course.materials.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Eventos</p>
            <p className="text-3xl font-bold">{course.calendarEvents.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        {(['activities', 'materials', 'info'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-b-2 ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent'
            }`}
          >
            {tab === 'activities' && `Actividades (${course.activities.length})`}
            {tab === 'materials' && `Materiales (${course.materials.length})`}
            {tab === 'info' && 'Información'}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'activities' && (
          <ActivityList activities={course.activities} />
        )}
        {activeTab === 'materials' && (
          <MaterialList materials={course.materials} />
        )}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">URL del curso</p>
              <p className="font-mono text-sm break-all">{course.url}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visto por última vez</p>
              <p>{formatDate(course.lastSeenAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Creado</p>
              <p>{formatDate(course.firstSeenAt)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3 text-left">Título</th>
            <th className="p-3 text-left">Tipo</th>
            <th className="p-3 text-left">Vencimiento</th>
            <th className="p-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {activities.map(activity => {
            const daysUntil = getDaysUntilDue(activity.dueDate);
            const overdue = isOverdue(activity.dueDate);

            return (
              <tr key={activity.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {activity.url ? (
                    <a href={activity.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {activity.title}
                    </a>
                  ) : (
                    activity.title
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </td>
                <td className="p-3">
                  {activity.dueDate ? (
                    <div className="flex flex-col">
                      <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                        {formatDate(activity.dueDate)}
                      </span>
                      {daysUntil !== null && !overdue && (
                        <span className={`text-xs ${daysUntil <= 3 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                          en {daysUntil} días
                        </span>
                      )}
                      {overdue && <span className="text-xs text-red-600 font-medium">Vencida</span>}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MaterialList({ materials }: { materials: Material[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {materials.map(material => (
        <div key={material.id} className="p-4 border rounded-lg bg-white hover:shadow-md">
          <h3 className="font-semibold mb-2">{material.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{material.type}</p>
          {material.url && (
            <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
              Descargar →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
