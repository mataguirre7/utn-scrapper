const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  courses: {
    getAll: () => fetchAPI('/api/courses'),
    getById: (id: string) => fetchAPI(`/api/courses/${id}`),
  },
  activities: {
    getByCourse: (courseId: string) => fetchAPI(`/api/activities/course/${courseId}`),
    getById: (id: string) => fetchAPI(`/api/activities/${id}`),
  },
  materials: {
    getByCourse: (courseId: string) => fetchAPI(`/api/materials/course/${courseId}`),
    getById: (id: string) => fetchAPI(`/api/materials/${id}`),
  },
  events: {
    getAll: () => fetchAPI('/api/events'),
    getById: (id: string) => fetchAPI(`/api/events/${id}`),
  },
  notifications: {
    getAll: (days: number = 30) => fetchAPI(`/api/notifications?days=${days}`),
    getByEntity: (entityId: string) => fetchAPI(`/api/notifications/entity/${entityId}`),
  },
};
