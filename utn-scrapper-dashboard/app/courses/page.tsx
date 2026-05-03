'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Course } from '@/lib/types';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await api.courses.getAll();
        setCourses(data);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Cargando cursos...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Cursos</h1>

      <input
        type="text"
        placeholder="Buscar cursos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(course => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <div className="p-4 bg-white border rounded-lg hover:shadow-lg transition cursor-pointer">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div>
                  <span className="font-medium">{course.activitiesCount}</span> actividades
                </div>
                <div>
                  <span className="font-medium">{course.materialsCount}</span> materiales
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Visto {formatRelative(course.lastSeenAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500">No se encontraron cursos</p>
      )}
    </div>
  );
}
