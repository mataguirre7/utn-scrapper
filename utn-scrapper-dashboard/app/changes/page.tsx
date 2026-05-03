'use client';

import { useEffect, useState } from 'react';
import { NotificationLog } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function ChangesPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await api.notifications.getAll(30);
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const types = Array.from(new Set(notifications.map(n => n.entityType)));
  const filtered = filterType ? notifications.filter(n => n.entityType === filterType) : notifications;

  if (loading) return <div>Cargando cambios...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Cambios Detectados</h1>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('')}
          className={`px-4 py-2 rounded-lg ${
            filterType === '' ? 'bg-blue-600 text-white' : 'bg-white border'
          }`}
        >
          Todos ({notifications.length})
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg ${
              filterType === type ? 'bg-blue-600 text-white' : 'bg-white border'
            }`}
          >
            {type} ({notifications.filter(n => n.entityType === type).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(notif => (
          <div
            key={notif.id}
            className="p-4 bg-white border rounded-lg hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{notif.entityType}</h3>
              <span className="text-xs text-gray-500">{formatDateTime(notif.sentAt)}</span>
            </div>
            <p className="text-gray-700 mb-2">{notif.message}</p>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                {notif.notificationType}
              </span>
              {notif.sent && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  Enviada
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500">No hay cambios para este período</p>
      )}
    </div>
  );
}
