'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Task {
  id: string;
  activityId: string;
  activityTitle: string;
  title: string;
  description?: string;
  type?: string;
  dueDate: Date | null;
  status?: string;
  url?: string;
  courseName: string;
  courseId: string;
  materials: Array<{ title: string; type: string; url?: string }>;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await api.tasks.getUpcoming();
        setTasks(data);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  async function generatePlan() {
    if (tasks.length === 0) return;

    setGeneratingPlan(true);
    try {
      const response = await fetch('/api/tasks/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks),
      });

      const data = await response.json();
      if (data.plan) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setGeneratingPlan(false);
    }
  }

  if (loading) return <div>Cargando tareas...</div>;

  const urgentTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const days = Math.ceil((t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 1;
  });

  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const days = Math.ceil((t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 1 && days <= 3;
  });

  const upcomingTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const days = Math.ceil((t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 3;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Mis Tareas</h1>
        <button
          onClick={generatePlan}
          disabled={generatingPlan || tasks.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generatingPlan ? 'Generando plan...' : 'Generar Plan'}
        </button>
      </div>

      {plan && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
          <h2 className="text-2xl font-bold mb-4 text-purple-900">📋 Tu Plan Inteligente</h2>
          <div className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
            {plan}
          </div>
        </div>
      )}

      {urgentTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
            🔴 URGENTE
          </h2>
          {urgentTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {todayTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
            🟡 PRÓXIMOS DÍAS
          </h2>
          {todayTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {upcomingTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            🔵 MÁS ADELANTE
          </h2>
          {upcomingTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-center text-gray-500 text-lg">✨ ¡Sin tareas pendientes!</p>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const daysLeft = task.dueDate
    ? Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{task.courseName} / {task.activityTitle}</p>
          <h3 className="font-bold text-lg mb-1">{task.title}</h3>

          {task.description && (
            <p className="text-sm text-gray-700 mb-3">{task.description}</p>
          )}

          {task.materials.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">📚 Materiales:</p>
              <div className="flex flex-wrap gap-2">
                {task.materials.slice(0, 3).map((m, i) => (
                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {m.title}
                  </span>
                ))}
                {task.materials.length > 3 && (
                  <span className="text-xs text-gray-500">+{task.materials.length - 3} más</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
            >
              Abrir en CVG
            </a>
            <Link
              href={`/courses/${task.courseId}`}
              className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
            >
              Ver curso
            </Link>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">{task.type}</p>
          {daysLeft !== null && (
            <p className={`font-bold text-lg ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-blue-600'}`}>
              {daysLeft}d
            </p>
          )}
          {task.dueDate && (
            <p className="text-xs text-gray-500">
              {task.dueDate.toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
